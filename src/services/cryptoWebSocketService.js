import { getCryptoTrackingData, generateTokenStats } from './cryptoTrackingService.js';
import { retrieveMessages } from './messageService.js';

let io = null;

/**
 * Initialize WebSocket service with Socket.IO instance
 * @param {Object} socketIO - Socket.IO instance
 */
export const initializeCryptoWebSocket = (socketIO) => {
    io = socketIO;
    console.log('Stratus Relayer - Crypto WebSocket service initialized');
};

/**
 * Emit structured crypto tracking data to all subscribed clients
 * @param {Object} options - Query options
 */
export const broadcastStructuredCryptoData = async (options = {}) => {
    if (!io) {
        console.error('WebSocket not initialized');
        return;
    }

    try {
    const { hours = 24, tokenSymbol, walletName, channelId, page, limit } = options;
        
        // Ensure data is up to date by first retrieving latest messages if channelId provided
        if (channelId) {
            try {
                await retrieveMessages(channelId, hours);
            } catch (error) {
                console.warn(`Warning: Error retrieving messages from channel ${channelId}`, error.message);
            }
        }
        
        // Get structured data from stored messages
        const result = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10), 
            tokenSymbol, 
            walletName,
            page,
            limit
        });
        const structuredData = Array.isArray(result) ? result : result.data;
        const pagination = Array.isArray(result) ? null : result.pagination;
        
        // Generate statistics from the data
        const stats = generateTokenStats(structuredData);
        
        // pagination agora (quando presente) inclui também "total" (total de itens filtrados)
        const payload = {
            timestamp: new Date(),
            message: 'Crypto tracking data retrieved successfully',
            data: {
                trackedMessages: structuredData,
                stats: stats,
                filters: {
                    hours: parseInt(hours, 10),
                    tokenSymbol: tokenSymbol || 'All',
                    walletName: walletName || 'All'
                },
                pagination
            }
        };

        // Emit to all clients in crypto-tracking room
        io.to('crypto-tracking').emit('structured-crypto-data', payload);
        console.log(`Broadcasted structured crypto data to ${io.sockets.adapter.rooms.get('crypto-tracking')?.size || 0} clients`);
        
        return payload;
    } catch (error) {
        console.error('Error broadcasting structured crypto data:', error);
        
        // Send error to clients
        io.to('crypto-tracking').emit('structured-crypto-data-error', {
            timestamp: new Date(),
            error: error.message
        });
    }
};

/**
 * Emit token statistics to subscribed clients
 * @param {Object} options - Query options
 */
export const broadcastTokenStats = async (options = {}) => {
    if (!io) {
        console.error('WebSocket not initialized');
        return;
    }

    try {
    const { hours = 24, page, limit } = options;
        
        // Get structured data first
        const result = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10),
            page,
            limit
        });
        const structuredData = Array.isArray(result) ? result : result.data;
        const pagination = Array.isArray(result) ? null : result.pagination;
        
        // Generate statistics
        const stats = generateTokenStats(structuredData);
        
        // Add timestamp
        stats.generatedAt = new Date();
        stats.timeframe = `${hours} hours`;
        
        const payload = {
            timestamp: new Date(),
            message: 'Token statistics generated successfully',
            data: { ...stats, pagination }
        };

        io.to('crypto-tracking').emit('token-stats', payload);
        console.log(`Broadcasted token stats to ${io.sockets.adapter.rooms.get('crypto-tracking')?.size || 0} clients`);
        
        return payload;
    } catch (error) {
        console.error('Error broadcasting token stats:', error);
        
        io.to('crypto-tracking').emit('token-stats-error', {
            timestamp: new Date(),
            error: error.message
        });
    }
};

/**
 * Emit search results to specific client or broadcast to room
 * @param {string} socketId - Client socket ID (optional, if not provided broadcasts to room)
 * @param {Object} searchOptions - Search options
 */
export const broadcastTokenSearch = async (searchOptions, socketId = null) => {
    if (!io) {
        console.error('WebSocket not initialized');
        return;
    }

    try {
    const { query, hours = 24, page, limit } = searchOptions;
        
        if (!query) {
            const errorPayload = {
                timestamp: new Date(),
                error: 'Search query is required'
            };
            
            if (socketId) {
                io.to(socketId).emit('token-search-error', errorPayload);
            } else {
                io.to('crypto-tracking').emit('token-search-error', errorPayload);
            }
            return;
        }
        
        // Get all structured data first
        const result = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10),
            page,
            limit
        });
        const structuredData = Array.isArray(result) ? result : result.data;
        const pagination = Array.isArray(result) ? null : result.pagination;
        
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
        
        const payload = {
            timestamp: new Date(),
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
                })),
                pagination
            }
        };

        if (socketId) {
            io.to(socketId).emit('token-search-results', payload);
        } else {
            io.to('crypto-tracking').emit('token-search-results', payload);
        }
        
        return payload;
    } catch (error) {
        console.error('Error broadcasting token search:', error);
        
        const errorPayload = {
            timestamp: new Date(),
            error: error.message
        };
        
        if (socketId) {
            io.to(socketId).emit('token-search-error', errorPayload);
        } else {
            io.to('crypto-tracking').emit('token-search-error', errorPayload);
        }
    }
};

/**
 * Emit top tokens data to subscribed clients
 * @param {Object} options - Query options
 */
