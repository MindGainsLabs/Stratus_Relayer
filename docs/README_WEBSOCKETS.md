# Stratus_Relayer WebSocket API Documentation

## 📖 Overview

The Stratus_Relayer provides a comprehensive WebSocket API for real-time crypto tracking data. This API delivers the same information available through HTTP endpoints but with real-time updates and broadcasting capabilities.

## 📚 API Documentation

### 🔗 Documentation Options

**AsyncAPI (Recommended for WebSockets):**
- **File:** `asyncapi.yaml` - Complete WebSocket API specification
- **Online Viewer:** [AsyncAPI Studio](https://studio.asyncapi.com/) - Paste the YAML content
- **Generate Local Docs:** Run `./generate-asyncapi-docs.sh`

**Swagger (HTTP + WebSocket Reference):**
- **URL:** `http://your-server:8081/api-docs`
- **WebSocket Events:** `http://your-server:8081/api-docs#/WebSocket`
- **Note:** WebSocket events are documented as reference only (not real HTTP endpoints)

### 📋 What Each Documentation Provides

| Documentation | Best For | Features |
|---------------|----------|----------|
| **AsyncAPI** | WebSocket Integration | ✅ Native WS support, event flows, schemas |
| **Swagger** | HTTP APIs + WS Reference | ✅ REST endpoints, WS event reference |

## 🚀 Quick Start

### Installation

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Basic Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://your-server-url:80', {
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('Connected to Stratus_Relayer');
});
```

## 🔐 Authentication

All crypto tracking events require authentication. You must authenticate before subscribing to any crypto data.

### Authenticate via WebSocket

```javascript
socket.emit('authenticate', { token: 'your-jwt-token' });

socket.on('authenticated', (data) => {
    console.log('✅ Authenticated successfully:', data);
    // Now you can subscribe to crypto tracking
});

socket.on('authentication-failed', (data) => {
    console.error('❌ Authentication failed:', data.message);
});
```

## 📊 Core Features

### 1. Subscribe to Crypto Tracking

Subscribe to receive real-time crypto tracking data with automatic broadcasts every 30 seconds.

```javascript
// Basic subscription
socket.emit('subscribe-crypto-tracking', { 
    hours: 24  // Look back 24 hours
});

// Subscription with filters
socket.emit('subscribe-crypto-tracking', {
    hours: 12,
    tokenSymbol: 'BONK',  // Filter by specific token
    walletName: 'specific-wallet'  // Filter by specific wallet
});

// Confirmation
socket.on('crypto-subscription-confirmed', (data) => {
    console.log('🎯 Subscribed to crypto tracking:', data.message);
});

// Receive welcome data immediately after subscription
socket.on('welcome-data', (data) => {
    console.log('🎉 Welcome data received:', data.data);
});
```

### 2. Receive Real-time Data

#### Structured Crypto Data
```javascript
socket.on('structured-crypto-data', (data) => {
    console.log('📈 New crypto data:', data);
    
    // Data structure:
    // {
    //   timestamp: Date,
    //   message: string,
    //   data: {
    //     trackedMessages: Array<TradeMessage>,
    //     stats: TokenStatistics,
    //     filters: FilterOptions
    //   }
    // }
});
```

#### Token Statistics
```javascript
socket.on('token-stats', (data) => {
    console.log('📊 Token statistics:', data);
    
    // Data includes:
    // - tokens: Array of token data with metrics
    // - wallets: Array of wallet statistics  
    // - totalSol: Total SOL volume
    // - summary: Overall statistics
});
```

### 3. Manual Data Requests

#### Request Structured Data
```javascript
socket.emit('request-structured-crypto-data', {
    hours: 6,
    tokenSymbol: 'SOL'
});
```

#### Request Token Statistics
```javascript
socket.emit('request-token-stats', { 
    hours: 12 
});
```

#### Search Tokens
```javascript
socket.emit('search-tokens', {
    query: 'BONK',
    hours: 24
});

socket.on('token-search-results', (data) => {
    console.log('🔍 Search results:', data);
    console.log(`Found ${data.results} matches`);
});
```

#### Get Top Tokens
```javascript
socket.emit('request-top-tokens', {
    metric: 'totalSol',  // or 'mentions', 'uniqueWallets', 'riskScore'
    hours: 24,
    limit: 10
});

socket.on('top-tokens', (data) => {
    console.log('🏆 Top tokens:', data.data.tokens);
});
```

## 📋 Complete Example

```javascript
import { io } from 'socket.io-client';

