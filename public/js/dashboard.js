/**
 * Dashboard Controller for Stratus Relayer WebSocket Interface
 * Handles UI interactions and coordinates with WebSocket client
 */

class DashboardController {
    constructor() {
        this.client = null;
        this.currentTradeFilter = 'all';
        
        this.init();
    }

    init() {
        // Initialize WebSocket client
        this.client = new StratusWebSocketClient();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.initializeUI();
    }

    setupEventListeners() {
        // Auth modal events
        this.setupAuthModalEvents();
        
        // Control panel events
        this.setupControlPanelEvents();
        
        // Search events
        this.setupSearchEvents();
        
        // Filter events
        this.setupFilterEvents();
        
        // Action button events
        this.setupActionButtonEvents();
        
        // Utility events
        this.setupUtilityEvents();
    }

    setupAuthModalEvents() {
        const authBtn = document.getElementById('authBtn');
        const authModal = document.getElementById('authModal');
        const closeAuthModal = document.getElementById('closeAuthModal');
        const authForm = document.getElementById('authForm');

        // Open auth modal
        authBtn.addEventListener('click', () => {
            authModal.classList.add('active');
        });

        // Close auth modal
        closeAuthModal.addEventListener('click', () => {
            authModal.classList.remove('active');
        });

        // Close modal on backdrop click
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.classList.remove('active');
            }
        });

        // Handle auth form submission
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const token = document.getElementById('jwtToken').value.trim();
            
            if (!token) {
                this.showNotification('Please enter a JWT token', 'error');
                return;
            }

            this.client.authenticate(token);
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal.classList.contains('active')) {
                authModal.classList.remove('active');
            }
        });
    }

    setupControlPanelEvents() {
        const timeRange = document.getElementById('timeRange');
        const tokenFilter = document.getElementById('tokenFilter');
        const walletFilter = document.getElementById('walletFilter');

        // Update filters when changed
        [timeRange, tokenFilter, walletFilter].forEach(input => {
            input.addEventListener('change', () => {
                this.client.updateCurrentFilters();
                
                // Auto-refresh if authenticated and subscribed
                if (this.client.isAuthenticated) {
                    this.debounce(() => {
                        this.client.requestRefresh();
                    }, 1000)();
                }
            });
        });

        // Top tokens metric selector
        const topTokensMetric = document.getElementById('topTokensMetric');
        topTokensMetric.addEventListener('change', () => {
            if (this.client.isAuthenticated) {
                const metric = topTokensMetric.value;
                this.client.requestTopTokens(metric, 10);
            }
        });
    }

    setupSearchEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const searchQuery = document.getElementById('searchQuery');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        // Search button click
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        // Search on Enter key
        searchQuery.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Clear search results
        clearSearchBtn.addEventListener('click', () => {
            this.clearSearchResults();
        });
    }

    setupFilterEvents() {
        // Trade type filters
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentTradeFilter = btn.dataset.type;
                this.filterTrades();
            });
        });
    }

    setupActionButtonEvents() {
        const subscribeBtn = document.getElementById('subscribeBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const topTokensBtn = document.getElementById('topTokensBtn');

        // Subscribe/Unsubscribe button
        subscribeBtn.addEventListener('click', () => {
            if (this.client.isAuthenticated) {
                this.client.updateCurrentFilters();
                this.client.subscribeToCryptoTracking();
                
                // Update button state
                subscribeBtn.innerHTML = '<i class="fas fa-check"></i> Subscribed';
                subscribeBtn.disabled = true;
                
                // Re-enable after 3 seconds
                setTimeout(() => {
                    subscribeBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Resubscribe';
                    subscribeBtn.disabled = false;
                }, 3000);
            } else {
                this.client.showAuthModal();
            }
        });

        // Refresh button
        refreshBtn.addEventListener('click', () => {
            if (this.client.isAuthenticated) {
                this.client.requestRefresh();
                
                // Animate refresh button
                const icon = refreshBtn.querySelector('i');
                icon.classList.add('fa-spin');
                setTimeout(() => {
                    icon.classList.remove('fa-spin');
                }, 1000);
            } else {
                this.client.showAuthModal();
            }
        });

        // Top tokens button
        topTokensBtn.addEventListener('click', () => {
            if (this.client.isAuthenticated) {
                const metric = document.getElementById('topTokensMetric').value;
                this.client.requestTopTokens(metric, 10);
            } else {
                this.client.showAuthModal();
            }
        });
    }

    setupUtilityEvents() {
        const clearLogBtn = document.getElementById('clearLogBtn');
        const toggleInfoBtn = document.getElementById('toggleInfo');
        const integrationDetails = document.getElementById('integrationDetails');
        
        // Clear activity log
        clearLogBtn.addEventListener('click', () => {
            this.client.clearLog();
        });

        // Toggle integration info section
        toggleInfoBtn.addEventListener('click', () => {
            const isExpanded = integrationDetails.classList.contains('expanded');
            
            if (isExpanded) {
                integrationDetails.classList.remove('expanded');
                toggleInfoBtn.classList.remove('active');
            } else {
                integrationDetails.classList.add('expanded');
                toggleInfoBtn.classList.add('active');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchQuery').focus();
            }
            
            // Ctrl/Cmd + R for refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r' && this.client.isAuthenticated) {
                e.preventDefault();
                this.client.requestRefresh();
            }
            
            // Ctrl/Cmd + I for toggle integration info
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                toggleInfoBtn.click();
            }
        });

        // Window beforeunload
        window.addEventListener('beforeunload', () => {
            if (this.client) {
                this.client.disconnect();
            }
        });
    }

    initializeUI() {
        // Initialize stat cards with loading state
        this.showLoadingStats();
        
        // Initialize empty states
        this.showEmptyTopTokens();
        this.showEmptyTrades();
        
        // Setup periodic updates for relative timestamps
        this.startTimeUpdates();
        
        // Load any saved preferences
        this.loadUserPreferences();
    }

    performSearch() {
        const query = document.getElementById('searchQuery').value.trim();
        
        if (!query) {
            this.showNotification('Please enter a search term', 'warning');
            return;
        }

        if (!this.client.isAuthenticated) {
            this.client.showAuthModal();
            return;
        }

        this.client.searchTokens(query);
    }

    clearSearchResults() {
        const searchSection = document.getElementById('searchSection');
        const searchQuery = document.getElementById('searchQuery');
        
        searchSection.style.display = 'none';
        searchQuery.value = '';
    }

    filterTrades() {
        const tradeItems = document.querySelectorAll('.trade-item');
        
        tradeItems.forEach(item => {
            const tradeType = item.querySelector('.trade-type');
            if (!tradeType) return;
            
            const type = tradeType.textContent.toLowerCase();
            
            if (this.currentTradeFilter === 'all' || type === this.currentTradeFilter.toLowerCase()) {
                item.style.display = 'block';
                item.style.animation = 'fadeIn 0.3s ease-in-out';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showLoadingStats() {
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            stat.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        });
    }

    showEmptyTopTokens() {
        const container = document.getElementById('topTokensList');
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-coins"></i>
                <span>Connect and authenticate to see top tokens</span>
            </div>
        `;
    }

    showEmptyTrades() {
        const container = document.getElementById('tradesList');
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-chart-line"></i>
                <span>Connect and authenticate to see recent trades</span>
            </div>
        `;
    }

    startTimeUpdates() {
        // Update relative timestamps every minute
        setInterval(() => {
            this.updateRelativeTimestamps();
        }, 60000);
    }

    updateRelativeTimestamps() {
        const timestampElements = document.querySelectorAll('[data-timestamp]');
        
        timestampElements.forEach(element => {
            const timestamp = new Date(element.dataset.timestamp);
            const relative = this.getRelativeTime(timestamp);
            element.textContent = relative;
        });
    }

    getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    loadUserPreferences() {
        // Load saved preferences from localStorage
        const savedFilters = localStorage.getItem('stratus-filters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                
                if (filters.hours) {
                    document.getElementById('timeRange').value = filters.hours;
                }
                if (filters.tokenSymbol) {
                    document.getElementById('tokenFilter').value = filters.tokenSymbol;
                }
                if (filters.walletName) {
                    document.getElementById('walletFilter').value = filters.walletName;
                }
                
                this.client.updateCurrentFilters();
            } catch (e) {
                console.warn('Failed to load saved filters:', e);
            }
        }
        
        // Save filters when they change
        ['timeRange', 'tokenFilter', 'walletFilter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.saveUserPreferences();
            });
        });
    }

    saveUserPreferences() {
        const filters = {
            hours: document.getElementById('timeRange').value,
            tokenSymbol: document.getElementById('tokenFilter').value,
            walletName: document.getElementById('walletFilter').value
        };
        
        localStorage.setItem('stratus-filters', JSON.stringify(filters));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 5 seconds or on click
        const remove = () => {
            notification.remove();
        };
        
        notification.querySelector('.notification-close').addEventListener('click', remove);
        setTimeout(remove, 5000);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
    }

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        max-width: 400px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        border-color: var(--success-color);
        background: rgba(16, 185, 129, 0.1);
        color: var(--success-color);
    }
    
    .notification.error {
        border-color: var(--danger-color);
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger-color);
    }
    
    .notification.warning {
        border-color: var(--warning-color);
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning-color);
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: var(--spacing-xs);
        border-radius: var(--radius-sm);
        margin-left: auto;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
