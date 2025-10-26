import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import axios from 'axios';
import Message from '../src/models/Message.js';

/**
 * Script: Reprice initialPriceUSD for messages (last 48h) using SolanaTracker historical price API.
 * Criteria:
 *  - message.createdAt >= now - 48h
 *  - tokenId present
 *  - initialPriceUSD present (we will replace with authoritative historical price)
 * Endpoint example:
 *  GET https://data.solanatracker.io/price/history/timestamp?token=<mint>&timestamp=<unix_seconds>
 * Headers:
 *  x-api-key: <API KEY>
 *
 * Environment variables:
 *  MONGO_URI (obrigatório)
 *  SOLANATRACKER_API_KEY (ou será usado valor passado via --apiKey)
 *  SOLANATRACKER_BASE_URL (opcional, default https://data.solanatracker.io)
 *  REPRICE_CONCURRENCY (opcional, default 3)
 *  DRY_RUN=true para não persistir alterações
 */

const BASE_URL = process.env.SOLANATRACKER_BASE_URL || 'https://data.solanatracker.io';
const API_KEY_CLI = process.argv.find(a => a.startsWith('--apiKey='))?.split('=')[1];
const API_KEY = API_KEY_CLI || process.env.SOLANATRACKER_API_KEY || process.env.SOLANA_TRACKER_API_KEY || process.env.SOLANATRACKER_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');
const CONCURRENCY = parseInt(process.env.REPRICE_CONCURRENCY || '3', 10);
const LOOKBACK_HOURS = 48;
const CUTOFF_DATE = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

if (!API_KEY) {
  console.error('Falta SOLANATRACKER_API_KEY (ou --apiKey=...)');
  process.exit(1);
}

async function fetchHistoricalPrice(tokenId, unixTs) {
  const url = `${BASE_URL}/price/history/timestamp`;
  try {
    const { data } = await axios.get(url, {
      params: { token: tokenId, timestamp: unixTs },
      headers: { 'x-api-key': API_KEY },
      timeout: 5000
    });
    if (data && typeof data.price === 'number') {
      return { price: data.price, raw: data };
    }
    return null;
  } catch (e) {
    if (e.response && e.response.status === 429) {
      // Rate limited: simple backoff
      await new Promise(r => setTimeout(r, 1500));
    }
    return null;
  }
}

// Novo fluxo: agrupa por tokenId e usa o timestamp MAIS ANTIGO dentre as mensagens
// para buscar o preço histórico, aplicando a todos os documentos daquele token.

async function processTokenGroup(tokenId, group) {
  const { earliestCreatedAt, docIds, sampleMsgId } = group;
  const unixSeconds = Math.floor(new Date(earliestCreatedAt).getTime() / 1000);
  const result = await fetchHistoricalPrice(tokenId, unixSeconds);
  if (result && result.price) {
    if (!DRY_RUN) {
      await Message.updateMany(
        { _id: { $in: docIds } },
        { $set: { initialPriceUSD: result.price, initialPriceUSDRefreshedAt: new Date(), initialPriceSource: 'solanatracker', initialPriceUSDReferenceTimestamp: new Date(earliestCreatedAt) } }
      );
    }
    console.log(`[UPDATED TOKEN] token=${tokenId} docs=${docIds.length} earliestMsg=${sampleMsgId} ts=${unixSeconds} price=${result.price}`);
    return { updated: docIds.length, price: result.price };
  } else {
    console.log(`[SKIP TOKEN] token=${tokenId} docs=${docIds.length} motivo=sem_preco`);
    return { updated: 0 };
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {});
  console.log('Mongo conectado. Iniciando reprice...');

  const query = {
    createdAt: { $gte: CUTOFF_DATE },
    tokenId: { $exists: true, $ne: null },
    initialPriceUSD: { $exists: true }
  };

  const total = await Message.countDocuments(query);
  console.log(`Documentos elegíveis (últimas ${LOOKBACK_HOURS}h): ${total}`);
  if (!total) {
    console.log('Nada a atualizar.');
    process.exit(0);
  }

  // Carrega todos os documentos elegíveis em memória (janela 48h geralmente pequena) e agrupa
  const docs = await Message.find(query).sort({ createdAt: 1 }).select('_id id tokenId createdAt').lean();
  console.log(`Carregados ${docs.length} documentos para agrupamento.`);

  const groups = new Map(); // tokenId -> { earliestCreatedAt, docIds, sampleMsgId }
  for (const d of docs) {
    if (!d.tokenId) continue;
    const g = groups.get(d.tokenId);
    if (!g) {
      groups.set(d.tokenId, { earliestCreatedAt: d.createdAt, docIds: [d._id], sampleMsgId: d.id });
    } else {
      g.docIds.push(d._id);
      // earliestCreatedAt já está ordenado globalmente, então primeiro é o mais antigo
    }
  }

  console.log(`Total de tokens distintos: ${groups.size}`);

  const tokenEntries = Array.from(groups.entries());
  let pointer = 0;
  let totalUpdatedDocs = 0;

  // Processa em lotes de CONCURRENCY tokens
  while (pointer < tokenEntries.length) {
    const slice = tokenEntries.slice(pointer, pointer + CONCURRENCY);
    const results = await Promise.all(slice.map(([tokenId, group]) => processTokenGroup(tokenId, group)));
    totalUpdatedDocs += results.reduce((acc, r) => acc + (r.updated || 0), 0);
    pointer += CONCURRENCY;
    if (pointer % (CONCURRENCY * 5) === 0) {
      console.log(`Progresso tokens: ${pointer}/${tokenEntries.length} docsAtualizados=${totalUpdatedDocs}`);
    }
  }

  console.log(`Concluído. Tokens processados=${tokenEntries.length} Docs atualizados=${totalUpdatedDocs} DRY_RUN=${DRY_RUN}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => {
  console.error('Erro geral:', e);
  process.exit(1);
});