class StratusRelayerClient {
    constructor(serverUrl, token) {
        this.socket = io(serverUrl, {
            transports: ['websocket']
        });
        this.token = token;
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('🔗 Connected to Stratus_Relayer');
            this.authenticate();
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from Stratus_Relayer');
        });

        // Authentication events
        this.socket.on('authenticated', (data) => {
            console.log('✅ Authenticated:', data.user);
            this.subscribeToCryptoTracking();
        });

        this.socket.on('authentication-failed', (data) => {
            console.error('❌ Auth failed:', data.message);
        });

        // Crypto tracking events
        this.socket.on('crypto-subscription-confirmed', (data) => {
            console.log('🎯 Subscription confirmed');
        });

        this.socket.on('welcome-data', (data) => {
            console.log('🎉 Welcome data received');
            this.processWelcomeData(data.data);
        });

        this.socket.on('structured-crypto-data', (data) => {
            console.log('📈 Real-time crypto data update');
            this.processCryptoData(data.data);
        });

        this.socket.on('token-stats', (data) => {
            console.log('📊 Token statistics update');
            this.processTokenStats(data.data);
        });

        this.socket.on('token-search-results', (data) => {
            console.log(`🔍 Search results: ${data.results} matches`);
            this.processSearchResults(data.data);
        });

        this.socket.on('top-tokens', (data) => {
            console.log('🏆 Top tokens update');
            this.processTopTokens(data.data);
        });

        // Error handling
        this.socket.on('structured-crypto-data-error', (data) => {
            console.error('❌ Crypto data error:', data.error);
        });

        this.socket.on('token-stats-error', (data) => {
            console.error('❌ Token stats error:', data.error);
        });
    }

    authenticate() {
        this.socket.emit('authenticate', { token: this.token });
    }

    subscribeToCryptoTracking(options = {}) {
        const defaultOptions = { 
            hours: 24,
            ...options 
        };
        this.socket.emit('subscribe-crypto-tracking', defaultOptions);
    }

    searchTokens(query, hours = 24) {
        this.socket.emit('search-tokens', { query, hours });
    }

    getTopTokens(metric = 'totalSol', hours = 24, limit = 10) {
        this.socket.emit('request-top-tokens', { metric, hours, limit });
    }

    requestTokenStats(hours = 24) {
        this.socket.emit('request-token-stats', { hours });
    }

    // Data processing methods
    processWelcomeData(data) {
        console.log(`📋 Initial data: ${data.trackedMessages.length} messages`);
        console.log(`📊 Stats: ${data.stats.tokens.length} tokens, ${data.stats.wallets.length} wallets`);
        console.log(`💰 Total SOL: ${data.stats.totalSol}`);
    }

    processCryptoData(data) {
        // Process tracked messages
        data.trackedMessages.forEach(message => {
            console.log(`${message.messageType}: ${message.token.symbol} - ${message.trade?.value || 0} SOL`);
        });
    }

    processTokenStats(data) {
        // Process token statistics
        data.tokens.slice(0, 5).forEach((token, index) => {
            console.log(`${index + 1}. ${token.symbol}: ${token.totalSol} SOL, ${token.mentions} mentions`);
        });
    }

    processSearchResults(data) {
        data.tokens.forEach(token => {
            console.log(`Found: ${token.symbol} - ${token.totalSol} SOL`);
        });
    }

    processTopTokens(data) {
        console.log(`Top tokens by ${data.metric}:`);
        data.tokens.forEach((token, index) => {
            console.log(`${index + 1}. ${token.symbol}: ${token[data.metric]}`);
        });
    }

    disconnect() {
        this.socket.disconnect();
    }
}

// Usage
const client = new StratusRelayerClient('ws://localhost:80', 'your-jwt-token');

