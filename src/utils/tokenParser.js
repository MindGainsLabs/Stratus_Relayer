/**
 * Utility to parse crypto wallet and token tracking messages from Discord
 */

/**
 * Parse a MULTI BUY message and extract structured token data
 * @param {string} content - Message content text
 * @returns {Object} Structured token data
 */
import { fetchTokenPrice } from '../services/priceQuoteService.js'; // usado apenas em parseTokenMessage para persistir primeira cotação
import Message from '../models/Message.js';

export const parseMultiBuyMessage = async (content) => {
    if (!content) return null;

    const result = {
        messageType: 'MULTI_BUY',
        token: {
            symbol: null,
            id: null, // mint address (SPL token)
            priceTokenCall: null, // preço em unidade nativa (ex: SOL) no momento do parsing
            priceUSD: null, // preço USD (se ENABLE_PRICE_FETCH=true)
            marketCap: null
        },
        meta: {
            totalSol: 0,
            walletsCount: 0,
            timeframe: null,
            seen: null
        },
        wallets: [],
        platforms: [],
        riskReport: null
    };

    // Extract token symbol
    const tokenSymbolMatch = content.match(/MULTI BUY\s+(\w+)/i);
    if (tokenSymbolMatch && tokenSymbolMatch[1]) {
        result.token.symbol = tokenSymbolMatch[1];
    } else {
        // Try alternate match with # symbol
        const hashMatch = content.match(/#(\w+)/i);
        if (hashMatch) {
            result.token.symbol = hashMatch[1];
        }
    }

    // Extract token ID (long string, usually at the end)
    const tokenIdMatch = content.match(/([A-Za-z0-9]{30,})/);
    if (tokenIdMatch) {
        result.token.id = tokenIdMatch[1];
    }

    // Extract number of wallets
    const walletsMatch = content.match(/(\d+)\s+wallets\s+bought/i);
    if (walletsMatch) {
        result.meta.walletsCount = parseInt(walletsMatch[1], 10);
    }

    // Extract timeframe
    const timeframeMatch = content.match(/in the last\s+([\d\.]+\s+\w+)/i);
    if (timeframeMatch) {
        result.meta.timeframe = timeframeMatch[1].trim();
    }

    // Extract total SOL amount
    const totalSolMatch = content.match(/Total:\s*([\d\.]+)\s*SOL/i);
    if (totalSolMatch) {
        result.meta.totalSol = parseFloat(totalSolMatch[1]);
    }

    // Extract market cap
    const mcMatch = content.match(/MC:\s*\$([\d,\.]+[KMB])/i);
    if (!mcMatch) {
        const altMcMatch = content.match(/🔗\s*\*\*#\w+\*\*\s*\|\s*\*\*MC\*\*:\s*\$([\d,\.]+[KMB])/i);
        if (altMcMatch) {
            result.token.marketCap = altMcMatch[1];
        }
    }

    // Extract "Seen" time
    const seenMatch = content.match(/Seen:\s+([\w\d]+):/i);
    if (!seenMatch) {
        const altSeenMatch = content.match(/\*\*Seen\*\*:\s+([\w\d]+):\s*\[.*\]/i);
        if (altSeenMatch) {
            result.meta.seen = altSeenMatch[1];
        }
    }
    
    // Extract platforms
    const platformsRegex = /(BullX|NEO|AXIOM|Trojan|Nova|GMGN|Photon|RAY)/g;
    let platformMatch;
    while ((platformMatch = platformsRegex.exec(content)) !== null) {
        if (!result.platforms.includes(platformMatch[1])) {
            result.platforms.push(platformMatch[1]);
        }
    }

    // Extract wallets and transactions
    const walletLines = content.split('\n');
    let currentWallet = null;
    
    for (const line of walletLines) {
        // Wallet name line
        const walletNameMatch = line.match(/(?:🔹|🔺)\*\*([\w\s\.]+)\*\*\s*\(([\w\s]+)\s*tx\)/);
        if (walletNameMatch) {
            currentWallet = {
                name: walletNameMatch[1].trim(),
                txTime: walletNameMatch[2].trim(),
                amount: 0,
                marketCap: null,
                totalBuy: 0,
                holdingPercentage: 0
            };
            continue;
        }
        
        // Amount line
        if (currentWallet && line.includes('SOL | MC')) {
            const amountMatch = line.match(/├\*\*([\d\.]+)\s+SOL\s*\|\s*MC\s*\$([\d,\.]+[KMB])/);
            if (amountMatch) {
                currentWallet.amount = parseFloat(amountMatch[1]);
                currentWallet.marketCap = amountMatch[2];
            }
            continue;
        }
        
        // Total buy line
        if (currentWallet && line.includes('Total buy:')) {
            const totalBuyMatch = line.match(/Total buy:\s*([\d\.]+)\s+SOL\s*\|\s*✊(\d+)%/);
            if (totalBuyMatch) {
                currentWallet.totalBuy = parseFloat(totalBuyMatch[1]);
                currentWallet.holdingPercentage = parseInt(totalBuyMatch[2], 10);
                result.wallets.push(currentWallet);
                currentWallet = null;
            }
        }
    }

    // Não buscamos mais preço aqui; será feito uma única vez em parseTokenMessage para a primeira call.

    return result;
};

/**
 * Parse risk report section from a message
 * @param {string} content - Message content text
 * @returns {Object} Risk report data
 */
export const parseRiskReport = (content) => {
    if (!content.includes('Token Risk Report Summary')) {
        return null;
    }

    const result = {
        tokenProgram: null,
        tokenType: null,
        risks: [],
        finalScore: 0,
        normalizedScore: 0
    };

    // Extract token program
    const programMatch = content.match(/Token Program:\s*([^\n]+)/);
    if (programMatch) {
        result.tokenProgram = programMatch[1].trim();
    }

    // Extract token type
    const typeMatch = content.match(/Token Type:\s*([^\n]+)/);
    if (typeMatch) {
        result.tokenType = typeMatch[1].trim();
    }

    // Extract risk factors
    const riskRegex = /- ([^:]+):\s*([^(]+)(?:\([^)]+\))?\s*\(Score:\s*(\d+),\s*Level:\s*(\w+)\)/g;
    let riskMatch;
    while ((riskMatch = riskRegex.exec(content)) !== null) {
        result.risks.push({
            name: riskMatch[1].trim(),
            description: riskMatch[2].trim(),
            score: parseInt(riskMatch[3], 10),
            level: riskMatch[4].trim()
        });
    }

    // Extract final risk score
    const finalScoreMatch = content.match(/Final Risk Score:\s*(\d+)/);
    if (finalScoreMatch) {
        result.finalScore = parseInt(finalScoreMatch[1], 10);
    }

    // Extract normalized score
    const normalizedMatch = content.match(/Score Normalised:\s*(\d+)/);
    if (normalizedMatch) {
        result.normalizedScore = parseInt(normalizedMatch[1], 10);
    }

    return result;
};

/**
 * Main parsing function that combines token data and risk report
 * @param {Object} message - Discord message object with content
 * @returns {Object} Complete structured data
 */
export const parseTokenMessage = async (message) => {
    if (!message || (!message.description && !message.content)) {
        return null;
    }

    // Use description or content
    const content = message.description || message.content || '';
    
    // Skip non-relevant messages
    if (!content.includes('MULTI BUY') && !content.match(/\d+\s+wallets\s+bought/i)) {
        return null;
    }

    // Parse the MULTI BUY data (sem preço ainda)
    const tokenData = await parseMultiBuyMessage(content);
    if (!tokenData) return null;
    
    // Add author/username information
    tokenData.author = message.username || message.author?.username || 'Unknown';
    
    // Parse risk report if available
    const riskReport = parseRiskReport(content);
    if (riskReport) {
        tokenData.riskReport = riskReport;
    }
    
    // Add original message ID and timestamp
    if (message.id) tokenData.messageId = message.id;
    if (message.createdAt) tokenData.timestamp = message.createdAt;
    
    // Persistência do preço inicial: se a mensagem ainda não tiver initialPrice persistido e for a primeira vez para o token
    if (process.env.ENABLE_PRICE_FETCH === 'true' && tokenData.token.id) {
        try {
            // Garantir tokenId salvo na mensagem
            if (!message.tokenId) {
                await Message.updateOne({ id: message.id }, { $set: { tokenId: tokenData.token.id } });
                message.tokenId = tokenData.token.id;
            }

            // Verificar se já existe alguma mensagem anterior com initialPrice para este token
            const existingWithPrice = await Message.findOne({ tokenId: tokenData.token.id, initialPriceNative: { $exists: true } }).sort({ createdAt: 1 }).lean();
            if (existingWithPrice) {
                // Já existe preço inicial; replicar nos campos de saída
                tokenData.token.priceTokenCall = existingWithPrice.initialPriceNative || null;
                tokenData.token.priceUSD = existingWithPrice.initialPriceUSD || null;
                tokenData.token.initialBaseline = {
                    priceNative: existingWithPrice.initialPriceNative || null,
                    priceUSD: existingWithPrice.initialPriceUSD || null,
                    capturedAt: existingWithPrice.createdAt,
                    messageId: existingWithPrice.id
                };
            } else {
                // Primeira vez: buscar e persistir
                const quote = await fetchTokenPrice(tokenData.token.id);
                if (quote) {
                    tokenData.token.priceTokenCall = quote.priceNative || null;
                    tokenData.token.priceUSD = quote.priceUsd || null;
                    await Message.updateOne(
                        { id: message.id },
                        { $set: { initialPriceNative: tokenData.token.priceTokenCall, initialPriceUSD: tokenData.token.priceUSD } }
                    );
                    // baseline recém capturada
                    tokenData.token.initialBaseline = {
                        priceNative: tokenData.token.priceTokenCall,
                        priceUSD: tokenData.token.priceUSD,
                        capturedAt: message.createdAt || new Date(),
                        messageId: message.id
                    };
                }
            }
        } catch (e) {
            // silencioso
        }
    }

    // Caso preço desabilitado, ainda retornamos o contêiner (nulo) para facilitar frontend
    if (!tokenData.token.initialBaseline) {
        tokenData.token.initialBaseline = {
            priceNative: tokenData.token.priceTokenCall || null,
            priceUSD: tokenData.token.priceUSD || null,
            capturedAt: message.createdAt || null,
            messageId: message.id || null
        };
    }

    return tokenData;
};