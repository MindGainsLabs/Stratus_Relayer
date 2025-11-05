import Message from '../models/Message.js';
import { fetchTokenPrice } from './priceQuoteService.js';

/**
 * Identifica tokens com momentum positivo (preço atual > preço da última call) nas últimas 24h.
 * 
 * Lógica:
 * 1. Busca mensagens das últimas 24h com tokenId e initialPriceUSD
 * 2. Agrupa por tokenId e identifica a mensagem mais recente de cada token
 * 3. Obtém preço atual via API externa (priceQuoteService)
 * 4. Compara: se currentPriceUSD > lastCallPriceUSD → momentum positivo
 * 5. Calcula ganho percentual e absoluto
 * 
 * @param {Object} options
 * @param {number} [options.hours=24] - Janela de horas
 * @param {number} [options.minGainPercent=0] - Filtro de ganho mínimo percentual (ex: 5 = 5%)
 * @returns {Promise<Array>} Tokens com momentum positivo ordenados por gainPercent desc
 */
export const getMomentumCalls = async (options = {}) => {
    const { hours = 24, minGainPercent = 0 } = options;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
        // 1. Busca mensagens com tokenId e initialPriceUSD nas últimas 24h
        const messages = await Message.find({
            createdAt: { $gte: cutoffTime },
            tokenId: { $exists: true, $ne: null },
            initialPriceUSD: { $exists: true, $ne: null }
        }).sort({ createdAt: -1 }).lean();

        if (!messages.length) {
            console.log('[MomentumCalls] Nenhuma mensagem elegível encontrada.');
            return [];
        }

        // 2. Agrupa por tokenId e mantém apenas a mensagem mais recente (primeira no sort desc)
        const tokenMap = new Map();
        for (const msg of messages) {
            if (!tokenMap.has(msg.tokenId)) {
                tokenMap.set(msg.tokenId, msg);
            }
        }

        console.log(`[MomentumCalls] ${tokenMap.size} tokens únicos nas últimas ${hours}h`);

        // 3. Para cada token, busca preço atual e calcula momentum
        const results = [];
        for (const [tokenId, lastMessage] of tokenMap.entries()) {
            const lastCallPriceUSD = lastMessage.initialPriceUSD;
            if (!lastCallPriceUSD || lastCallPriceUSD <= 0) continue;

            try {
                const priceData = await fetchTokenPrice(tokenId, { ttlMs: 30_000 }); // cache 30s
                if (!priceData || !priceData.priceUsd) {
                    console.log(`[MomentumCalls] Sem preço atual para ${tokenId}`);
                    continue;
                }

                const currentPriceUSD = priceData.priceUsd;

                // Momentum positivo: preço atual > preço da última call
                if (currentPriceUSD > lastCallPriceUSD) {
                    const gainAbsolute = currentPriceUSD - lastCallPriceUSD;
                    const gainPercent = ((currentPriceUSD / lastCallPriceUSD) - 1) * 100;

                    // Filtro de ganho mínimo
                    if (gainPercent >= minGainPercent) {
                        results.push({
                            tokenId,
                            symbol: extractSymbolFromDescription(lastMessage.description),
                            lastCallPriceUSD,
                            currentPriceUSD,
                            gainAbsolute,
                            gainPercent: parseFloat(gainPercent.toFixed(2)),
                            lastCallTimestamp: lastMessage.createdAt,
                            lastCallMessageId: lastMessage.id,
                            priceSource: priceData.source || 'unknown'
                        });
                    }
                }
            } catch (err) {
                console.error(`[MomentumCalls] Erro ao buscar preço para ${tokenId}:`, err.message);
            }
        }

        // Ordena por gainPercent descendente
        results.sort((a, b) => b.gainPercent - a.gainPercent);

        console.log(`[MomentumCalls] ${results.length} tokens com momentum positivo (min gain: ${minGainPercent}%)`);
        return results;

    } catch (error) {
        console.error('[MomentumCalls] Erro geral:', error);
        throw error;
    }
};

/**
 * Extrai símbolo do token da description (heurística simplificada)
 */
function extractSymbolFromDescription(description = '') {
    const patterns = [
        /MULTI BUY\s+\*\*([A-Z0-9]+)\*\*/i,
        /MULTI BUY\s+([A-Z0-9]+)/i,
        /#([A-Z0-9]+)\s+\|/i,
        /\$([A-Z]{2,10})\b/
    ];
    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match) return match[1];
    }
    return 'UNKNOWN';
}
