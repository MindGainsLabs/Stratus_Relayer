import { getCryptoTrackingData, generateTokenStats } from '../services/cryptoTrackingService.js';
import { retrieveMessages } from '../services/messageService.js';

/**
 * Get structured crypto tracking data from messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getStructuredCryptoData = async (req, res) => {
    try {
        const { hours = 24, tokenSymbol, walletName, channelId } = req.body;
        
        // Ensure data is up to date by first retrieving latest messages
        if (channelId) {
            try {
                await retrieveMessages(channelId, hours);
            } catch (error) {
                console.warn(`Warning: Error retrieving messages from channel ${channelId}`, error.message);
                // Continue processing even if retrieval fails
            }
        }
        
        // Get structured data from stored messages
        const structuredData = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10), 
            tokenSymbol, 
            walletName 
        });
        
        // Generate statistics from the data
        const stats = generateTokenStats(structuredData);
        
        res.json({
            message: 'Crypto tracking data retrieved successfully',
            data: {
                trackedMessages: structuredData,
                stats: stats,
                filters: {
                    hours: parseInt(hours, 10),
                    tokenSymbol: tokenSymbol || 'All',
                    walletName: walletName || 'All'
                }
            }
        });
    } catch (error) {
        console.error('Error retrieving crypto tracking data:', error);
        res.status(500).json({ 
            error: 'Error retrieving crypto tracking data', 
            details: error.message 
        });
    }
};

/**
 * Get token statistics summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTokenStatistics = async (req, res) => {
    try {
        const { hours = 24 } = req.query;
        
        // Get structured data first
        const structuredData = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10)
        });
        
        // Generate statistics
        const stats = generateTokenStats(structuredData);
        
        // Add timestamp
        stats.generatedAt = new Date();
        stats.timeframe = `${hours} hours`;
        
        res.json({
            message: 'Token statistics generated successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error generating token statistics:', error);
        res.status(500).json({ 
            error: 'Error generating token statistics', 
            details: error.message 
        });
    }
};

/**
 * Search tokens by symbol or partial ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const searchTokens = async (req, res) => {
    try {
        const { query, hours = 24 } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        // Get all structured data first
        const structuredData = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10)
        });
        
        // Filter by query
        const searchResults = structuredData.filter(data => {
            const symbolMatch = data.token.symbol && 
                data.token.symbol.toLowerCase().includes(query.toLowerCase());
            
            const idMatch = data.token.id && 
                data.token.id.toLowerCase().includes(query.toLowerCase());
                
            return symbolMatch || idMatch;
        });
        
        // Generate statistics for the filtered results
        const stats = generateTokenStats(searchResults);
        
        res.json({
            message: 'Token search results',
            results: searchResults.length,
            data: {
                tokens: stats.tokens,
                matchingMessages: searchResults.map(data => ({
                    messageId: data.messageId,
                    timestamp: data.timestamp,
                    author: data.author,
                    token: data.token,
                    meta: data.meta
                }))
            }
        });
    } catch (error) {
        console.error('Error searching tokens:', error);
        res.status(500).json({ 
            error: 'Error searching tokens', 
            details: error.message 
        });
    }
};

/**
 * Get top tokens by different metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTopTokens = async (req, res) => {
    try {
        const { metric = 'totalSol', hours = 24, limit = 10 } = req.query;
        
        // Validate metric
        const validMetrics = ['totalSol', 'mentions', 'uniqueWallets', 'riskScore'];
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({ 
                error: 'Invalid metric', 
                validMetrics: validMetrics.join(', ') 
            });
        }
        
        // Get structured data
        const structuredData = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10)
        });
        
        // Generate statistics
        const stats = generateTokenStats(structuredData);
        
        // Sort by requested metric and limit results
        let sortedTokens;
        if (metric === 'riskScore') {
            // For risk score, filter out tokens without risk scores, then sort highest to lowest
            sortedTokens = stats.tokens
                .filter(token => token.riskScore !== null)
                .sort((a, b) => b.riskScore - a.riskScore);
        } else {
            // For other metrics, sort highest to lowest
            sortedTokens = stats.tokens.sort((a, b) => b[metric] - a[metric]);
        }
        
        // Limit results
        const topTokens = sortedTokens.slice(0, parseInt(limit, 10));
        
        res.json({
            message: `Top ${limit} tokens by ${metric}`,
            data: {
                tokens: topTokens,
                metric,
                timeframe: `${hours} hours`
            }
        });
    } catch (error) {
        console.error('Error getting top tokens:', error);
        res.status(500).json({ 
            error: 'Error getting top tokens', 
            details: error.message 
        });
    }
};