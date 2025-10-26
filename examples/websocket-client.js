/**
 * Example client implementation for Stratus_Relayer WebSocket API
 * This file demonstrates how to connect and interact with the crypto tracking WebSockets
 */

import { io } from 'socket.io-client';

class StratusRelayerWebSocketClient {
    constructor(serverUrl = 'ws://localhost:80', token = null) {
        this.serverUrl = serverUrl;
        this.token = token;
        this.socket = null;
        this.isAuthenticated = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.connect();
    }

    connect() {
        console.log(`🔗 Connecting to Stratus_Relayer at ${this.serverUrl}...`);
        
        this.socket = io(this.serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 10000
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Connected to Stratus_Relayer WebSocket');
            this.reconnectAttempts = 0;
            
            if (this.token) {
                this.authenticate();
            } else {
                console.log('⚠️  No token provided. Authentication required for crypto tracking.');
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`❌ Disconnected: ${reason}`);
            this.isAuthenticated = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
            if (this.token) {
                this.authenticate();
            }
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect after maximum attempts');
        });

        // Authentication events
        this.socket.on('authenticated', (data) => {
            console.log('✅ Authentication successful');
            console.log(`👤 User: ${data.user.username || data.user.id}`);
            this.isAuthenticated = true;
            
            // Auto-subscribe to crypto tracking after authentication
            this.subscribeToCryptoTracking();
        });

        this.socket.on('authentication-failed', (data) => {
            console.error('❌ Authentication failed:', data.message);
            this.isAuthenticated = false;
        });

        this.socket.on('authentication-required', (data) => {
            console.warn('⚠️  Authentication required:', data.message);
        });

        // Subscription events
        this.socket.on('crypto-subscription-confirmed', (data) => {
            console.log('🎯 Successfully subscribed to crypto tracking');
        });

        this.socket.on('crypto-subscription-cancelled', (data) => {
            console.log('🔄 Unsubscribed from crypto tracking');
        });

        // Data events
        this.socket.on('welcome-data', (data) => {
            console.log('🎉 Welcome data received');
            this.displayWelcomeData(data.data);
        });

        this.socket.on('structured-crypto-data', (data) => {
            console.log('📈 Real-time crypto data update received');
            this.displayCryptoData(data.data);
        });

        this.socket.on('token-stats', (data) => {
            console.log('📊 Token statistics update received');
            this.displayTokenStats(data.data);
        });

        this.socket.on('token-search-results', (data) => {
            console.log(`🔍 Search results: ${data.results} matches found`);
            this.displaySearchResults(data);
        });

        this.socket.on('top-tokens', (data) => {
            console.log(`🏆 Top tokens by ${data.data.metric} received`);
            this.displayTopTokens(data.data);
        });

        // Error events
        this.socket.on('structured-crypto-data-error', (data) => {
            console.error('❌ Crypto data error:', data.error);
        });

        this.socket.on('token-stats-error', (data) => {
            console.error('❌ Token stats error:', data.error);
        });

        this.socket.on('token-search-error', (data) => {
            console.error('❌ Token search error:', data.error);
        });

        this.socket.on('top-tokens-error', (data) => {
            console.error('❌ Top tokens error:', data.error);
        });