export const broadcastTopTokens = async (options = {}) => {
    if (!io) {
        console.error('WebSocket not initialized');
        return;
    }

    try {
    const { metric = 'totalSol', hours = 24, limit, page, pageSize } = options;
        // New pagination parameters (fallbacks)
        // pageSize (page length) governs tokens per page (default 20)
        const effectivePageSize = Number.isInteger(pageSize) && pageSize > 0 ? parseInt(pageSize, 10) : 20;
        const effectivePage = Number.isInteger(page) && page > 0 ? parseInt(page, 10) : 1;
        // Backwards compatibility: legacy 'limit' means "top N overall" when no page passed. If page provided we ignore legacy limit for slicing because slicing happens after pagination of sorted list.
        
        // Validate metric
        const validMetrics = ['totalSol', 'mentions', 'uniqueWallets', 'riskScore'];
        if (!validMetrics.includes(metric)) {
            const errorPayload = {
                timestamp: new Date(),
                error: 'Invalid metric',
                validMetrics: validMetrics.join(', ')
            };
            
            io.to('crypto-tracking').emit('top-tokens-error', errorPayload);
            return;
        }
        
        // Get structured data
        // Always retrieve full structured data for timeframe to compute global ranking.
        // We deliberately DO NOT paginate underlying messages here because ranking aggregates are token-level.
        const result = await getCryptoTrackingData({ 
            hours: parseInt(hours, 10)
        });
        const structuredData = Array.isArray(result) ? result : result.data;
        // underlying pagination (messages) not used for token ranking pagination
        
        // Generate statistics
        const stats = generateTokenStats(structuredData);
        
        // Ensure tokens array
        const tokenArray = Array.isArray(stats.tokens) ? [...stats.tokens] : [];

        // Sort by requested metric and limit results
        let sortedTokens;
        if (metric === 'riskScore') {
            sortedTokens = tokenArray
                .filter(token => token.riskScore !== null && token.riskScore !== undefined)
                .sort((a, b) => b.riskScore - a.riskScore);
        } else {
            sortedTokens = tokenArray.sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
        }
        
        // --- Token pagination (server-side) ---
        const total = sortedTokens.length;
        const pageStart = (effectivePage - 1) * effectivePageSize;
        const pageEnd = pageStart + effectivePageSize;
        const pagedTokens = sortedTokens.slice(pageStart, pageEnd);
        const hasMore = pageEnd < total;
        // For backwards compat: if legacy 'limit' supplied and no explicit page asked, slice top N before paginating fallback
        // However with explicit pagination we ignore legacy limit. If page provided but limit also provided we treat limit as pageSize override.
        let finalTokens = pagedTokens;
        if (!page && limit && !pageSize) {
            finalTokens = sortedTokens.slice(0, parseInt(limit, 10));
        }
        
        const payload = {
            timestamp: new Date(),
            message: `Top tokens by ${metric}`,
            data: {
                tokens: finalTokens,
                metric,
                timeframe: `${hours} hours`,
                pagination: {
                    page: effectivePage,
                    pageSize: effectivePageSize,
                    total,
                    hasMore
                }
            }
        };

        io.to('crypto-tracking').emit('top-tokens', payload);
        console.log(`Broadcasted top tokens to ${io.sockets.adapter.rooms.get('crypto-tracking')?.size || 0} clients`);
        
        return payload;
    } catch (error) {
        console.error('Error broadcasting top tokens:', error);
        
        io.to('crypto-tracking').emit('top-tokens-error', {
            timestamp: new Date(),
            error: error.message
        });
    }
};

/**
 * Get number of connected clients in crypto-tracking room
 * @returns {number} Number of connected clients
 */
export const getConnectedClientsCount = () => {
    if (!io) return 0;
    return io.sockets.adapter.rooms.get('crypto-tracking')?.size || 0;
};

/**
 * Start automatic broadcasting of crypto data
 * @param {number} interval - Interval in milliseconds (default: 30 seconds)
 * @param {Object} options - Default query options
 */
export const startAutoBroadcast = (interval = 30000, options = { hours: 24 }) => {
    console.log(`Starting Stratus Relayer auto-broadcast every ${interval}ms`);
    
    // Broadcast structured crypto data every interval
    setInterval(async () => {
        const clientsCount = getConnectedClientsCount();
        if (clientsCount > 0) {
            console.log(`Auto-broadcasting structured crypto data to ${clientsCount} clients`);
            // Força paginação determinística em histórico para evitar payloads gigantes
            const paginatedOpts = { ...options, page: 1, limit: 20 };
            await broadcastStructuredCryptoData(paginatedOpts);
            await broadcastTokenStats(paginatedOpts);
            // Top tokens já tem sua própria paginação (pageSize default dentro da função), manter página 1
            await broadcastTopTokens({ ...options, page: 1, pageSize: 20 });
        }
    }, interval);
};

/**
 * Send welcome message with current data to newly connected client
 * @param {string} socketId - Client socket ID
 * @param {Object} options - Query options
 */
export const sendWelcomeData = async (socketId, options = { hours: 24 }) => {
    if (!io) {
        console.error('WebSocket not initialized');
        return;
    }

    try {
        // Send current structured data
    const result = await getCryptoTrackingData(options);
    const structuredData = Array.isArray(result) ? result : result.data;
    const pagination = Array.isArray(result) ? null : result.pagination;
    const stats = generateTokenStats(structuredData);
        
        // pagination (quando presente) inclui campo total
        const welcomePayload = {
            timestamp: new Date(),
            message: 'Welcome to Stratus Relayer crypto tracking',
            data: {
                trackedMessages: structuredData,
                stats: stats,
                filters: options,
                clientsConnected: getConnectedClientsCount(),
                pagination
            }
        };

        io.to(socketId).emit('welcome-data', welcomePayload);
        console.log(`Sent welcome data to client ${socketId}`);
        
    } catch (error) {
        console.error('Error sending welcome data:', error);
        
        io.to(socketId).emit('welcome-error', {
            timestamp: new Date(),
            error: error.message
        });
    }
};
