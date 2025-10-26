import Message from '../models/Message.js';
import { parseTokenMessage } from '../utils/tokenParser.js';
import { getTokenReportSummary } from './rugcheckService.js';

/**
 * Extrai dados estruturados de tracking de mensagens armazenadas com suporte a paginação.
 * IMPORTANTE: A filtragem por tokenSymbol / walletName ocorre APÓS o parse da mensagem
 * (não existe índice direto hoje). A paginação portanto é feita sobre o conjunto filtrado,
 * e não sobre os documentos crus. Para performance, fazemos streaming via cursor e
 * interrompemos assim que coletamos a página solicitada.
 *
 * @param {Object} options
 * @param {number} [options.hours=24] - Janela de horas para trás
 * @param {string|null} [options.tokenSymbol] - Filtrar por símbolo
 * @param {string|null} [options.walletName] - Filtrar por carteira
 * @param {number} [options.page] - Página (1-based). Quando omitido, retorna TODAS (modo legacy)
 * @param {number} [options.limit] - Tamanho da página. Quando omitido, retorna TODAS (modo legacy)
 * @returns {Promise<Array|{data:Array,pagination:{page:number,limit:number,hasMore:boolean}}>} 
 */
export const getCryptoTrackingData = async (options) => {
    const { hours = 24, tokenSymbol = null, walletName = null, page, limit } = options || {};

    // Se não houver paginação solicitada, utiliza lógica antiga (mantém compatibilidade)
    const usePagination = Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0;
    if ((page !== undefined || limit !== undefined) && !usePagination) {
        console.warn('[getCryptoTrackingData] Invalid pagination parameters received. Falling back to no-pagination mode.', { page, limit });
    }

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const query = { createdAt: { $gte: cutoffTime } };

    // Cache de relatórios de risco para não repetir fetch por token
    const tokenCache = new Map();
    const structuredData = [];

    if (!usePagination) {
        // Modo legacy: carrega tudo (cuidado com performance em grandes janelas)
        const messages = await Message.find(query).sort({ createdAt: -1 });
        console.log(`(no-pagination) Found ${messages.length} messages in the last ${hours} hours`);
        for (const message of messages) {
            const tokenData = await parseTokenMessage(message);
            if (!tokenData) continue;
            if (tokenSymbol && tokenData.token.symbol !== tokenSymbol) continue;
            if (walletName && !tokenData.wallets.some(w => w.name === walletName)) continue;
            await enrichWithRiskReport(tokenData, tokenCache);
            structuredData.push(tokenData);
        }
        return structuredData;
    }

    // --- Paginação streaming ---
    const skipCount = (page - 1) * limit; // número de itens filtrados a pular
    let filteredIndex = 0; // conta somente itens que passaram nos filtros
    let collected = 0;
    let hasMore = false;

    // Cursor para não carregar tudo em memória
    // Ordenação consistente: createdAt desc + _id desc (desempate determinístico)
    const cursor = Message.find(query).sort({ createdAt: -1, _id: -1 }).cursor();

    // Contadores para total filtrado
    let totalFiltered = 0;

    for await (const message of cursor) {
        const tokenData = await parseTokenMessage(message);
        if (!tokenData) continue;
        if (tokenSymbol && tokenData.token.symbol !== tokenSymbol) continue;
        if (walletName && !tokenData.wallets.some(w => w.name === walletName)) continue;

        // Passou nos filtros
        totalFiltered++;

        // Antes da janela de página
        if (totalFiltered <= skipCount) {
            continue;
        }

        // Coleta itens da página
        if (collected < limit) {
            await enrichWithRiskReport(tokenData, tokenCache);
            structuredData.push(tokenData);
            collected++;
            continue;
        }

        // Se já preencheu a página, apenas marcamos que há mais
        hasMore = true; // haverá pelo menos um item além da página
        // Não fazemos break para continuar contando total (necessário para pagination.total)
    }

    // Caso totalFiltered ainda não exceda a página coletada, hasMore permanece false
    if (!hasMore) {
        hasMore = totalFiltered > skipCount + collected;
    }

    return {
        data: structuredData,
        pagination: {
            page,
            limit,
            hasMore,
            total: totalFiltered
        }
    };
};

/**
 * Enriquecimento com Rugcheck (idempotente / com cache)
 * @param {any} tokenData
 * @param {Map} tokenCache
 */
