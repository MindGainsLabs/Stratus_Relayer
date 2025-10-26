import ChannelCall from '../models/ChannelCall.js';

/**
 * Atualiza preço atual de um token para calls abertas e marca picos / win condition.
 * @param {Object} params
 * @param {String} params.tokenAddress
 * @param {Number} params.currentPrice
 */
export const updateCallPricesForToken = async ({ tokenAddress, currentPrice }) => {
  if (!tokenAddress || typeof currentPrice !== 'number') return;
  const calls = await ChannelCall.find({ tokenAddress });
  for (const call of calls) {
    let changed = false;
    if (!call.highestPrice || currentPrice > call.highestPrice) {
      call.highestPrice = currentPrice;
      changed = true;
    }
    if (!call.lowestPrice || currentPrice < call.lowestPrice) {
      call.lowestPrice = currentPrice;
      changed = true;
    }
    if (!call.hit50PctGain && call.entryPrice && currentPrice >= call.entryPrice * 1.5) {
      call.hit50PctGain = true;
      changed = true;
    }
    if (changed) {
      call.priceSnapshots.push({ price: currentPrice, at: new Date() });
      await call.save();
    }
  }
};

/**
 * Mock para integração futura com feed de preços real.
 * Pode ser chamado periodicamente passando mapa de preços atualizados.
 */
export const bulkUpdatePrices = async (priceMap) => {
  // priceMap: { tokenAddress: currentPrice }
  const entries = Object.entries(priceMap || {});
  for (const [tokenAddress, currentPrice] of entries) {
    await updateCallPricesForToken({ tokenAddress, currentPrice });
  }
};
