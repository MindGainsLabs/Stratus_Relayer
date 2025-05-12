# 📚 Detailed Documentation for Stratus Relayer

This document provides a detailed explanation of the functionalities of Stratus Relayer, a system for extracting and analyzing Discord messages with Telegram integration and cryptocurrency token analysis.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [Main Components](#main-components)
4. [API Endpoints](#api-endpoints)
   - [Message Endpoints](#message-endpoints)
   - [Crypto Tracking Endpoints](#crypto-tracking-endpoints)
   - [SSE Endpoints](#sse-endpoints)
5. [Detailed Functionalities](#detailed-functionalities)
   - [Discord Message Extraction](#discord-message-extraction)
   - [Crypto Token Analysis](#crypto-token-analysis)
   - [Rugcheck Integration](#rugcheck-integration)
   - [Telegram Forwarding](#telegram-forwarding)
   - [SSE (Server-Sent Events)](#sse-server-sent-events)
6. [Usage Guide](#usage-guide)
   - [Web Interface](#web-interface)
   - [API Queries](#api-queries)
   - [Real-Time with SSE](#real-time-with-sse)
7. [Data Structure](#data-structure)
   - [Message Model](#message-model)
   - [Token Data](#token-data)
   - [Risk Report](#risk-report)
8. [Workflows](#workflows)
   - [MULTI BUY Message Processing](#multi-buy-message-processing)
   - [Token Risk Analysis](#token-risk-analysis)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [System Extension](#system-extension)

---

## System Overview

Stratus Relayer is a Node.js application designed to:

1. **Extract messages** from specific Discord channels
2. **Analyze cryptocurrency tokens** mentioned in the messages
3. **Evaluate risks** of tokens using the Rugcheck API
4. **Forward messages** to Telegram groups
5. **Store and index** structured data for later querying
6. **Provide statistical analysis** of token and wallet activities
7. **Distribute real-time notifications** via SSE (Server-Sent Events)

The system particularly focuses on "MULTI BUY" messages, which show multiple wallets buying a specific cryptocurrency token.

---

## System Architecture

Stratus Relayer follows a modular architecture based on:

- **API Layer**: Express.js for RESTful endpoints
- **Persistence Layer**: MongoDB for data storage
- **Service Layer**: Modules for specific business logic
- **External Integrations**: Discord API, Rugcheck API, and Telegram API
- **Real-Time Communication**: SSE for push updates

```
[Discord API] <-- Extraction --> [Stratus Relayer] <-- Forwarding --> [Telegram]
                                       |
                                       | Analysis
                                       v
                                [Rugcheck API]
```

---

## Main Components

1. **messageService.js**: Extracts messages from Discord and processes their content
2. **rugcheckService.js**: Communicates with the Rugcheck API for token analysis
3. **telegramService.js**: Sends formatted messages to Telegram
4. **tokenParser.js**: Analyzes and structures token data from message text
5. **cryptoTrackingService.js**: Manages statistics and analysis of cryptocurrency data
6. **sseRoutes.js**: Provides real-time updates via SSE

---

## API Endpoints

### Message Endpoints

#### `POST /api/retrieve-messages`
Extracts messages from Discord and returns structured data.

**Body Parameters:**
- `channelId` (string): Discord channel ID to extract messages from
- `hours` (number): How many hours back to fetch messages

**Response:**
```json
{
  "message": "Messages collected successfully.",
  "data": {
    "multiBuyAlerts": [...],
    "tokenAlerts": [...],
    "otherMessages": [...],
    "totalMessages": 42,
    "tokenStats": {...}
  }
}
```

#### `GET /api/download-messages`
Generates a formatted text file with all stored messages.

**Response:** Text file for download

#### `GET /api/total-messages`
Returns the total number of stored messages.

**Response:**
```json
{
  "total": 1337
}
```

#### `GET /api/message-stats`
Returns aggregated statistics about stored messages.

**Response:**
```json
{
  "messageCounts": {
    "MULTI_BUY": 42,
    "TOKEN_ALERT": 15,
    "OTHER": 7
  },
  "totalSolVolume": 1542.75,
  "uniqueTokensCount": 18,
  "topWallets": [...],
  "topTokens": [...]
}
```

#### `GET /api/search-tokens`
Searches tokens by symbol or ID.

**Query Parameters:**
- `query` (string): Search term
- `limit` (number, optional): Maximum number of results (default: 10)

**Response:**
```json
{
  "tokens": [...],
  "count": 5
}
```

### Crypto Tracking Endpoints

#### `POST /api/crypto/structured-data`
Gets structured cryptocurrency tracking data.

**Body Parameters:**
- `hours` (number): How many hours back to analyze
- `tokenSymbol` (string, optional): Filter by specific symbol
- `walletName` (string, optional): Filter by specific wallet
- `channelId` (string, optional): Channel ID to update data before analysis

**Response:**
```json
{
  "message": "Crypto tracking data retrieved successfully",
  "data": {
    "trackedMessages": [...],
    "stats": {
      "tokens": [...],
      "wallets": [...],
      "totalSol": 1542.75
    },
    "filters": {
      "hours": 24,
      "tokenSymbol": "All",
      "walletName": "All"
    }
  }
}
```

#### `GET /api/crypto/token-stats`
Gets general token statistics.

**Query Parameters:**
- `hours` (number, optional): Analysis period in hours (default: 24)

**Response:**
```json
{
  "message": "Token statistics generated successfully",
  "data": {
    "tokens": [...],
    "wallets": [...],
    "totalSol": 1542.75,
    "generatedAt": "2023-08-15T14:30:00.000Z",
    "timeframe": "24 hours"
  }
}
```

#### `GET /api/crypto/search`
Searches tokens by symbol or partial ID.

**Query Parameters:**
- `query` (string): Search term
- `hours` (number, optional): Analysis period in hours (default: 24)

**Response:**
```json
{
  "message": "Token search results",
  "results": 3,
  "data": {
    "tokens": [...],
    "matchingMessages": [...]
  }
}
```

#### `GET /api/crypto/top-tokens`
Returns the top tokens by different metrics.

**Query Parameters:**
- `metric` (string): Metric for sorting ('totalSol', 'mentions', 'uniqueWallets', 'riskScore')
- `hours` (number, optional): Analysis period in hours (default: 24)
- `limit` (number, optional): Maximum number of results (default: 10)

**Response:**
```json
{
  "message": "Top 10 tokens by totalSol",
  "data": {
    "tokens": [...],
    "metric": "totalSol",
    "timeframe": "24 hours"
  }
}
```

### SSE Endpoints

#### `GET /sse/stream`
Establishes an SSE connection to receive real-time updates.

**Response:** SSE event stream

---

## Detailed Functionalities

### Discord Message Extraction

The system extracts messages from specific Discord channels using the following strategies:

1. **Scheduled extraction**: The system regularly runs a CRON job that fetches new messages
2. **On-demand extraction**: API endpoints allow requesting extraction for specific periods
3. **Discord Bot**: A Discord bot can be configured to capture messages in real-time

**How to use:**

1. **Via Web Interface**:
   - Access the system's main page
   - Fill in the Discord channel ID and hours period
   - Click on "Extract Messages"

2. **Via API**:
   ```bash
   curl -X POST http://your-server/api/retrieve-messages \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_jwt_token" \
     -d '{"channelId": "123456789012345678", "hours": 24}'
   ```

### Crypto Token Analysis

The system analyzes "MULTI BUY" messages to extract:

1. **Token Identification**: Token symbol and ID
2. **Transaction Volume**: Total SOL used in purchases
3. **Wallet Activity**: Which wallets bought, how much and when
4. **Retention Statistics**: How much each wallet is holding (%)
5. **Platforms**: On which platforms the token is being traded

**How to use:**

```bash
curl -X POST http://your-server/api/crypto/structured-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"hours": 24}'
```

### Rugcheck Integration

For each identified token, the system can:

1. Query the Rugcheck API for risk assessment
2. Analyze specific risk factors (liquidity, code, history)
3. Calculate a normalized risk score (0-100)
4. Attach the complete report to the message

**Report Example:**

```
✅ Token Risk Report Summary:
🔹 Token Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
🔹 Token Type: Unknown

⚠️ Risk Factors:
 - Copycat token: This token is using a verified tokens symbol
 (Score: 2000, Level: warn)

 - Low amount of LP Providers: Only a few users are providing liquidity
 (Score: 400, Level: warn)

🔹 Final Risk Score: 2401
🟩 Score Normalised: 31
```

### Telegram Forwarding

The system can send formatted messages to Telegram groups:

1. Preserves the original formatting of the Discord message
2. Adds additional context (like risk reports)
3. Offers direct links to analysis tools

**Configuration:**
- Set `TELEGRAM_TOKEN` and `TELEGRAM_CHAT_ID` in the `.env` file

### SSE (Server-Sent Events)

The system offers real-time updates via SSE:

1. Instant notifications when new messages are detected
2. Structured data ready for display
3. Persistent connection for real-time updates

**How to connect:**

**HTML/JavaScript**:
```javascript
const eventSource = new EventSource('/sse/stream');
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('New message received:', data);
  // Process to update the UI
};
```

**cURL**:
```bash
curl -N -H "Accept: text/event-stream" -H "Authorization: Bearer your_jwt_token" http://your-server/sse/stream
```

---

## Usage Guide

### Web Interface

The application includes a simple web interface to interact with the system:

1. **Main Page**: Manual message extraction
   - URL: `http://your-server/`
   - Features:
     - Message extraction by channel ID and period
     - Download results in text format
     - Authentication via token

2. **SSE Page**: Real-time visualization
   - URL: `http://your-server/SSE.html`
   - Features:
     - Real-time stream of new messages
     - Automatic formatting of MULTI BUY messages

### API Queries

To integrate with other applications, use the API endpoints:

1. **Authentication**: All endpoints require authentication via JWT token
   - Add the header `Authorization: Bearer your_jwt_token`

2. **Common query examples**:

   - **Fetch messages from the last 24 hours**:
     ```bash
     curl -X POST http://your-server/api/retrieve-messages \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer your_jwt_token" \
       -d '{"hours": 24}'
     ```

   - **Fetch token statistics**:
     ```bash
     curl -X GET http://your-server/api/crypto/token-stats?hours=24 \
       -H "Authorization: Bearer your_jwt_token"
     ```

   - **Fetch tokens with highest volume**:
     ```bash
     curl -X GET "http://your-server/api/crypto/top-tokens?metric=totalSol&hours=24&limit=10" \
       -H "Authorization: Bearer your_jwt_token"
     ```

   - **Fetch specific token**:
     ```bash
     curl -X GET "http://your-server/api/crypto/search?query=COIN1&hours=24" \
       -H "Authorization: Bearer your_jwt_token"
     ```

### Real-Time with SSE

To receive real-time updates:

1. **Connect to SSE endpoint**:
   ```javascript
   // In JavaScript
   const eventSource = new EventSource('/sse/stream');
   eventSource.onmessage = function(event) {
     const messages = JSON.parse(event.data);
     messages.forEach(message => {
       // Process each message
       console.log(`New message from ${message.author.username}`);
     });
   };
   ```

2. **Handle disconnections**:
   ```javascript
   eventSource.onerror = function(error) {
     console.error('SSE connection error:', error);
     eventSource.close();
     // Reconnect after a while
     setTimeout(() => {
       // Reconnection logic
     }, 5000);
   };
   ```

---

## Data Structure

### Message Model

Messages are stored in MongoDB with the following structure:

```javascript
{
  id: "message_id",              // Unique message ID
  username: "Author Name",       // Message author's name
  channelId: "channel_id",       // Source channel
  description: "Raw content",    // Original message content
  createdAt: Date,               // Creation date
  messageType: "MULTI_BUY",      // Message type (MULTI_BUY, TOKEN_ALERT, OTHER)
  
  // Structured data (for MULTI_BUY messages)
  tokenSymbol: "COIN1",          // Token symbol
  tokenId: "token_address",      // Token address/ID
  totalSol: 53.23,               // Total volume in SOL
  walletsCount: 5,               // Number of wallets
  timeframe: "0.5 hours",        // Time period mentioned
  marketCap: "$787.40K",         // Market cap mentioned
  
  // Detailed transactions
  transactions: [
    {
      walletName: "pinyo.sol",   // Wallet name
      txTime: "0s",              // Transaction time
      amount: 9.90,              // Value in SOL
      marketCap: "$787.40K",     // Market cap at the time
      totalBuy: 9.90,            // Wallet's total buy
      holdingPercentage: 100     // Percentage retained
    },
    // More transactions...
  ],
  
  // Related links
  links: {
    dexScreener: "https://...",
    // More links...
  },
  
  // Risk report (when available)
  riskReport: {
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    tokenType: "Unknown",
    risks: [
      {
        name: "Copycat token",
        description: "This token is using a verified tokens symbol",
        score: 2000,
        level: "warn"
      }
      // More risks...
    ],
    finalScore: 2401,
    normalizedScore: 31
  }
}
```

### Token Data

Token statistics are generated with the following structure:

```javascript
{
  symbol: "COIN1",
  id: "token_address",
  marketCap: "$787.40K",
  totalSol: 53.23,
  mentions: 1,
  uniqueWallets: 5,
  riskScore: 31,
  platforms: ["BullX", "NEO", "AXIOM", "Trojan", "Nova"]
}
```

### Risk Report

Risk reports follow this structure:

```javascript
{
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  tokenType: "Unknown",
  risks: [
    {
      name: "Copycat token",
      description: "This token is using a verified tokens symbol",
      score: 2000,
      level: "warn"
    }
    // More risks...
  ],
  finalScore: 2401,
  normalizedScore: 31
}
```

---

## Workflows

### MULTI BUY Message Processing

When a MULTI BUY message is detected:

1. **Extraction and Parsing**:
   - The system identifies the "MULTI BUY" pattern in the text
   - The `tokenParser.js` extracts structured data from the text
   - Information like token, wallets, and volumes are extracted

2. **Enrichment**:
   - The system checks if the token is already known
   - If risk information doesn't exist, it queries Rugcheck
   - Attaches the risk report to the data

3. **Storage**:
   - The original message and structured data are saved in MongoDB
   - Aggregated statistics are updated

4. **Distribution**:
   - The formatted message is sent to Telegram
   - SSE notifications are sent to connected clients
   - The message is made available via API

### Token Risk Analysis

When a new token is identified:

1. **Detection**: The system extracts the token ID from the message
2. **Query**: The system queries the Rugcheck API to get information
3. **Analysis**: Risk factors are analyzed and scored
4. **Classification**: A normalized score is calculated (0-100)
5. **Storage**: The report is stored with the message

---

## Troubleshooting

### Common Problems and Solutions

1. **Messages are not being extracted**:
   - Check if the channel ID is correct
   - Confirm if the Discord token has sufficient permissions
   - Check server logs for API errors

2. **Risk reports are not being obtained**:
   - Check the connection to the Rugcheck API
   - Confirm if `RUGCHECK_API_URL` and `RUGCHECK_TOKEN_ID` are properly configured
   - Check if the token being analyzed is valid

3. **Messages are not being sent to Telegram**:
   - Confirm if `TELEGRAM_TOKEN` and `TELEGRAM_CHAT_ID` are correct
   - Check if the bot has permission to send messages in the group
   - Check the logs for specific Telegram API errors

4. **SSE is not sending updates**:
   - Check if the client is properly connected
   - Confirm if authentication is being done
   - Check if messages are being processed

---

## Best Practices

1. **Monitoring**:
   - Configure alerts for failures in message extraction
   - Monitor API usage (rate limits)
   - Track database growth

2. **Backup**:
   - Regularly backup the MongoDB database
   - Periodically export processed data

3. **Security**:
   - Keep API keys secure
   - Use HTTPS for all connections
   - Implement rate limiting for API endpoints

4. **Performance**:
   - Use caching for frequent queries
   - Consider MongoDB indexes for common queries
   - Implement pagination for large result sets

---

## System Extension

Stratus Relayer can be extended in the following ways:

1. **Support for more message types**:
   - Implement parsers for other message formats
   - Add new types of structured data

2. **Additional integrations**:
   - Connect to other data sources (Twitter, Reddit)
   - Integrate with other token analysis tools

3. **Advanced features**:
   - Implement sentiment analysis
   - Add machine learning for pattern detection
   - Develop visualizations and dashboards

4. **Custom alerts**:
   - Add rule-based alert system
   - Implement push notifications for specific events

---

This document will be updated as the system evolves. For additional information, refer to the source code and comments in the repository.