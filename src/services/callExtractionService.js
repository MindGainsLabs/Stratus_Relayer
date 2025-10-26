import Message from '../models/Message.js';
import ChannelCall from '../models/ChannelCall.js';

// Regex principais para identificar mensagens de call MULTI BUY ou BUY events
const CALL_IDENTIFIER_REGEX = /(MULTI BUY|\d+\s+wallets\s+bought|BUY\s+[A-Z0-9]{2,10}|swapped\s+\d+)/i;

// Extrações reutilizadas
const extractTokenSymbol = (text) => {
  const multi = text.match(/MULTI BUY\s+\*\*?([A-Z0-9]{2,15})/i) || text.match(/MULTI BUY\s+([A-Z0-9]{2,15})/i);
  if (multi) return multi[1].toUpperCase();
  const hash = text.match(/#([A-Z0-9]{2,15})/);
  if (hash) return hash[1].toUpperCase();
  return null;
};

const extractTokenAddress = (text) => {
  const code = text.match(/`([A-Za-z0-9]{30,})`/);
  if (code) return code[1];
  const raw = text.match(/\b([A-Za-z0-9]{32,})\b/);
  if (raw) return raw[1];
  return null;
};

const extractEntryPrice = (text) => {
  const m = text.match(/@\$?([0-9]*\.?[0-9]{1,8})/) || text.match(/ENTRY\s*@\s*([0-9]*\.?[0-9]+)/i);
  return m ? parseFloat(m[1]) : null;
};

const extractWalletLines = (text) => {
  const lines = text.split(/\n+/);
  const wallets = [];
  let current = null;
  for (const line of lines) {
    const head = line.match(/(?:🔹|🔺)\*\*\(([^)]+)\)\*\*\s*\(([^)]+) tx\)/); // not used presently
    const alt = line.match(/(?:🔹|🔺)\*\*\(([^)]+)\)\*\*\s*\(([^)]+) tx\)/);
    // Simplificado: detect beginning by Total buy sequence
    if (/Total buy:/i.test(line)) {
      const amount = line.match(/Total buy:\s*([0-9]*\.?[0-9]+)/i);
      if (current) {
        current.totalBuy = amount ? parseFloat(amount[1]) : 0;
        wallets.push(current);
        current = null;
      }
    }
  }
  return wallets;
};

/**
 * Converte mensagens (collection Message) em documentos ChannelCall.
 * Não reprocessa mensagens que já possuem ChannelCall correspondente (por messageId).
 */
export const extractCallsFromMessages = async ({ channelIds = [], hours = 24, limit = 500 }) => {
  const since = new Date(Date.now() - hours * 3600 * 1000);
  const query = { createdAt: { $gte: since } };
  if (channelIds.length) query.channelId = { $in: channelIds };
  const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();

  let created = 0;
  for (const msg of messages) {
    const text = msg.description || '';
    if (!CALL_IDENTIFIER_REGEX.test(text)) continue;
    const exists = await ChannelCall.exists({ messageId: msg.id });
    if (exists) continue;
    const tokenSymbol = extractTokenSymbol(text);
    const tokenAddress = extractTokenAddress(text);
    const entryPrice = extractEntryPrice(text);
    await ChannelCall.create({
      channelId: msg.channelId || 'unknown',
      messageId: msg.id,
      tokenSymbol,
      tokenAddress,
      entryPrice: entryPrice || undefined,
      highestPrice: entryPrice || 0,
      lowestPrice: entryPrice || 0,
      authorUsername: msg.username,
      authorId: msg.username, // até termos map real
      priceSnapshots: entryPrice ? [{ price: entryPrice }] : []
    });
    created++;
  }
  return { processed: messages.length, created };
};
