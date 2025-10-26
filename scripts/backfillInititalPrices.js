import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Message from '../src/models/Message.js';
import { parseMultiBuyMessage } from '../src/utils/tokenParser.js';
import { fetchTokenPrice } from '../src/services/priceQuoteService.js';

const BATCH_LIMIT = 500;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});

    // Map para saber se já capturamos baseline de um token
    const baselineCaptured = new Set(
      (await Message.find({ initialPriceNative: { $exists: true } }).select('tokenId').lean())
        .map(d => d.tokenId)
        .filter(Boolean)
    );

    const cursor = Message.find({ tokenId: { $exists: false }, description: /MULTI BUY/ }).cursor();

    let processed = 0;
    for (let doc = await cursor.next(); doc; doc = await cursor.next()) {
      processed++;
      const parsed = await parseMultiBuyMessage(doc.description);
      if (parsed?.token?.id) {
        const update = { tokenId: parsed.token.id };
        if (!baselineCaptured.has(parsed.token.id)) {
            if (process.env.ENABLE_PRICE_FETCH === 'true') {
              const quote = await fetchTokenPrice(parsed.token.id);
              if (quote) {
                update.initialPriceNative = quote.priceNative ?? null;
                update.initialPriceUSD = quote.priceUsd ?? null;
                baselineCaptured.add(parsed.token.id);
              }
            }
        }
        await Message.updateOne({ _id: doc._id }, { $set: update });
      }
      if (processed % BATCH_LIMIT === 0) {
        console.log(`Processados ${processed} documentos...`);
      }
    }

    console.log('Backfill concluído.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();