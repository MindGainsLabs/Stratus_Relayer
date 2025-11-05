import axios from 'axios';

// Simple in-memory cache { mint: { ts, data } }
const cache = new Map();

const DEFAULT_TTL_MS = 60_000; // 1 min

// Moralis Solana Gateway (preferred)
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'mainnet';
const MORALIS_SOLANA_BASE = process.env.MORALIS_SOLANA_BASE || 'https://solana-gateway.moralis.io';

// Optional fallback (kept for resilience)
const DEXSCREENER_ENDPOINT = 'https://api.dexscreener.com/latest/dex/tokens';

/**
 * Fetch price data for a Solana token mint using Moralis (primary) with optional Dexscreener fallback
 * @param {string} mint
 * @param {Object} opts
 * @param {number} opts.ttlMs
 * @returns {Promise<{priceUsd:number|null, priceNative:number|null, liquidityUsd?:number, source?:string}|null>}
 */
export const fetchTokenPrice = async (mint, opts = {}) => {
  if (!mint) return null;
  const ttlMs = opts.ttlMs || DEFAULT_TTL_MS;
  const now = Date.now();
  const cached = cache.get(mint);
  if (cached && (now - cached.ts) < ttlMs) return cached.data;

  const timeout = parseInt(process.env.PRICE_FETCH_TIMEOUT_MS || '4000', 10);

  // 1) Try Moralis
  if (MORALIS_API_KEY) {
    try {
      const url = `${MORALIS_SOLANA_BASE}/token/${SOLANA_NETWORK}/${mint}/price`;
      const { data } = await axios.get(url, {
        timeout,
        headers: { 'X-API-Key': MORALIS_API_KEY },
      });

      // Moralis response example (shape may vary):
      // { nativePrice: { value: '123', decimals: 9, symbol: 'SOL' }, usdPrice: 0.00123, exchangeAddress?, exchangeName? }
      const priceUsd = typeof data?.usdPrice === 'number' ? data.usdPrice : (data?.usdPrice ? parseFloat(String(data.usdPrice)) : null);
      let priceNative = null;
      if (data?.nativePrice?.value != null) {
        const dec = Number(data?.nativePrice?.decimals ?? 9);
        const val = typeof data.nativePrice.value === 'string' ? parseFloat(data.nativePrice.value) : Number(data.nativePrice.value);
        if (!Number.isNaN(val) && dec >= 0) priceNative = val / Math.pow(10, dec);
      }

      if (priceUsd != null || priceNative != null) {
        const priceInfo = {
          priceUsd: priceUsd ?? null,
          priceNative: priceNative ?? null,
          liquidityUsd: null, // Moralis price endpoint doesn't provide liquidity
          source: 'moralis',
        };
        cache.set(mint, { ts: now, data: priceInfo });
        return priceInfo;
      }
    } catch (e) {
      // continue to fallback
    }
  }

  // 2) Fallback to Dexscreener if Moralis is unavailable or returned empty
  try {
    const url = `${DEXSCREENER_ENDPOINT}/${mint}`;
    const { data } = await axios.get(url, { timeout });
    if (!data || !data.pairs || !data.pairs.length) throw new Error('No pairs');
    const best = data.pairs.reduce((acc, p) => {
      if (!acc) return p;
      return (p.liquidity?.usd || 0) > (acc.liquidity?.usd || 0) ? p : acc;
    }, null);
    const priceInfo = {
      priceUsd: best?.priceUsd ? parseFloat(best.priceUsd) : null,
      priceNative: best?.priceNative ? parseFloat(best.priceNative) : null,
      liquidityUsd: best?.liquidity?.usd || null,
      dexId: best?.dexId,
      source: 'dexscreener',
    };
    cache.set(mint, { ts: now, data: priceInfo });
    return priceInfo;
  } catch (e) {
    return null; // silent fail - upstream transient errors
  }
};
