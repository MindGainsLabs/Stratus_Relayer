import axios from 'axios';

// Simple in-memory cache { mint: { ts, data } }
const cache = new Map();

const DEFAULT_TTL_MS = 60_000; // 1 min
const DEXSCREENER_ENDPOINT = 'https://api.dexscreener.com/latest/dex/tokens';

/**
 * Fetch price data for a Solana token mint using Dexscreener (primary)
 * @param {string} mint
 * @param {Object} opts
 * @param {number} opts.ttlMs
 * @returns {Promise<{priceUsd:number|null, priceNative:number|null, liquidityUsd?:number}|null>}
 */
export const fetchTokenPrice = async (mint, opts = {}) => {
  if (!mint) return null;
  const ttlMs = opts.ttlMs || DEFAULT_TTL_MS;
  const now = Date.now();
  const cached = cache.get(mint);
  if (cached && (now - cached.ts) < ttlMs) return cached.data;

  try {
    const url = `${DEXSCREENER_ENDPOINT}/${mint}`;
    const { data } = await axios.get(url, { timeout: parseInt(process.env.PRICE_FETCH_TIMEOUT_MS || '4000', 10) });
    if (!data || !data.pairs || !data.pairs.length) throw new Error('No pairs');
    // Choose highest liquidity pair
    const best = data.pairs.reduce((acc, p) => {
      if (!acc) return p;
      return (p.liquidity?.usd || 0) > (acc.liquidity?.usd || 0) ? p : acc;
    }, null);
    const priceInfo = {
      priceUsd: best?.priceUsd ? parseFloat(best.priceUsd) : null,
      priceNative: best?.priceNative ? parseFloat(best.priceNative) : null,
      liquidityUsd: best?.liquidity?.usd || null,
      dexId: best?.dexId,
    };
    cache.set(mint, { ts: now, data: priceInfo });
    return priceInfo;
  } catch (e) {
    return null; // silent fail - upstream transient errors
  }
};
