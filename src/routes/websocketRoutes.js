import { authenticateTokenWS } from '../middlewares/auth.js';
import { 
    broadcastStructuredCryptoData,
    broadcastTokenStats, 
    broadcastTokenSearch, 
    broadcastTopTokens,
    sendWelcomeData
} from '../services/cryptoWebSocketService.js';
import { getChannelStats } from '../services/channelStatsService.js';

/**
 * Configure WebSocket routes and event handlers
 * @param {Object} io - Socket.IO server instance
 */
export const configureWebSocketRoutes = (io) => {
    // WebSocket connection handler
    io.on('connection', (socket) => {
        console.log(`Stratus Relayer - Client connected: ${socket.id}`);
        
        // Handle client disconnect
        socket.on('disconnect', () => {
            console.log(`Stratus Relayer - Client disconnected: ${socket.id}`);
        });

        // Handle authentication
        socket.on('authenticate', async (data) => {
            try {
                const { token } = data;
                const user = await authenticateTokenWS(token);
                
                if (user) {
                    socket.user = user;
                    socket.authenticated = true;
                    socket.emit('authenticated', {
                        message: 'Successfully authenticated',
                        user: user,
                        timestamp: new Date()
                    });
                    console.log(`Client ${socket.id} authenticated as ${user.username || user.id}`);
                } else {
                    socket.emit('authentication-failed', {
                        message: 'Invalid token',
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error('Authentication error:', error);
                socket.emit('authentication-failed', {
                    message: 'Authentication error',
                    error: error.message,
                    timestamp: new Date()
                });
            }
        });

        // Middleware to check authentication for protected events
        const requireAuth = (eventHandler) => {
            return async (...args) => {
                if (!socket.authenticated) {
                    socket.emit('authentication-required', {
                        message: 'Authentication required for this action',
                        timestamp: new Date()
                    });
                    return;
                }
                return eventHandler(...args);
            };
        };

        // Subscribe to crypto tracking updates
        socket.on('subscribe-crypto-tracking', requireAuth(async (data = {}) => {
            // Garantir paginação consistente para histórico
            const enriched = { ...data };
            if (!Number.isInteger(enriched.page) || enriched.page <= 0) enriched.page = 1;
            if (!Number.isInteger(enriched.limit) || enriched.limit <= 0) enriched.limit = 20;
            console.log(`Client ${socket.id} subscribed to crypto-tracking:`, enriched);
            socket.join('crypto-tracking');
            
            // Send welcome message with current data (paginated)
            await sendWelcomeData(socket.id, enriched);
            
            socket.emit('crypto-subscription-confirmed', {
                message: 'Successfully subscribed to crypto tracking updates',
                pagination: { page: enriched.page, limit: enriched.limit },
                timestamp: new Date()
            });
        }));

        // Unsubscribe from crypto tracking
        socket.on('unsubscribe-crypto-tracking', () => {
            console.log(`Client ${socket.id} unsubscribed from crypto-tracking`);
            socket.leave('crypto-tracking');
            
            socket.emit('crypto-subscription-cancelled', {
                message: 'Successfully unsubscribed from crypto tracking updates',
                timestamp: new Date()
            });
        });

        // Request structured crypto data (supports optional pagination: { page, limit })
        socket.on('request-structured-crypto-data', requireAuth(async (options = {}) => {
            console.log(`Client ${socket.id} requested structured crypto data:`, options);
            
            try {
                await broadcastStructuredCryptoData(options);
                
                socket.emit('structured-crypto-data-requested', {
                    message: 'Structured crypto data request processed',
                    options: options,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('structured-crypto-data-error', {
                    message: 'Error processing structured crypto data request',
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }));

        // Request token statistics
        socket.on('request-token-stats', requireAuth(async (options = {}) => {
            console.log(`Client ${socket.id} requested token stats:`, options);
            
            try {
                await broadcastTokenStats(options);
                
                socket.emit('token-stats-requested', {
                    message: 'Token statistics request processed',
                    options: options,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('token-stats-error', {
                    message: 'Error processing token stats request',
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }));

        // Search tokens
        socket.on('search-tokens', requireAuth(async (searchOptions = {}) => {
            console.log(`Client ${socket.id} searching tokens:`, searchOptions);
            
            try {
                await broadcastTokenSearch(searchOptions, socket.id);
                
                socket.emit('token-search-requested', {
                    message: 'Token search request processed',
                    searchOptions: searchOptions,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('token-search-error', {
                    message: 'Error processing token search request',
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }));

        // Request top tokens
        socket.on('request-top-tokens', requireAuth(async (options = {}) => {
            const enrichedOptions = { ...options };
            if (!('page' in enrichedOptions)) enrichedOptions.page = 1; // default first page
            if (!('pageSize' in enrichedOptions)) enrichedOptions.pageSize = 20; // default page size
            console.log(`Client ${socket.id} requested top tokens:`, enrichedOptions);
            
            try {
                await broadcastTopTokens(enrichedOptions);
                
                socket.emit('top-tokens-requested', {
                    message: 'Top tokens request processed',
                    options: enrichedOptions,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('top-tokens-error', {
                    message: 'Error processing top tokens request',
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }));

        // Handle real-time subscription with custom filters
        socket.on('subscribe-filtered-tracking', requireAuth(async (filters = {}) => {
            console.log(`Client ${socket.id} subscribed to filtered tracking:`, filters);
            
            // Create a custom room based on filters
            const roomName = `filtered-crypto-${socket.id}`;
            socket.join(roomName);
            
            // Store filters in socket for future broadcasts
            socket.cryptoFilters = filters;
            
            // Send initial data with filters
            await sendWelcomeData(socket.id, filters);
            
            socket.emit('filtered-subscription-confirmed', {
                message: 'Successfully subscribed to filtered crypto tracking',
                filters: filters,
                roomName: roomName,
                timestamp: new Date()
            });
        }));

        // Real-time message notification (for new Discord messages processed)
        socket.on('subscribe-live-messages', requireAuth(() => {
            console.log(`Client ${socket.id} subscribed to live message updates`);
            socket.join('live-messages');
            
            socket.emit('live-messages-subscription-confirmed', {
                message: 'Successfully subscribed to live message updates',
                timestamp: new Date()
            });
        }));

        // Unsubscribe from live messages
        socket.on('unsubscribe-live-messages', () => {
            console.log(`Client ${socket.id} unsubscribed from live messages`);
            socket.leave('live-messages');
            
            socket.emit('live-messages-subscription-cancelled', {
                message: 'Successfully unsubscribed from live message updates',
                timestamp: new Date()
            });
        });

        // Handle risk report updates subscription
        socket.on('subscribe-risk-updates', requireAuth(() => {
            console.log(`Client ${socket.id} subscribed to risk report updates`);
            socket.join('risk-updates');
            
            socket.emit('risk-updates-subscription-confirmed', {
                message: 'Successfully subscribed to risk report updates',
                timestamp: new Date()
            });
        }));

        // Custom query with real-time response
        socket.on('custom-crypto-query', requireAuth(async (queryParams = {}) => {
            console.log(`Client ${socket.id} made custom crypto query:`, queryParams);
            
            try {
                // Process custom query and send response only to requesting client
                if (queryParams.type === 'structured-data') {
                    await broadcastStructuredCryptoData(queryParams);
                } else if (queryParams.type === 'token-stats') {
                    await broadcastTokenStats(queryParams);
                } else if (queryParams.type === 'search') {
                    await broadcastTokenSearch(queryParams, socket.id);
                } else if (queryParams.type === 'top-tokens') {
                    await broadcastTopTokens(queryParams);
                } else {
                    socket.emit('custom-query-error', {
                        message: 'Invalid query type',
                        validTypes: ['structured-data', 'token-stats', 'search', 'top-tokens'],
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                socket.emit('custom-query-error', {
                    message: 'Error processing custom query',
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }));

        // Ping/Pong for connection health check
        socket.on('ping', () => {
            socket.emit('pong', {
                timestamp: new Date(),
                clientId: socket.id
            });
        });

        // Subscribe to channel stats updates (joins room per channel)
        socket.on('subscribe-channel-stats', requireAuth(async ({ channelId }) => {
            if (!channelId) {
                socket.emit('channel-stats-error', { message: 'channelId required', timestamp: new Date() });
                return;
            }
            const room = `channel-stats-${channelId}`;
            socket.join(room);
            const stats = await getChannelStats(channelId);
            socket.emit('channel-stats', { channelId, stats, timestamp: new Date() });
            socket.emit('channel-stats-subscription-confirmed', { channelId, room, timestamp: new Date() });
        }));

        // Unsubscribe channel stats
        socket.on('unsubscribe-channel-stats', ({ channelId }) => {
            if (!channelId) return;
            const room = `channel-stats-${channelId}`;
            socket.leave(room);
            socket.emit('channel-stats-unsubscribed', { channelId, timestamp: new Date() });
        });

        // Request one-shot stats
        socket.on('request-channel-stats', requireAuth( async ({ channelId }) => {
            if (!channelId) {
                socket.emit('channel-stats-error', { message: 'channelId required', timestamp: new Date() });
                return;
            }
            try {
                const stats = await getChannelStats(channelId);
                socket.emit('channel-stats', { channelId, stats, timestamp: new Date() });
            } catch (e) {
                socket.emit('channel-stats-error', { message: e.message, channelId, timestamp: new Date() });
            }
        }));
    });
};
