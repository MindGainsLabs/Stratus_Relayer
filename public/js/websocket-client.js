/**
 * WebSocket Client for Stratus Relayer Dashboard
 * Handles connection, authentication, and real-time data updates
 * 
 * Third-party integration example connecting to external server:
 * Server: http://srv800316.hstgr.cloud:8081
 */

class StratusWebSocketClient {
    constructor() {
        this.socket = null;
        this.isAuthenticated = false;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // External server configuration for third-party integration
        this.serverConfig = {
            url: 'ws://srv800316.hstgr.cloud:8081',
            timeout: 10000,
            reconnectionDelay: 2000  // Slightly longer delay for external server
        };
        
        this.currentFilters = {
            hours: 24,
            tokenSymbol: null,
            walletName: null
        };
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.authenticate = this.authenticate.bind(this);
        this.handleConnectionEvents = this.handleConnectionEvents.bind(this);
        this.handleAuthEvents = this.handleAuthEvents.bind(this);
        this.handleDataEvents = this.handleDataEvents.bind(this);
        
        this.init();
    }

    init() {
        this.logActivity('Dashboard initialized', 'info');
        this.connect();
    }

    connect() {
        // External server URL for third-party integration testing
        const serverUrl = this.serverConfig.url;

        this.logActivity(`Connecting to external Stratus Relayer: ${serverUrl}...`, 'info');

        this.socket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: this.serverConfig.reconnectionDelay,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: this.serverConfig.timeout,
            // Additional configuration for external server
            forceNew: true,
            transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
        });

        this.handleConnectionEvents();
        this.handleAuthEvents();
        this.handleDataEvents();
        this.handleErrorEvents();
    }

    handleConnectionEvents() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            this.logActivity('Connected to Stratus Relayer', 'success');
            
            // Enable auth button
            document.getElementById('authBtn').disabled = false;
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.isAuthenticated = false;
            this.updateConnectionStatus(false);
            this.logActivity(`Disconnected: ${reason}`, 'warning');
            this.disableAuthenticatedFeatures();
        });

        this.socket.on('connect_error', (error) => {
            this.logActivity(`Connection error: ${error.message}`, 'error');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this.logActivity(`Reconnected after ${attemptNumber} attempts`, 'success');
        });

        this.socket.on('reconnect_failed', () => {
            this.logActivity('Failed to reconnect after maximum attempts', 'error');
        });
    }

    handleAuthEvents() {
        this.socket.on('authenticated', (data) => {
            this.isAuthenticated = true;
            this.logActivity(`Authenticated as ${data.user.username || data.user.id}`, 'success');
            this.enableAuthenticatedFeatures();
            this.closeAuthModal();
            
            // Auto-subscribe after authentication
            this.subscribeToCryptoTracking();
        });

        this.socket.on('authentication-failed', (data) => {
            this.isAuthenticated = false;
            this.logActivity(`Authentication failed: ${data.message}`, 'error');
            this.showAuthModal();
        });

        this.socket.on('authentication-required', (data) => {
            this.logActivity('Authentication required for this action', 'warning');
            this.showAuthModal();
        });
    }

    handleDataEvents() {
        // Welcome data
        this.socket.on('welcome-data', (data) => {
            this.logActivity('Welcome data received', 'success');
            this.updateStatistics(data.data.stats);
            this.updateRecentTrades(data.data.trackedMessages);
        });

        // Structured crypto data
        this.socket.on('structured-crypto-data', (data) => {
            this.logActivity('Real-time crypto data received', 'info');
            this.updateStatistics(data.data.stats);
            this.updateRecentTrades(data.data.trackedMessages);
            this.updateStatsTimestamp();
        });

        // Token statistics
        this.socket.on('token-stats', (data) => {
            this.logActivity('Token statistics received', 'info');
            this.updateStatistics(data.data);
            this.updateStatsTimestamp();
        });

        // Search results
        this.socket.on('token-search-results', (data) => {
            this.logActivity(`Search completed: ${data.results} results`, 'success');
            this.displaySearchResults(data);
        });

        // Top tokens
        this.socket.on('top-tokens', (data) => {
            this.logActivity(`Top tokens received (${data.data.metric})`, 'success');
            this.updateTopTokens(data.data);
        });

        // Subscription confirmations
        this.socket.on('crypto-subscription-confirmed', (data) => {
            this.logActivity('Subscribed to crypto tracking updates', 'success');
        });

        this.socket.on('crypto-subscription-cancelled', (data) => {
            this.logActivity('Unsubscribed from crypto tracking', 'info');
        });
    }

    handleErrorEvents() {
        const errorEvents = [
            'structured-crypto-data-error',
            'token-stats-error',
            'token-search-error',
            'top-tokens-error'
        ];

        errorEvents.forEach(event => {
            this.socket.on(event, (data) => {
                this.logActivity(`Error: ${data.error}`, 'error');
            });
        });
    }

    authenticate(token) {
        if (!this.isConnected) {
            this.logActivity('Not connected to server', 'error');
            return;
        }

        this.logActivity('Authenticating...', 'info');
        this.socket.emit('authenticate', { token });
    }

    subscribeToCryptoTracking(filters = null) {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }

        const options = filters || this.currentFilters;
        this.logActivity(`Subscribing to crypto tracking (${options.hours}h)`, 'info');
        this.socket.emit('subscribe-crypto-tracking', options);
    }

    searchTokens(query) {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }

        if (!query.trim()) {
            this.logActivity('Search query cannot be empty', 'error');
            return;
        }

        this.logActivity(`Searching for: ${query}`, 'info');
        this.socket.emit('search-tokens', { 
            query: query.trim(), 
            hours: this.currentFilters.hours 
        });
    }

    requestTopTokens(metric = 'totalSol', limit = 10) {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }

        this.logActivity(`Requesting top ${limit} tokens by ${metric}`, 'info');
        this.socket.emit('request-top-tokens', { 
            metric, 
            hours: this.currentFilters.hours, 
            limit 
        });
    }

    requestRefresh() {
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }

        this.logActivity('Requesting data refresh', 'info');
        this.socket.emit('request-structured-crypto-data', this.currentFilters);
        this.socket.emit('request-token-stats', { hours: this.currentFilters.hours });
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        const statusIcon = statusElement.querySelector('i');
        const statusText = statusElement.querySelector('span');

        if (connected) {
            statusElement.classList.add('connected');
            statusElement.classList.remove('disconnected');
            statusText.textContent = 'Connected';
        } else {
            statusElement.classList.remove('connected');
            statusElement.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
        }
    }

    enableAuthenticatedFeatures() {
        const buttons = [
            'subscribeBtn',
            'refreshBtn', 
            'topTokensBtn',
            'searchBtn'
        ];

        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });

        // Update auth button
        const authBtn = document.getElementById('authBtn');
        authBtn.innerHTML = '<i class="fas fa-check"></i> Authenticated';
        authBtn.disabled = true;
    }

    disableAuthenticatedFeatures() {
        const buttons = [
            'subscribeBtn',
            'refreshBtn',
            'topTokensBtn', 
            'searchBtn'
        ];

        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true;
        });

        // Reset auth button
        const authBtn = document.getElementById('authBtn');
        authBtn.innerHTML = '<i class="fas fa-key"></i> Authenticate';
        authBtn.disabled = !this.isConnected;
    }

    updateStatistics(stats) {
        // Update stat cards
        document.getElementById('totalTokens').textContent = stats.tokens?.length || 0;
        document.getElementById('totalWallets').textContent = stats.wallets?.length || 0;
        document.getElementById('totalSol').textContent = (stats.totalSol || 0).toFixed(2);
        document.getElementById('totalMessages').textContent = stats.summary?.totalMessages || 0;

        // Update top tokens if available
        if (stats.tokens && stats.tokens.length > 0) {
            this.updateTopTokensList(stats.tokens.slice(0, 10));
        }
    }

    updateTopTokensList(tokens) {
        const container = document.getElementById('topTokensList');
        if (!container) return;

        if (tokens.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-inbox"></i>
                    <span>No tokens found</span>
                </div>
            `;
            return;
        }

        container.innerHTML = tokens.map((token, index) => `
            <div class="token-item">
                <div class="token-info">
                    <div>
                        <div class="token-name">#${index + 1} ${token.symbol}</div>
                        <div class="token-metrics">
                            <span class="metric">💎 ${(token.totalSol || 0).toFixed(2)} SOL</span>
                            <span class="metric">📢 ${token.mentions || 0} mentions</span>
                            <span class="metric">👥 ${token.uniqueWallets || 0} wallets</span>
                            ${token.riskScore ? `<span class="metric">⚠️ ${(token.riskScore * 100).toFixed(0)}% risk</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateTopTokens(data) {
        this.updateTopTokensList(data.tokens);
    }

    updateRecentTrades(messages) {
        const container = document.getElementById('tradesList');
        if (!container || !messages) return;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-chart-line"></i>
                    <span>No recent trades</span>
                </div>
            `;
            return;
        }

        const recentTrades = messages.slice(0, 20); // Show last 20 trades
        
        container.innerHTML = recentTrades.map(trade => {
            const value = trade.trade?.value || 0;
            const type = trade.messageType?.toLowerCase() || 'unknown';
            
            return `
                <div class="trade-item">
                    <div class="trade-info">
                        <div>
                            <div class="trade-token">${trade.token?.symbol || 'Unknown'}</div>
                            <div class="trade-details">
                                <span class="trade-type ${type}">${trade.messageType || 'UNKNOWN'}</span>
                                <span class="detail">💎 ${value.toFixed(2)} SOL</span>
                                ${trade.trade?.wallet ? `<span class="detail">👤 ${trade.trade.wallet}</span>` : ''}
                                <span class="detail">⏰ ${new Date(trade.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    displaySearchResults(data) {
        const section = document.getElementById('searchSection');
        const container = document.getElementById('searchResults');
        
        section.style.display = 'block';
        
        if (data.results === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-search"></i>
                    <span>No results found</span>
                </div>
            `;
            return;
        }

        container.innerHTML = data.data.tokens.map(token => `
            <div class="token-item">
                <div class="token-info">
                    <div>
                        <div class="token-name">${token.symbol}</div>
                        <div class="token-metrics">
                            <span class="metric">💎 ${(token.totalSol || 0).toFixed(2)} SOL</span>
                            <span class="metric">📢 ${token.mentions || 0} mentions</span>
                            <span class="metric">👥 ${token.uniqueWallets || 0} wallets</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateStatsTimestamp() {
        const element = document.getElementById('statsTimestamp');
        if (element) {
            element.textContent = `Updated ${new Date().toLocaleTimeString()}`;
        }
    }

    showAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.add('active');
    }

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.remove('active');
    }

    logActivity(message, type = 'info') {
        const logContainer = document.getElementById('activityLog');
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' :
                    'info-circle';
        
        logEntry.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Keep only last 50 entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    clearLog() {
        const logContainer = document.getElementById('activityLog');
        logContainer.innerHTML = `
            <div class="log-entry info">
                <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                <i class="fas fa-info-circle"></i>
                <span>Activity log cleared</span>
            </div>
        `;
    }

    updateCurrentFilters() {
        this.currentFilters = {
            hours: parseInt(document.getElementById('timeRange').value) || 24,
            tokenSymbol: document.getElementById('tokenFilter').value.trim() || null,
            walletName: document.getElementById('walletFilter').value.trim() || null
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Export for use in dashboard.js
window.StratusWebSocketClient = StratusWebSocketClient;
