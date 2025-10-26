# 🚀 Stratus Relayer - Advanced Discord Analytics & Token Intelligence Platform

**Stratus Relayer** is a comprehensive **Node.js** application that extracts, analyzes, and relays cryptocurrency token information from Discord channels. The platform features real-time WebSocket streaming, AI-powered sentiment analysis via LunarCrush API, queue-based processing with RabbitMQ, and automated Telegram notifications.

---

## 📋 Table of Contents

1. [🌟 Overview](#-overview)
2. [✨ Key Features](#-key-features)
3. [🏗️ Architecture](#%EF%B8%8F-architecture)
4. [📌 Requirements](#-requirements)
5. [� Installation Guide](#-installation-guide)
   - [Ubuntu VPS Setup](#ubuntu-vps-setup)
   - [Install Dependencies](#install-dependencies)
   - [Install RabbitMQ](#install-rabbitmq)
6. [⚙️ Configuration](#%EF%B8%8F-configuration)
   - [Environment Variables](#environment-variables)
   - [Discord Bot Setup](#discord-bot-setup)
   - [Telegram Bot Setup](#telegram-bot-setup)
7. [� Deployment](#-deployment)
   - [Using PM2](#using-pm2)
   - [Firewall Configuration](#firewall-configuration)
8. [📡 API Documentation](#-api-documentation)
   - [REST Endpoints](#rest-endpoints)
   - [WebSocket Events](#websocket-events)
9. [🧠 Narrative & Sentiment Analysis](#-narrative--sentiment-analysis)
10. [� Queue Management (RabbitMQ)](#-queue-management-rabbitmq)
11. [� Keep-Alive System](#-keep-alive-system)
12. [📂 Project Structure](#-project-structure)
13. [�️ Technologies & Services](#%EF%B8%8F-technologies--services)
14. [📚 Additional Documentation](#-additional-documentation)
15. [� Useful Links](#-useful-links)
16. [📜 License](#-license)

---

## 🌟 Overview

**Stratus Relayer** is an advanced cryptocurrency intelligence platform that monitors Discord channels for token mentions, performs comprehensive sentiment analysis using AI, tracks wallet performance, and provides real-time data streaming via WebSocket connections.

### What Makes Stratus Relayer Unique?

- **🤖 AI-Powered Analysis**: Integration with LunarCrush API v4 for comprehensive token sentiment analysis
- **⚡ Real-Time Processing**: WebSocket streaming with Socket.IO for instant updates
- **🔄 Queue-Based Architecture**: RabbitMQ integration ensures reliable processing and respects API rate limits
- **🔥 Zero Cold Start**: Keep-alive system maintains server warmth for instant responses
- **📊 Advanced Analytics**: Wallet performance tracking, channel statistics, and social metrics aggregation
- **🔐 Enterprise-Ready**: JWT authentication, Swagger documentation, comprehensive error handling

---

## ✨ Key Features

### Core Functionality
- ✅ **Discord Message Extraction**: Automated extraction from multiple channels with configurable intervals
- ✅ **Token Call Detection**: Intelligent parsing of token addresses and symbols from Discord messages
- ✅ **Rugcheck Integration**: Automated security analysis of Solana tokens
- ✅ **Telegram Notifications**: Real-time alerts with formatted reports

### Advanced Analytics
- ✅ **LunarCrush AI Reports**: Narrative and sentiment analysis powered by LunarCrush API v4
- ✅ **Social Metrics Tracking**: Interactions, posts, contributors, engagement scores
- ✅ **Trending Detection**: Identifies trending tokens across social platforms
- ✅ **Top Creators & Posts**: Aggregates most influential contributors and content
- ✅ **Time Series Data**: Historical sentiment and engagement tracking
- ✅ **Platform-Specific Sentiment**: Twitter, Reddit, YouTube, Telegram breakdown

### Performance & Reliability
- ✅ **RabbitMQ Queue System**: Rate-limited processing (2 tokens/min) with retry mechanism
- ✅ **Dead Letter Queue**: Failed message handling and reprocessing
- ✅ **Keep-Alive Service**: Eliminates cold start, maintains persistent WebSocket connections
- ✅ **Health Monitoring**: Automated health checks with uptime tracking
- ✅ **Auto-Reconnection**: Resilient MongoDB and RabbitMQ connection management

### Real-Time & WebSocket
- ✅ **Socket.IO Integration**: Bi-directional real-time communication
- ✅ **Crypto Price Streaming**: Live price updates for tracked tokens
- ✅ **Channel Statistics**: Real-time wallet rankings and performance metrics
- ✅ **Server-Sent Events (SSE)**: Alternative streaming option for one-way updates
- ✅ **Heartbeat System**: Connection health monitoring

### Developer Experience
- ✅ **Swagger/OpenAPI**: Interactive API documentation at `/api-docs`
- ✅ **AsyncAPI Documentation**: WebSocket event schemas and flows
- ✅ **JWT Authentication**: Secure API access with token-based auth
- ✅ **Comprehensive Logging**: Structured logs with PM2 integration
- ✅ **Modular Architecture**: Clean separation of concerns, easy to extend

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Discord Bot    │ ──► Extracts Messages
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Message Queue  │◄────│  RabbitMQ    │
│  (2 tokens/min) │     │  Consumer    │
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  LunarCrush API │────►│  Sentiment   │
│  Rugcheck API   │     │  Analysis    │
└─────────────────┘     └──────┬───────┘
                               │
         ┌─────────────────────┼─────────────────┐
         ▼                     ▼                 ▼
┌─────────────────┐   ┌─────────────┐   ┌─────────────┐
│   MongoDB       │   │  Socket.IO  │   │  Telegram   │
│   Storage       │   │  WebSocket  │   │  Bot API    │
└─────────────────┘   └─────────────┘   └─────────────┘
```

### Data Flow

1. **Discord → Message Service**: Bot extracts messages via Discord.js
2. **Message → Queue**: Token calls enqueued in RabbitMQ (priority-based)
3. **Queue → Consumer**: Rate-limited consumer processes 2 tokens/min
4. **Consumer → APIs**: Fetches data from LunarCrush, Rugcheck
5. **APIs → MongoDB**: Stores TokenNarrative, SentimentAnalysis documents
6. **MongoDB → WebSocket**: Real-time broadcasts to connected clients
7. **MongoDB → Telegram**: Formatted notifications sent to channels

---

## 📌 Requirements

### System Requirements
- **OS**: Ubuntu 20.04+ (or compatible Linux distribution)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB+ available space
- **Network**: Open ports 80/443, 8081, 5672, 15672

### Software Requirements
- **Node.js**: v18.x or higher
- **MongoDB**: v4.4+ (Atlas or local installation)
- **RabbitMQ**: v3.12+ (for queue management)
- **PM2**: v5.x (for process management)
- **Git**: v2.x+

### API Credentials
- **Discord Bot Token** ([Discord Developer Portal](https://discord.com/developers/applications))
- **Telegram Bot Token** ([BotFather](https://t.me/BotFather))
- **LunarCrush API Key** ([LunarCrush](https://lunarcrush.com/))
- **Rugcheck Access** (Optional, for Solana token analysis)

---

## 🔧 Installation Guide

### Ubuntu VPS Setup

1. **Connect to VPS:**
   ```bash
   ssh user@your-vps-ip
   ```

2. **Update System:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   node -v && npm -v
   ```

4. **Install MongoDB:**

   **Option A: Local Installation**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt update
   sudo apt install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

   **Option B: MongoDB Atlas** (Recommended)
   - Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Whitelist your VPS IP
   - Get connection string (format: `mongodb+srv://user:pass@cluster.mongodb.net/db`)

5. **Install Git:**
   ```bash
   sudo apt install -y git
   ```

### Install Dependencies

1. **Clone Repository:**
   ```bash
   cd /opt
   sudo git clone https://github.com/MindGainsLabs/Stratus_Relayer.git
   cd stratus-relayer
   ```

2. **Install Node Modules:**
   ```bash
   npm install
   ```

3. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

### Install RabbitMQ

1. **Install RabbitMQ Server:**
   ```bash
   sudo apt install -y rabbitmq-server
   sudo systemctl start rabbitmq-server
   sudo systemctl enable rabbitmq-server
   ```

2. **Enable Management Plugin:**
   ```bash
   sudo rabbitmq-plugins enable rabbitmq_management
   ```

3. **Create Admin User:**
   ```bash
   sudo rabbitmqctl add_user admin your_strong_password
   sudo rabbitmqctl set_user_tags admin administrator
   sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
   ```

4. **Access Management UI:**
   - URL: `http://your-vps-ip:15672`
   - Login: `admin` / `your_strong_password`

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in project root:

```bash
nano .env
```

**Complete `.env` Template:**

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/stratusMessages

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token_here
CHANNEL_ID_1=1234567890123456789
CHANNEL_ID_2=1234567890123456790
CHANNEL_ID_3=1234567890123456791
CHANNEL_ID_4=1234567890123456792

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=-1001234567890

# Server Configuration
PORT=8081
SERVER_URL=http://localhost:8081
NODE_ENV=production

# LunarCrush API
LUNARCRUSH_API_KEY=your_lunarcrush_api_key_here

# RabbitMQ
RABBITMQ_URL=amqp://admin:your_strong_password@localhost:5672

# Rugcheck API (Optional)
RUGCHECK_API_URL=https://api.rugcheck.xyz
RUGCHECK_TOKEN_ID=your_public_key
RUGCHECK_SECRET_KEY=your_private_key

# Cron Job Configuration
CRON_SCHEDULE=*/2 * * * * *
CRON_HOURS=6
WALLET_RANK_CRON=0 */5 * * * *
CHANNEL_CALL_ETL_CRON=30 */2 * * * *

# Socket.IO
SOCKET_IO_PATH=/relayer/socket.io
EXTRA_SOCKET_ORIGINS=https://your-domain.com

# Keep-Alive Service
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_INTERVAL=240000
HEALTH_CHECK_INTERVAL=120000
```

### Discord Bot Setup

1. **Create Application:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click **"New Application"**
   - Name your bot

2. **Create Bot User:**
   - Navigate to **"Bot"** section
   - Click **"Add Bot"**
   - Copy **Bot Token** → Use as `DISCORD_BOT_TOKEN`

3. **Configure Intents:**
   - Enable **"Server Members Intent"**
   - Enable **"Message Content Intent"**
   - Enable **"Presence Intent"**

4. **Invite Bot:**
   - Go to **"OAuth2"** → **"URL Generator"**
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Read Messages`, `Send Messages`, `Read Message History`
   - Copy generated URL and open in browser

5. **Get Channel IDs:**
   - Enable Developer Mode: Settings → Advanced → Developer Mode
   - Right-click channel → Copy ID → Use as `CHANNEL_ID_X`

### Telegram Bot Setup

1. **Create Bot:**
   - Open Telegram, search [@BotFather](https://t.me/BotFather)
   - Send `/newbot` command
   - Follow instructions
   - Copy **API Token** → Use as `TELEGRAM_BOT_TOKEN`

2. **Get Chat ID:**
   - Start conversation with your bot
   - Send any message
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find `"chat":{"id":-1001234567890}` → Use as `TELEGRAM_CHAT_ID`

---

## 🚀 Deployment

---

## 🚀 Deployment

### Using PM2

**PM2** is a production-grade process manager for Node.js with built-in load balancer, automatic restarts, and monitoring.

1. **Start Application:**
   ```bash
   cd /opt/stratus-relayer
   pm2 start src/server.js --name "Stratus-Relayer"
   ```

2. **Configure Auto-Start:**
   ```bash
   pm2 startup systemd
   pm2 save
   ```

3. **Useful PM2 Commands:**
   ```bash
   pm2 status                    # Check status
   pm2 logs Stratus-Relayer      # View logs
   pm2 restart Stratus-Relayer   # Restart app
   pm2 stop Stratus-Relayer      # Stop app
   pm2 delete Stratus-Relayer    # Remove from PM2
   pm2 monit                     # Real-time monitoring
   ```

4. **View Detailed Logs:**
   ```bash
   pm2 logs Stratus-Relayer --lines 100
   pm2 logs Stratus-Relayer --err    # Error logs only
   ```

### Firewall Configuration

1. **Configure UFW (Ubuntu Firewall):**
   ```bash
   sudo ufw allow 8081/tcp comment 'Stratus Relayer API'
   sudo ufw allow 15672/tcp comment 'RabbitMQ Management UI'
   sudo ufw allow 22/tcp comment 'SSH'
   sudo ufw enable
   sudo ufw status
   ```

2. **Optional: Nginx Reverse Proxy**

   ```nginx
   # /etc/nginx/sites-available/stratus-relayer
   server {
       listen 80;
       server_name your-domain.com;

       location /relayer {
           proxy_pass http://localhost:8081;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /relayer/socket.io {
           proxy_pass http://localhost:8081/relayer/socket.io;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

   **Enable Site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/stratus-relayer /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Verify Deployment

1. **Check Services:**
   ```bash
   pm2 status
   sudo systemctl status rabbitmq-server
   sudo systemctl status mongod  # If local MongoDB
   ```

2. **Test API:**
   ```bash
   curl http://localhost:8081/api/health
   ```

   **Expected Response:**
   ```json
   {
     "status": "ok",
     "timestamp": "2025-10-25T10:30:00.000Z",
     "uptime": 7200,
     "memory": { "heapUsed": 120, "heapTotal": 256, "rss": 512 },
     "nodeVersion": "v18.16.0",
     "pid": 12345
   }
   ```

3. **Test WebSocket:**
   ```bash
   # Install wscat
   npm install -g wscat
   
   # Connect to WebSocket
   wscat -c "ws://localhost:8081/relayer/socket.io/?EIO=4&transport=websocket"
   ```

---

## 📡 API Documentation

### REST Endpoints

#### **Authentication**
All authenticated endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

#### **Core Endpoints**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Server health check | ❌ |
| `GET` | `/api-docs` | Swagger UI documentation | ❌ |
| `GET` | `/api/discord/channels` | List configured channels | ✅ |
| `GET` | `/api/discord/messages/:channelId` | Get messages from channel | ✅ |
| `POST` | `/api/crypto/track` | Start tracking token | ✅ |
| `GET` | `/api/crypto/tracked` | List tracked tokens | ✅ |

#### **Narrative & Sentiment Analysis**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/narrative/analyze/:tokenSymbol` | Trigger narrative analysis | ✅ |
| `GET` | `/api/narrative/:narrativeId` | Get narrative details | ✅ |
| `GET` | `/api/narrative/token/:tokenAddress` | Get token narratives | ✅ |
| `GET` | `/api/narrative/list` | List all narratives | ✅ |
| `PUT` | `/api/narrative/:narrativeId` | Update narrative | ✅ |

#### **Queue Management (RabbitMQ)**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/queue/stats` | Queue statistics | ✅ |
| `POST` | `/api/queue/reprocess-dlq` | Reprocess failed messages | ✅ |
| `POST` | `/api/queue/purge` | Clear queue (dangerous!) | ✅ |

#### **Channel Statistics**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/channel-stats/:channelId` | Channel statistics | ✅ |
| `GET` | `/api/wallet-performance/:channelId/:walletAddress` | Wallet performance | ✅ |
| `GET` | `/api/wallet-ranking/:channelId` | Wallet leaderboard | ✅ |

### WebSocket Events

**Client → Server Events:**

```javascript
// Connect to WebSocket
const socket = io('http://localhost:8081', {
  path: '/relayer/socket.io'
});

// Subscribe to crypto updates
socket.emit('subscribe_crypto', { symbols: ['BTC', 'ETH', 'SOL'] });

// Subscribe to channel stats
socket.emit('subscribe_channel', { channelId: '1234567890' });
```

**Server → Client Events:**

| Event | Description | Payload |
|-------|-------------|---------|
| `server:heartbeat` | Server health ping | `{ timestamp, activeConnections }` |
| `server:health` | Health status broadcast | `{ status, uptime, memory, connections }` |
| `crypto:price_update` | Real-time price update | `{ symbol, price, change24h, volume }` |
| `crypto:new_token` | New token detected | `{ tokenAddress, symbol, name, channelId }` |
| `channel:stats_update` | Channel statistics | `{ channelId, messageCount, walletCount }` |
| `narrative:analysis_complete` | Narrative analysis done | `{ narrativeId, tokenSymbol, sentiment }` |

**Example Client:**

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8081', {
  path: '/relayer/socket.io',
  transports: ['websocket'],
  reconnection: true
});

socket.on('connect', () => {
  console.log('Connected to Stratus Relayer');
  socket.emit('subscribe_crypto', { symbols: ['SOL', 'BTC'] });
});

socket.on('crypto:price_update', (data) => {
  console.log('Price Update:', data);
});

socket.on('narrative:analysis_complete', (data) => {
  console.log('Analysis Complete:', data.tokenSymbol, data.sentiment);
});
```

---

## 🧠 Narrative & Sentiment Analysis

### Overview

The **Narrative & Sentiment Analysis** system integrates with **LunarCrush API v4** to provide comprehensive token intelligence.

### How It Works

1. **Token Detection**: Discord bot detects token mentions
2. **Queue Enqueue**: Token added to RabbitMQ queue with priority
3. **Rate-Limited Processing**: Consumer processes 2 tokens/min (10 API req/min)
4. **Data Aggregation**: Fetches from 5 LunarCrush endpoints:
   - `/topic/:symbol` - Core metrics
   - `/time-series/:symbol` - Historical data
   - `/posts/:symbol` - Social posts
   - `/news/:symbol` - News articles
   - `/creators/:symbol` - Influencers
5. **AI Report Generation**: Optional AI-generated narrative
6. **MongoDB Storage**: Saves `TokenNarrative` and `SentimentAnalysis`
7. **Real-Time Broadcast**: WebSocket notification to clients

### Data Collected

**Social Metrics:**
- Total interactions (24h)
- Post count
- Contributors
- Engagement score
- Social dominance per platform

**Sentiment Analysis:**
- Overall sentiment score (0-100)
- Platform-specific sentiment (Twitter, Reddit, YouTube, Telegram)
- Sentiment classification (very_positive, positive, neutral, negative, very_negative)
- Sentiment breakdown by source

**Trending Status:**
- Trending rank
- Galaxy score
- Alt rank
- Topic rank

**Top Content:**
- Top 10 posts (text, engagement, author, platform)
- Top 10 creators (name, followers, influence score)
- Top 5 news articles (title, source, URL)
- Keywords & hashtags

**Time Series:**
- Historical sentiment
- Interaction trends
- Post volume over time

### API Example

**Trigger Analysis:**
```bash
curl -X POST http://localhost:8081/api/narrative/analyze/SOL \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callContext": {
      "channelId": "1234567890",
      "messageId": "9876543210",
      "tokenAddress": "So11111111111111111111111111111111111111112"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token analysis queued successfully",
  "narrative": {
    "_id": "67123abc...",
    "tokenSymbol": "SOL",
    "tokenAddress": "So11111111111111111111111111111111111111112",
    "analysisStatus": "queued",
    "queuePriority": 7,
    "createdAt": "2025-10-25T10:30:00.000Z"
  }
}
```

**Get Results:**
```bash
curl http://localhost:8081/api/narrative/token/So11111111111111111111111111111111111111112 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Configuration

**Rate Limiting:**
- LunarCrush API: 10 req/min limit
- Processing rate: 2 tokens/min (5 endpoints × 2 tokens = 10 req/min)
- Interval between tokens: 30 seconds

**Retry Logic:**
- Max retries: 3
- Retry delay: Progressive (30s, 60s, 120s)
- Failed messages → Dead Letter Queue

**Fallback Mechanism:**
- If RabbitMQ unavailable → Direct processing
- Symbol not found → Try token address
- Missing data → Graceful degradation

For detailed documentation, see: [`docs/NARRATIVE_SENTIMENT_SYSTEM.md`](docs/NARRATIVE_SENTIMENT_SYSTEM.md)

---

## 📊 Queue Management (RabbitMQ)

### Overview

RabbitMQ handles asynchronous processing of token analysis requests, ensuring rate limits are respected and no data is lost.

### Queue Architecture

```
┌──────────────────────┐
│  Main Queue          │
│  narrative_analysis  │ ──► Consumer (2 tokens/min)
└──────────┬───────────┘
           │ Failed (3x retries)
           ▼
┌──────────────────────┐
│  Dead Letter Queue   │
│  narrative_dlq       │ ──► Manual reprocessing
└──────────────────────┘
```

### Queue Features

- **Durable Queues**: Survives RabbitMQ restarts
- **Persistent Messages**: Messages survive server crashes
- **Priority System**: New tokens (priority 7) > Updates (priority 5)
- **Manual ACK**: Explicit acknowledgment ensures no loss
- **Prefetch Limit**: Processes 1 message at a time
- **TTL on DLQ**: Messages expire after 24h

### Queue Statistics

**Get Stats:**
```bash
curl http://localhost:8081/api/queue/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "mainQueue": {
    "name": "narrative_analysis_queue",
    "messageCount": 15,
    "consumerCount": 1
  },
  "deadLetterQueue": {
    "name": "narrative_analysis_dlq",
    "messageCount": 3
  },
  "status": "connected"
}
```

### Reprocess Failed Messages

```bash
curl -X POST http://localhost:8081/api/queue/reprocess-dlq \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "limit": 10 }'
```

### RabbitMQ Management UI

Access at: `http://your-vps-ip:15672`

**Default Credentials:**
- Username: `admin`
- Password: (set during installation)

**Features:**
- View queue depths
- Monitor message rates
- Inspect message contents
- Purge queues
- Monitor consumer health

For detailed documentation, see: [`docs/RABBITMQ_QUEUE_SYSTEM.md`](docs/RABBITMQ_QUEUE_SYSTEM.md)

---

## 🔥 Keep-Alive System

### Problem Solved

**Before Keep-Alive:**
- ❌ First user waits 5-10s for response (cold start)
- ❌ WebSocket connections drop after inactivity
- ❌ Server enters "sleep" mode

**After Keep-Alive:**
- ✅ Instant responses (< 100ms)
- ✅ Persistent WebSocket connections
- ✅ Zero cold start

### How It Works

1. **Socket.IO Ping**: Automatic ping every 25s
2. **Heartbeat Broadcast**: Server broadcasts to all clients every 30s
3. **Health Checks**: Automated checks every 2 minutes
4. **Endpoint Warmup**: Internal ping to critical endpoints every 4 minutes

### Features

- **Auto-Reconnection**: Handles connection drops gracefully
- **Health Monitoring**: Tracks uptime, memory, active connections
- **Warmup Endpoints**: Keeps `/api/health`, `/api/discord/channels`, `/api/queue/stats` warm
- **Smart Logging**: Filters keep-alive requests from logs

### Configuration

```env
# .env
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_INTERVAL=240000      # 4 minutes
HEALTH_CHECK_INTERVAL=120000    # 2 minutes
SERVER_URL=http://localhost:8081
```

### Health Check Endpoint

```bash
curl http://localhost:8081/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T10:30:00.000Z",
  "uptime": 7200,
  "memory": {
    "heapUsed": 120,
    "heapTotal": 256,
    "rss": 512
  },
  "nodeVersion": "v18.16.0",
  "pid": 12345
}
```

For detailed documentation, see: [`docs/KEEP_ALIVE_SERVICE.md`](docs/KEEP_ALIVE_SERVICE.md)

---

## 📂 Project Structure

```
/stratus-relayer
├── asyncapi.yaml              # AsyncAPI WebSocket documentation
├── package.json
├── .env
├── .gitignore
├── collections/               # Postman API collections
│   ├── stratus_relayer_api_collection.json
│   └── stratus_relayer_websocket_collection.json
├── docs/                      # Comprehensive documentation
│   ├── KEEP_ALIVE_SERVICE.md
│   ├── RABBITMQ_QUEUE_SYSTEM.md
│   ├── NARRATIVE_SENTIMENT_SYSTEM.md
│   ├── WEBSOCKET_DOCUMENTATION_SUMMARY.md
│   ├── WSS_SETUP.md
│   ├── ASYNCAPI_GUIDE.md
│   └── CHANNEL_STATS.md
├── examples/                  # Example client implementations
│   └── websocket-client.js
├── public/                    # Static assets
│   ├── index.html
│   ├── css/
│   └── js/
├── scripts/                   # Utility scripts
│   ├── generate-asyncapi-docs.sh
│   └── validate-collections.sh
├── src/
│   ├── server.js             # Server entry point
│   ├── index.js              # Application initialization
│   ├── swagger.js            # Swagger/OpenAPI configuration
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── cryptoTrackingController.js
│   │   ├── messageController.js
│   │   └── narrativeController.js
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── models/
│   │   ├── ApiToken.js
│   │   ├── ChannelCall.js
│   │   ├── Message.js
│   │   ├── SentimentAnalysis.js
│   │   ├── TokenNarrative.js
│   │   └── WalletPerformance.js
│   ├── routes/
│   │   ├── asyncApiRoutes.js
│   │   ├── channelStatsRoutes.js
│   │   ├── cryptoTrackingRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── narrativeRoutes.js
│   │   ├── queueRoutes.js
│   │   ├── sseRoutes.js
│   │   ├── websocketRoutes.js
│   │   └── websocketDocumentationRoutes.js
│   ├── services/
│   │   ├── callExtractionService.js
│   │   ├── channelStatsService.js
│   │   ├── cryptoTrackingService.js
│   │   ├── cryptoWebSocketService.js
│   │   ├── keepAliveService.js       # ⭐ NEW
│   │   ├── lunarCrushService.js      # ⭐ NEW
│   │   ├── messageService.js
│   │   ├── narrativeConsumer.js      # ⭐ NEW
│   │   ├── narrativeService.js       # ⭐ NEW
│   │   ├── priceQuoteService.js
│   │   ├── priceUpdateService.js
│   │   ├── queueService.js           # ⭐ NEW
│   │   ├── rugcheckService.js
│   │   └── telegramService.js
│   └── utils/
│       └── formatter.js
└── tests/
    ├── package.json
    └── websocket.test.js
```

---

## 🛠️ Technologies & Services

### Backend Framework
- **Node.js** v18+ - JavaScript runtime
- **Express.js** v4.21+ - Web framework
- **Socket.IO** v4.8+ - Real-time bi-directional communication

### Database & Storage
- **MongoDB** v6+ - NoSQL database via Mongoose ODM
- **MongoDB Atlas** - Cloud-hosted MongoDB (recommended)

### Message Queue
- **RabbitMQ** v3.12+ - AMQP message broker
- **amqplib** v0.10+ - RabbitMQ client for Node.js

### External APIs
- **Discord API** (discord.js v14) - Discord bot integration
- **LunarCrush API v4** - Crypto sentiment & social analytics
- **Telegram Bot API** (node-telegram-bot-api) - Notification delivery
- **Rugcheck API** - Solana token security analysis

### Authentication & Security
- **JWT** (jsonwebtoken) - Token-based authentication
- **CORS** - Cross-origin resource sharing
- **request-ip** - IP address extraction
- **geoip-lite** - Geolocation lookup

### Documentation
- **Swagger/OpenAPI** (swagger-jsdoc, swagger-ui-express)
- **AsyncAPI** - WebSocket event documentation

### Process Management
- **PM2** - Production process manager
- **node-cron** - Scheduled task execution

### Utilities
- **axios** - HTTP client
- **dotenv** - Environment variable management
- **tweetnacl** - Cryptography library
- **crypto** - Native Node.js cryptography

---

## 📚 Additional Documentation

### Core Documentation
- **[README.md](README.md)** - Main project documentation (this file)
- **[IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)** - Full implementation details

### Feature-Specific Guides
- **[NARRATIVE_SENTIMENT_SYSTEM.md](docs/NARRATIVE_SENTIMENT_SYSTEM.md)** - Comprehensive guide to narrative & sentiment analysis
- **[NARRATIVE_QUICKSTART.md](docs/NARRATIVE_QUICKSTART.md)** - Quick start guide for narrative system
- **[RABBITMQ_QUEUE_SYSTEM.md](docs/RABBITMQ_QUEUE_SYSTEM.md)** - Queue management and rate limiting
- **[KEEP_ALIVE_SERVICE.md](docs/KEEP_ALIVE_SERVICE.md)** - Cold start elimination system
- **[CHANNEL_STATS.md](docs/CHANNEL_STATS.md)** - Wallet performance and channel analytics

### WebSocket Documentation
- **[WEBSOCKET_DOCUMENTATION_SUMMARY.md](docs/WEBSOCKET_DOCUMENTATION_SUMMARY.md)** - WebSocket overview
- **[WEBSOCKET_PATHS.md](docs/WEBSOCKET_PATHS.md)** - WebSocket path configurations
- **[WSS_SETUP.md](docs/WSS_SETUP.md)** - Secure WebSocket (WSS) setup guide
- **[ASYNCAPI_GUIDE.md](docs/ASYNCAPI_GUIDE.md)** - AsyncAPI documentation guide

### Deployment & Configuration
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Workspace-config-macos.md](docs/Workspace-config-macos.md)** - macOS development setup

### API Documentation
- **Swagger UI**: Available at `http://your-server:8081/api-docs`
- **AsyncAPI Docs**: Available at `http://your-server:8081/docs/websocket`
- **Postman Collections**: See `/collections` directory

---

## 🔗 Useful Links

### Official Documentation
- **[Node.js](https://nodejs.org/)** - Official Node.js documentation
- **[Express.js](https://expressjs.com/)** - Express framework docs
- **[Socket.IO](https://socket.io/)** - Real-time engine docs
- **[MongoDB](https://www.mongodb.com/docs/)** - MongoDB documentation
- **[Mongoose](https://mongoosejs.com/)** - MongoDB ODM
- **[RabbitMQ](https://www.rabbitmq.com/documentation.html)** - Message queue docs
- **[PM2](https://pm2.keymetrics.io/)** - Process manager docs

### API References
- **[Discord.js Guide](https://discordjs.guide/)** - Discord bot development
- **[Discord Developer Portal](https://discord.com/developers/docs/)** - Official Discord API
- **[LunarCrush API](https://lunarcrush.com/developers/docs)** - Crypto sentiment API
- **[Telegram Bot API](https://core.telegram.org/bots/api)** - Telegram bot reference
- **[Rugcheck API](https://api.rugcheck.xyz/docs)** - Solana token security

### Development Tools
- **[Swagger Editor](https://editor.swagger.io/)** - OpenAPI editor
- **[AsyncAPI Studio](https://studio.asyncapi.com/)** - AsyncAPI editor
- **[Postman](https://www.postman.com/)** - API testing platform

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or feature requests:

- **Open an issue**: [GitHub Issues](https://github.com/MindGainsLabs/Stratus_Relayer/issues)
- **Check documentation**: `/docs` directory
- **View logs**: `pm2 logs Stratus-Relayer`

---

## 📊 System Status

### Health Check
```bash
curl http://localhost:8081/api/health
```

### Queue Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8081/api/queue/stats
```

### PM2 Monitor
```bash
pm2 monit
```

### RabbitMQ Management
Visit: `http://your-vps-ip:15672`

---

## 👥 Authors & Contributors

### Core Development Team

<div align="center">

**Vitor Santos** - *Lead Developer & Architect*  
Full Stack Engineer | Blockchain Enthusiast | System Architecture

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Vitorhrds2)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/vitorhrds)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/vitorhrds)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hrdsvitor@gmail.com)

</div>

---

## 🌐 Connect With Us

<div align="center">

### Project Links

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/stratus-relayer)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/stratusrelayer)
[![Documentation](https://img.shields.io/badge/Documentation-4285F4?style=for-the-badge&logo=googledocs&logoColor=white)](https://docs.stratus-relayer.io)
[![Website](https://img.shields.io/badge/Website-FF6C37?style=for-the-badge&logo=rocket&logoColor=white)](https://stratus-relayer.io)

### Support & Community

[![GitHub Issues](https://img.shields.io/badge/Issues-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MindGainsLabs/Stratus_Relayer/issues)
[![GitHub Discussions](https://img.shields.io/badge/Discussions-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MindGainsLabs/Stratus_Relayer/discussions)

</div>

---

## 💪 Support This Project

If you find **Stratus Relayer** useful, please consider:

<div align="center">

[![Star on GitHub](https://img.shields.io/badge/⭐_Star_on_GitHub-181717?style=for-the-badge&logo=github)](https://github.com/MindGainsLabs/Stratus_Relayer)
[![Follow on Twitter](https://img.shields.io/badge/Follow_on_Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/vitorhrds)
[![Sponsor on GitHub](https://img.shields.io/badge/💝_Sponsor-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/MindGainsLabs)

**Share with your network:**

[![Share on Twitter](https://img.shields.io/badge/Share_on_Twitter-1DA1F2?style=flat-square&logo=twitter&logoColor=white)](https://twitter.com/intent/tweet?text=Check%20out%20Stratus%20Relayer%20-%20Advanced%20Discord%20Analytics%20%26%20Token%20Intelligence%20Platform&url=https://github.com/MindGainsLabs/Stratus_Relayer)
[![Share on LinkedIn](https://img.shields.io/badge/Share_on_LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/MindGainsLabs/Stratus_Relayer)
[![Share on Reddit](https://img.shields.io/badge/Share_on_Reddit-FF4500?style=flat-square&logo=reddit&logoColor=white)](https://reddit.com/submit?url=https://github.com/MindGainsLabs/Stratus_Relayer&title=Stratus%20Relayer%20-%20Advanced%20Token%20Intelligence)

</div>

---

## 📜 Copyright & License

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ███████╗████████╗██████╗  █████╗ ████████╗██╗   ██╗███████╗   │
│  ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██║   ██║██╔════╝   │
│  ███████╗   ██║   ██████╔╝███████║   ██║   ██║   ██║███████╗   │
│  ╚════██║   ██║   ██╔══██╗██╔══██║   ██║   ██║   ██║╚════██║   │
│  ███████║   ██║   ██║  ██║██║  ██║   ██║   ╚██████╔╝███████║   │
│  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝   │
│                                                                 │
│               R E L A Y E R   P L A T F O R M                   │
│                                                                 │
│              Advanced Token Intelligence System                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Copyright © 2024-2025 Stratus Relayer Development Team
All Rights Reserved

Licensed under the ISC License
See LICENSE file for details

Developed with 🧠 and effort by Vitor Santos
Built for the Crypto Community 🚀
```

**Version:** 2.0.0  
**Last Updated:** October 2025  
**Status:** ✅ Production Ready

</div>

---

<div align="center">

**Made with 🧠 and effort, ☕ coffee, and 💻 passion**

*Empowering crypto traders with real-time intelligence since 2024*

[![Built with Node.js](https://img.shields.io/badge/Built_with-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Powered by MongoDB](https://img.shields.io/badge/Powered_by-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![RabbitMQ](https://img.shields.io/badge/Queue-RabbitMQ-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)](https://rabbitmq.com)
[![Socket.IO](https://img.shields.io/badge/WebSocket-Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)

⭐ **Star us on GitHub** — it motivates us to keep improving!

[🐛 Report Bug](https://github.com/MindGainsLabs/Stratus_Relayer/issues/new?template=bug_report.md) · 
[✨ Request Feature](https://github.com/MindGainsLabs/Stratus_Relayer/issues/new?template=feature_request.md) · 
[📖 Documentation](https://docs.stratus-relayer.io) · 
[💬 Discussions](https://github.com/MindGainsLabs/Stratus_Relayer/discussions)

---

**🙏 Thank you for using Stratus Relayer!**

*If this project helped you, consider giving it a ⭐ star on GitHub*

[![GitHub stars](https://img.shields.io/github/stars/MindGainsLabs/Stratus_Relayer?style=social)](https://github.com/MindGainsLabs/Stratus_Relayer)
[![GitHub forks](https://img.shields.io/github/forks/MindGainsLabs/Stratus_Relayer?style=social)](https://github.com/MindGainsLabs/Stratus_Relayer/fork)
[![GitHub watchers](https://img.shields.io/github/watchers/MindGainsLabs/Stratus_Relayer?style=social)](https://github.com/MindGainsLabs/Stratus_Relayer)

</div>