// Search for specific tokens
setTimeout(() => {
    client.searchTokens('BONK');
    client.getTopTokens('totalSol', 24, 5);
}, 2000);
```

## 📡 Available Events

### Outgoing Events (Client → Server)

| Event | Description | Parameters | Auth Required |
|-------|-------------|------------|---------------|
| `authenticate` | Authenticate with JWT token | `{ token: string }` | No |
| `subscribe-crypto-tracking` | Subscribe to crypto data | `{ hours?, tokenSymbol?, walletName? }` | Yes |
| `unsubscribe-crypto-tracking` | Unsubscribe from crypto data | None | No |
| `request-structured-crypto-data` | Request structured data | `{ hours?, tokenSymbol?, walletName? }` | Yes |
| `request-token-stats` | Request token statistics | `{ hours? }` | Yes |
| `search-tokens` | Search for tokens | `{ query: string, hours? }` | Yes |
| `request-top-tokens` | Get top tokens | `{ metric?, hours?, limit? }` | Yes |
| `subscribe-filtered-tracking` | Subscribe with custom filters | `{ hours?, tokenSymbol?, walletName? }` | Yes |
| `subscribe-live-messages` | Subscribe to live message updates | None | Yes |
| `ping` | Health check | None | No |

### Incoming Events (Server → Client)

| Event | Description | Data Structure |
|-------|-------------|----------------|
| `authenticated` | Authentication successful | `{ message, user, timestamp }` |
| `authentication-failed` | Authentication failed | `{ message, timestamp }` |
| `crypto-subscription-confirmed` | Subscription confirmed | `{ message, timestamp }` |
| `welcome-data` | Initial data after subscription | `{ message, data, timestamp }` |
| `structured-crypto-data` | Real-time crypto data | `{ message, data, timestamp }` |
| `token-stats` | Token statistics | `{ message, data, timestamp }` |
| `token-search-results` | Search results | `{ message, results, data, timestamp }` |
| `top-tokens` | Top tokens data | `{ message, data, timestamp }` |
| `pong` | Health check response | `{ timestamp, clientId }` |

### Error Events

| Event | Description |
|-------|-------------|
| `authentication-required` | Authentication needed for protected action |
| `structured-crypto-data-error` | Error in crypto data processing |
| `token-stats-error` | Error in token statistics |
| `token-search-error` | Error in token search |
| `top-tokens-error` | Error in top tokens request |

## 🔧 Data Structures

### TradeMessage
```typescript
interface TradeMessage {
    messageId: string;
    timestamp: Date;
    author: string;
    messageType: 'BUY' | 'SELL' | 'MULTI_BUY';
    token: {
        symbol: string;
        id: string;
        marketCap: string;
        price: number;
    };
    trade: {
        action: string;
        wallet: string;
        amount: number;
        value: number;
        percentage: number;
        pnl: {
            sol: number;
            percentage: number;
        };
    };
    meta: {
        totalSol: number;
        walletsCount: number;
        platform: string;
    };
    platforms: string[];
    riskReport?: RiskReport;
}
```

### TokenStatistics
```typescript
interface TokenStatistics {
    tokens: TokenData[];
    wallets: WalletData[];
    totalSol: number;
    summary: {
        totalMessages: number;
        uniqueTokens: number;
        uniqueWallets: number;
        messageTypes: {
            BUY: number;
            SELL: number;
            MULTI_BUY: number;
        };
    };
    generatedAt?: Date;
    timeframe?: string;
}
```

### TokenData
```typescript
interface TokenData {
    symbol: string;
    id: string;
    marketCap: string;
    totalSol: number;
    mentions: number;
    uniqueWallets: number;
    riskScore: number | null;
    platforms: string[];
    actions: {
        BUY: number;
        SELL: number;
        MULTI_BUY: number;
    };
}
```

## ⚙️ Configuration Options

### Filter Options
- `hours`: Number of hours to look back (default: 24)
- `tokenSymbol`: Filter by specific token symbol
- `walletName`: Filter by specific wallet name

### Metrics for Top Tokens
- `totalSol`: Total SOL volume
- `mentions`: Number of mentions
- `uniqueWallets`: Number of unique wallets
- `riskScore`: Risk score (0-1)

## 🚨 Error Handling

```javascript
// Handle connection errors
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

// Handle authentication errors
socket.on('authentication-failed', (data) => {
    console.error('Auth error:', data.message);
    // Re-authenticate or redirect to login
});

// Handle data errors
socket.on('structured-crypto-data-error', (data) => {
    console.error('Data error:', data.error);
});
```

## 🔄 Reconnection Strategy

```javascript
const socket = io('ws://localhost:80', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`);
    // Re-authenticate and re-subscribe
    socket.emit('authenticate', { token: yourToken });
});
```

## 🧪 Testing

Run the WebSocket tests:

```bash
npm test tests/websocket.test.js
```

The test suite covers:
- Authentication flow
- Subscription to crypto tracking
- Data reception and structure validation
- Error handling
- Connection health checks

## 📞 Support

For issues or questions about the WebSocket API:

1. Check the server logs for error details
2. Verify your JWT token is valid and not expired
3. Ensure you're authenticated before subscribing to events
4. Check network connectivity to the WebSocket endpoint

## 📚 Additional Resources

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [JWT Authentication](https://jwt.io/introduction/)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)

---

**Happy coding! 🚀**
