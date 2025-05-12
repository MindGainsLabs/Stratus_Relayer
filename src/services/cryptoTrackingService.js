import Message from '../models/Message.js';
import { parseTokenMessage } from '../utils/tokenParser.js';
import { getTokenReportSummary } from './rugcheckService.js';

/**
 * Extract structured crypto tracking data from stored messages
 * @param {Object} options - Query options
 * @param {number} options.hours - Hours to look back
 * @param {string} options.tokenSymbol - Filter by token symbol (optional)
 * @param {string} options.walletName - Filter by wallet name (optional)
 * @returns {Promise<Array>} Structured token tracking data
 */
export const getCryptoTrackingData = async (options) => {
    const { hours = 24, tokenSymbol = null, walletName = null } = options;
    
    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Build query
    const query = { 
        createdAt: { $gte: cutoffTime }
    };
    
    // Query message collection
    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .lean();

    console.log(`Found ${messages.length} messages in the last ${hours} hours`);
    
    // Transform messages to structured data
    const structuredData = [];
    const tokenCache = new Map(); // Cache to avoid processing same token multiple times

    for (const message of messages) {
        // Parse the message content to extract structured token data
        const tokenData = parseTokenMessage(message);
        
        if (!tokenData) continue;
        
        // Apply filters if specified
        if (tokenSymbol && tokenData.token.symbol !== tokenSymbol) continue;
        if (walletName && !tokenData.wallets.some(wallet => wallet.name === walletName)) continue;
        
        // Check if we need to fetch more risk data from Rugcheck for this token
        if (tokenData.token.id && !tokenData.riskReport && !tokenCache.has(tokenData.token.id)) {
            try {
                console.log(`Fetching risk report for token ${tokenData.token.id}`);
                const riskReport = await getTokenReportSummary(tokenData.token.id);
                
                if (riskReport) {
                    tokenData.riskReport = {
                        tokenProgram: riskReport.tokenProgram || "Unknown",
                        tokenType: riskReport.tokenType?.trim() || "Unknown",
                        risks: (riskReport.risks || []).map(risk => ({
                            name: risk.name,
                            description: risk.description,
                            score: risk.score,
                            level: risk.level
                        })),
                        finalScore: riskReport.score || 0,
                        normalizedScore: riskReport.score_normalised || 0
                    };
                    
                    // Cache the result
                    tokenCache.set(tokenData.token.id, tokenData.riskReport);
                }
            } catch (error) {
                console.error(`Error fetching risk report for token ${tokenData.token.id}:`, error.message);
            }
        } else if (tokenData.token.id && !tokenData.riskReport && tokenCache.has(tokenData.token.id)) {
            // Use cached risk report
            tokenData.riskReport = tokenCache.get(tokenData.token.id);
        }
        
        // Add to results
        structuredData.push(tokenData);
    }
    
    // Return structured data
    return structuredData;
};

/**
 * Generate token statistical analysis
 * @param {Array} trackingData - Array of token tracking data
 * @returns {Object} Statistical analysis
 */
export const generateTokenStats = (trackingData) => {
    if (!trackingData || trackingData.length === 0) {
        return { tokens: {}, wallets: {}, totalSol: 0 };
    }
    
    const tokenStats = {};
    const walletStats = {};
    let totalSol = 0;
    
    // Process each tracked message
    trackingData.forEach(data => {
        const { token, meta, wallets } = data;
        
        // Skip if missing key data
        if (!token || !token.id) return;
        
        // Track total SOL
        if (meta.totalSol) {
            totalSol += meta.totalSol;
        }
        
        // Token stats
        const tokenId = token.id;
        if (!tokenStats[tokenId]) {
            tokenStats[tokenId] = {
                symbol: token.symbol || 'Unknown',
                id: tokenId,
                marketCap: token.marketCap || 'Unknown',
                totalSol: 0,
                mentions: 0,
                wallets: new Set(),
                riskScore: data.riskReport?.normalizedScore || null,
                platforms: []
            };
        }
        
        // Update token stats
        tokenStats[tokenId].mentions++;
        tokenStats[tokenId].totalSol += meta.totalSol || 0;
        
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
                    totalSol: 0,
                    transactions: 0,
                    tokens: new Set()
                };
            }
            
            walletStats[wallet.name].totalSol += wallet.amount || 0;
            walletStats[wallet.name].transactions++;
            walletStats[wallet.name].tokens.add(tokenId);
        });
    });
    
    // Convert Set objects to counts for JSON serialization
    Object.keys(tokenStats).forEach(id => {
        tokenStats[id].uniqueWallets = tokenStats[id].wallets.size;
        delete tokenStats[id].wallets;
    });
    
    Object.keys(walletStats).forEach(name => {
        walletStats[name].uniqueTokens = walletStats[name].tokens.size;
        delete walletStats[name].tokens;
    });
    
    return {
        tokens: Object.values(tokenStats).sort((a, b) => b.totalSol - a.totalSol),
        wallets: Object.values(walletStats).sort((a, b) => b.totalSol - a.totalSol),
        totalSol
    };
};