async function enrichWithRiskReport(tokenData, tokenCache) {
    if (!tokenData?.token?.id) return;
    const id = tokenData.token.id;
    if (tokenData.riskReport) return;
    if (tokenCache.has(id)) {
        tokenData.riskReport = tokenCache.get(id);
        return;
    }
    try {
        console.log(`Fetching risk report for token ${id}`);
        const riskReport = await getTokenReportSummary(id);
        if (riskReport) {
            tokenData.riskReport = {
                tokenProgram: riskReport.tokenProgram || 'Unknown',
                tokenType: riskReport.tokenType?.trim() || 'Unknown',
                risks: (riskReport.risks || []).map(risk => ({
                    name: risk.name,
                    description: risk.description,
                    score: risk.score,
                    level: risk.level
                })),
                finalScore: riskReport.score || 0,
                normalizedScore: riskReport.score_normalised || 0
            };
            tokenCache.set(id, tokenData.riskReport);
        }
    } catch (error) {
        console.error(`Error fetching risk report for token ${id}:`, error.message);
    }
}

/**
 * Generate token statistical analysis
 * @param {Array} trackingData - Array of token tracking data
 * @returns {Object} Statistical analysis
 */
export const generateTokenStats = (trackingData) => {
    if (!trackingData || trackingData.length === 0) {
        return { tokens: [], wallets: [], totalSol: 0 };
    }
    
    const tokenStats = {};
    const walletStats = {};
    
    // Process each tracked message
    trackingData.forEach(data => {
        const { token, meta, wallets } = data;
        
        // Skip if missing key data
        if (!token || !token.id) return;
        
        // Token stats
        const tokenId = token.id;
        if (!tokenStats[tokenId]) {
            tokenStats[tokenId] = {
                symbol: token.symbol || 'Unknown',
                id: tokenId,
                priceTokenCall: token.priceTokenCall || null,
                priceUSD: token.priceUSD || null,
                marketCap: token.marketCap || 'Unknown',
                // totalSol here should reflect the cumulative total (already cumulative in each message), so we take the max seen
                totalSol: meta.totalSol || 0,
                mentions: 0,
                wallets: new Set(),
                riskScore: data.riskReport?.normalizedScore || null,
                platforms: [],
                initialBaseline: token.initialBaseline || null
            };
        }
        
        // Update token stats
        tokenStats[tokenId].mentions++;
        if (meta.totalSol && meta.totalSol > tokenStats[tokenId].totalSol) {
            tokenStats[tokenId].totalSol = meta.totalSol; // keep the highest cumulative total
        }

        // Preserva baseline se ainda não definido no agregado
        if (!tokenStats[tokenId].initialBaseline && token.initialBaseline) {
            tokenStats[tokenId].initialBaseline = token.initialBaseline;
        }
        
        // Add platforms
        if (data.platforms && data.platforms.length > 0) {
            data.platforms.forEach(platform => {
                if (!tokenStats[tokenId].platforms.includes(platform)) {
                    tokenStats[tokenId].platforms.push(platform);
                }
            });
        }
        
        // Process wallet stats
        wallets.forEach(wallet => {
            // Add to token's wallet set
            tokenStats[tokenId].wallets.add(wallet.name);
            
            // Update wallet stats
            if (!walletStats[wallet.name]) {
                walletStats[wallet.name] = {
                    name: wallet.name,
                    // Map tokenId -> max totalBuy observed (since totalBuy is cumulative per wallet per token)
                    tokenTotals: {},
                    transactions: 0
                };
            }
            
            walletStats[wallet.name].transactions++;
            const currentTotalBuy = wallet.totalBuy || wallet.amount || 0;
            const prev = walletStats[wallet.name].tokenTotals[tokenId] || 0;
            if (currentTotalBuy > prev) {
                walletStats[wallet.name].tokenTotals[tokenId] = currentTotalBuy;
            }
        });
    });
    
    // Convert Set objects to counts for JSON serialization
    Object.keys(tokenStats).forEach(id => {
        tokenStats[id].uniqueWallets = tokenStats[id].wallets.size;
        delete tokenStats[id].wallets;
    });
    
    Object.keys(walletStats).forEach(name => {
        // totalSol for wallet = sum of max totalBuy per token (avoids double counting across messages)
        const tokenTotals = walletStats[name].tokenTotals;
        const totalSolForWallet = Object.values(tokenTotals).reduce((sum, v) => sum + v, 0);
        walletStats[name].totalSol = totalSolForWallet;
        walletStats[name].uniqueTokens = Object.keys(tokenTotals).length;
        delete walletStats[name].tokenTotals;
    });
    
    // Recalculate global totalSol as sum of max cumulative totals per token
    const totalSol = Object.values(tokenStats).reduce((sum, t) => sum + (t.totalSol || 0), 0);
    
    return {
        tokens: Object.values(tokenStats).sort((a, b) => b.totalSol - a.totalSol),
        wallets: Object.values(walletStats).sort((a, b) => b.totalSol - a.totalSol),
        totalSol
    };
};