        // Health check
        this.socket.on('pong', (data) => {
            console.log('🏓 Pong received');
        });
    }

    // Authentication
    authenticate() {
        if (!this.token) {
            console.error('❌ No token provided for authentication');
            return;
        }
        
        console.log('🔐 Authenticating...');
        this.socket.emit('authenticate', { token: this.token });
    }

    // Subscription methods
    subscribeToCryptoTracking(options = {}) {
        if (!this.isAuthenticated) {
            console.warn('⚠️  Must be authenticated to subscribe to crypto tracking');
            return;
        }

        const defaultOptions = {
            hours: 24,
            ...options
        };

        console.log('🎯 Subscribing to crypto tracking with options:', defaultOptions);
        this.socket.emit('subscribe-crypto-tracking', defaultOptions);
    }

    unsubscribeFromCryptoTracking() {
        console.log('🔄 Unsubscribing from crypto tracking...');
        this.socket.emit('unsubscribe-crypto-tracking');
    }

    // Request methods
    requestStructuredData(options = {}) {
        if (!this.isAuthenticated) {
            console.warn('⚠️  Authentication required');
            return;
        }

        console.log('📊 Requesting structured crypto data...');
        this.socket.emit('request-structured-crypto-data', {
            hours: 24,
            ...options
        });
    }

    requestTokenStats(hours = 24) {
        if (!this.isAuthenticated) {
            console.warn('⚠️  Authentication required');
            return;
        }

        console.log('📈 Requesting token statistics...');
        this.socket.emit('request-token-stats', { hours });
    }

    searchTokens(query, hours = 24) {
        if (!this.isAuthenticated) {
            console.warn('⚠️  Authentication required');
            return;
        }

        if (!query) {
            console.error('❌ Search query is required');
            return;
        }

        console.log(`🔍 Searching for tokens: "${query}"`);
        this.socket.emit('search-tokens', { query, hours });
    }

    getTopTokens(metric = 'totalSol', hours = 24, limit = 10) {
        if (!this.isAuthenticated) {
            console.warn('⚠️  Authentication required');
            return;
        }

        console.log(`🏆 Requesting top ${limit} tokens by ${metric}...`);
        this.socket.emit('request-top-tokens', { metric, hours, limit });
    }

    // Health check
    ping() {
        console.log('🏓 Sending ping...');
        this.socket.emit('ping');
    }

    // Display methods
    displayWelcomeData(data) {
        console.log('\n📋 === WELCOME DATA ===');
        console.log(`Messages: ${data.trackedMessages.length}`);
        console.log(`Tokens: ${data.stats.tokens.length}`);
        console.log(`Wallets: ${data.stats.wallets.length}`);
        console.log(`Total SOL: ${data.stats.totalSol.toFixed(2)}`);
        console.log(`Connected clients: ${data.clientsConnected}`);
        console.log('========================\n');
    }

    displayCryptoData(data) {
        console.log('\n📈 === CRYPTO DATA UPDATE ===');
        console.log(`📬 Messages: ${data.trackedMessages.length}`);
        console.log(`🪙 Tokens: ${data.stats.tokens.length}`);
        console.log(`💰 Total SOL: ${data.stats.totalSol.toFixed(2)}`);
        
        if (data.trackedMessages.length > 0) {
            console.log('\n🔥 Recent Trades:');
            data.trackedMessages.slice(0, 3).forEach((msg, i) => {
                const value = msg.trade?.value || 0;
                console.log(`${i + 1}. ${msg.messageType} ${msg.token.symbol} - ${value.toFixed(2)} SOL`);
            });
        }
        console.log('==============================\n');
    }

    displayTokenStats(data) {
        console.log('\n📊 === TOKEN STATISTICS ===');
        console.log(`Generated: ${data.generatedAt}`);
        console.log(`Timeframe: ${data.timeframe}`);
        console.log(`Total SOL: ${data.totalSol.toFixed(2)}`);
        
        if (data.tokens.length > 0) {
            console.log('\n🔝 Top Tokens:');
            data.tokens.slice(0, 5).forEach((token, i) => {
                console.log(`${i + 1}. ${token.symbol}: ${token.totalSol.toFixed(2)} SOL, ${token.mentions} mentions`);
            });
        }
        console.log('============================\n');
    }

    displaySearchResults(data) {
        console.log('\n🔍 === SEARCH RESULTS ===');
        console.log(`Query results: ${data.results}`);
        
        if (data.data.tokens.length > 0) {
            console.log('\n📋 Found Tokens:');
            data.data.tokens.forEach((token, i) => {
                console.log(`${i + 1}. ${token.symbol}: ${token.totalSol.toFixed(2)} SOL`);
            });
        }
        console.log('==========================\n');
    }

    displayTopTokens(data) {
        console.log(`\n🏆 === TOP TOKENS BY ${data.metric.toUpperCase()} ===`);
        console.log(`Timeframe: ${data.timeframe}`);
        
        data.tokens.forEach((token, i) => {
            const value = token[data.metric];
            const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
            console.log(`${i + 1}. ${token.symbol}: ${displayValue} ${data.metric}`);
        });
        console.log('===============================\n');
    }

    // Utility methods
    disconnect() {
        if (this.socket) {
            console.log('👋 Disconnecting from Stratus_Relayer...');
            this.socket.disconnect();
        }
    }

    isConnected() {
        return this.socket && this.socket.connected;
    }

    setToken(token) {
        this.token = token;
        if (this.isConnected() && !this.isAuthenticated) {
            this.authenticate();
        }
    }
}

// Example usage
export default StratusRelayerWebSocketClient;

// If running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🚀 Starting Stratus_Relayer WebSocket Example Client...\n');
    
    // You would get this token from your authentication endpoint
    const sampleToken = 'your-jwt-token-here';
    
    const client = new StratusRelayerWebSocketClient('ws://localhost:80', sampleToken);
    
    // Example interactions after connection
    setTimeout(() => {
        if (client.isAuthenticated) {
            console.log('\n🧪 Running example interactions...\n');
            
            // Search for tokens
            client.searchTokens('SOL');
            
            // Get top tokens by different metrics
            setTimeout(() => client.getTopTokens('totalSol', 24, 5), 2000);
            setTimeout(() => client.getTopTokens('mentions', 24, 5), 4000);
            
            // Request fresh token stats
            setTimeout(() => client.requestTokenStats(12), 6000);
            
            // Ping test
            setTimeout(() => client.ping(), 8000);
        }
    }, 3000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down...');
        client.disconnect();
        process.exit(0);
    });
}
