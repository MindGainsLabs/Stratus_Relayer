import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';
import connectDB from './config/db.js';
import messageRoutes from './routes/messageRoutes.js';
import cryptoTrackingRoutes from './routes/cryptoTrackingRoutes.js';
import channelStatsRoutes from './routes/channelStatsRoutes.js';
import narrativeRoutes from './routes/narrativeRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import websocketDocumentationRoutes from './routes/websocketDocumentationRoutes.js';
import asyncApiRoutes from './routes/asyncApiRoutes.js';
import { retrieveMessages } from './services/messageService.js';
import { sseRoutes, sendEventsToAll } from './routes/sseRoutes.js';
import { swaggerUi, swaggerSpec } from './swagger.js';
import geoip from 'geoip-lite';
import requestIp from 'request-ip';
import axios from 'axios';
import { configureWebSocketRoutes } from './routes/websocketRoutes.js';
import { initializeCryptoWebSocket, startAutoBroadcast } from './services/cryptoWebSocketService.js';
import { getMomentumCalls } from './services/momentumCallsService.js';
import { persistWalletRanking } from './services/channelStatsService.js';
import { extractCallsFromMessages } from './services/callExtractionService.js';
import { connectRabbitMQ } from './services/queueService.js';
import { startNarrativeConsumer } from './services/narrativeConsumer.js';
import { keepAliveMiddleware } from './services/keepAliveService.js';
// import './discordBot.js';

dotenv.config();

// Conectar ao banco de dados
connectDB();

// Conectar ao RabbitMQ e iniciar consumer
connectRabbitMQ()
  .then(() => {
    console.log('[App] RabbitMQ connected successfully');
    startNarrativeConsumer();
  })
  .catch(error => {
    console.error('[App] RabbitMQ connection failed:', error.message);
    console.warn('[App] Narrative analysis will work in fallback mode (direct processing)');
  });

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(keepAliveMiddleware); // Keep-alive middleware (antes do CORS)
app.use(cors({
    origin: [
        'https://smarteye.one/relayer/',
        'https://smarteye.one/relayer/api-docs',
        'https://smarteye.one/relayer/api-docs/',
        'https://smarteye.one/relayer/sse',
        'https://smarteye.one/relayer/sse/',
        'https://smarteye.one/relayer/api',
        'https://smarteye.one/relayer/api/',
        'https://smarteye.one/relayer/api/crypto',
        'https://smarteye.one/relayer/api/crypto/',
        'http://srv800316.hstgr.cloud:8081/',
        'http://srv800316.hstgr.cloud:8081/api-docs',
        'https://srv800316.hstgr.cloud:8081/api-docs',
        'http://srv800316.hstgr.cloud:8081/relayer/api-docs/',
        'http://srv800316.hstgr.cloud:8081/sse',
        'http://srv800316.hstgr.cloud:8081/sse/',
        'http://srv800316.hstgr.cloud:8081/api',
        'http://srv800316.hstgr.cloud:8081/api/',
        'http://srv800316.hstgr.cloud:8081/api/crypto',
        'http://srv800316.hstgr.cloud:8081/api/crypto/',
        'https://mindgains-launch-pad.vercel.app/',
        'https://mindgains-launch-pad-rust.vercel.app/',
        'https://mindgains-launch-pad-rust.vercel.app',
        'http://localhost:8080'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const requestIps = [];

app.use(async (req, res, next) => {
    try {
        const response = await axios.get('https://api64.ipify.org/?format=json');
        let ip = response.data.ip;

        console.log(`IP capturado: ${ip}`);

        const geo = geoip.lookup(ip);
        if (geo) {
            console.log(`Localização: ${geo.country}, ${geo.city}, ${geo.timezone}, ${geo.ll}, ${geo.timezone}, ${geo.region}`);
            const existingEntry = requestIps.find(entry => entry.address === ip);
            if (existingEntry) {
                existingEntry.count += 1;
                // if (existingEntry.count > 100) {
                //     console.log(`IP ${ip} bloqueado por exceder o limite de acessos.`);
                //     return res.status(429).json({ message: 'Limite de acessos excedido. Tente novamente mais tarde.' });
                // }
            } else {
                requestIps.push({ address: ip, country: geo.country, count: 1 });
            }
        } else {
            console.log('Localização não encontrada para o IP:', ip);
        }
    } catch (error) {
        console.error('Erro ao obter o IP:', error);
    }
    console.log('Lista de IPs:', requestIps);
    next();
});


// Servir arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API, SSE e Swagger
app.use('/api', messageRoutes);
app.use('/api/crypto', cryptoTrackingRoutes);
app.use('/api/narrative', narrativeRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api', channelStatsRoutes);
app.use('/api/websocket', websocketDocumentationRoutes);
app.use('/docs', asyncApiRoutes);
app.use('/sse', sseRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint (keep-alive friendly)
app.get('/api/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        nodeVersion: process.version,
        pid: process.pid
    });
});

// NOTE: Removed redundant call configureWebSocketRoutes(app)
// WebSocket routes are properly initialized in server.js via initializeWebSocket(io)
// Passing the Express app here would register 'connection' on an Express EventEmitter, not the Socket.IO server.

// Agendar cron job para coletar mensagens e enviar aos clientes conectados
const collectMessages = async () => {
    const channelIds = [
        process.env.CHANNEL_ID_1,
        process.env.CHANNEL_ID_2,
        process.env.CHANNEL_ID_3,
        process.env.CHANNEL_ID_4
    ].filter(Boolean);
    const hours = parseInt(process.env.CRON_HOURS) || 6;

    if (channelIds.length === 0) {
        console.error('CHANNEL_IDS não configurados no ambiente.');
        return;
    }

    let collectedMessages = [];
    try {
        for (const channelId of channelIds) {
            const messages = await retrieveMessages(channelId, hours);
            console.log(`Coleta concluída para o canal ${channelId}. Mensagens coletadas: ${messages.length}`);
            collectedMessages = collectedMessages.concat(messages);
        }
        // Enviar as novas mensagens aos clientes via SSE
        if (collectedMessages.length > 0) {
            sendEventsToAll(collectedMessages);
        }
    } catch (error) {
        console.error('Erro no cron job:', error);
    }
};

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/2 * * * * *';
cron.schedule(CRON_SCHEDULE, () => {
    console.log('Iniciando cron job para coletar mensagens...');
    collectMessages();
});

// Cron para recalcular ranking de carteiras a cada 5 minutos
const WALLET_RANK_CRON = process.env.WALLET_RANK_CRON || '0 */5 * * * *';
cron.schedule(WALLET_RANK_CRON, async () => {
    try {
        const channelIds = (process.env.CHANNEL_ID_1,
            process.env.CHANNEL_ID_2,
            process.env.CHANNEL_ID_3,
            process.env.CHANNEL_ID_4 || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);
        console.log(`[Cron Wallet Ranking] Recalculando para canais: ${channelIds.length ? channelIds.join(', ') : 'nenhum configurado'}`);
        for (const cid of channelIds) {
            await persistWalletRanking(cid);
        }
    } catch (e) {
        console.error('[Cron Wallet Ranking] erro:', e.message);
    }
});
console.log(`Cron job wallet ranking agendado: "${WALLET_RANK_CRON}"`);

// Cron para ETL de mensagens -> ChannelCall
const CHANNEL_CALL_ETL_CRON = process.env.CHANNEL_CALL_ETL_CRON || '30 */2 * * * *';
cron.schedule(CHANNEL_CALL_ETL_CRON, async () => {
    try {
        const channelIds = (        process.env.CHANNEL_ID_1,
        process.env.CHANNEL_ID_2,
        process.env.CHANNEL_ID_3,
        process.env.CHANNEL_ID_4 || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);
        const res = await extractCallsFromMessages({ channelIds, hours: 72, limit: 2000 });
        console.log(`[Cron Call ETL] processed=${res.processed} created=${res.created}`);
    } catch (e) {
        console.error('[Cron Call ETL] erro:', e.message);
    }
});
console.log(`Cron job call ETL agendado: "${CHANNEL_CALL_ETL_CRON}"`);

console.log(`Cron job agendado com a expressão: "${CRON_SCHEDULE}"`);

// Function to initialize WebSocket when server starts
export const initializeWebSocket = (io) => {
    // Configure WebSocket routes and event handlers
    configureWebSocketRoutes(io);

    // Initialize crypto WebSocket service
    initializeCryptoWebSocket(io);

    // Start auto-broadcast every 30 seconds for connected clients
    startAutoBroadcast(30000, { hours: 24 });

    // Start momentum-calls broadcast every 5 minutes for subscribed clients
    const MOMENTUM_INTERVAL_MS = parseInt(process.env.MOMENTUM_BROADCAST_INTERVAL_MS || '300000', 10); // default 5 min
    setInterval(async () => {
        try {
            const room = io.sockets.adapter.rooms.get('momentum-calls');
            if (!room || room.size === 0) {
                return; // Nenhum cliente subscrito
            }

            console.log(`[MomentumCalls] Broadcasting to ${room.size} subscribed clients...`);
            
            // Coleta opções de filtro de cada socket (se definidas)
            // Para simplificar, broadcasta com opções padrão; se cada socket tiver filtro diferente, 
            // poderia iterar por socket e enviar individualmente
            const momentumTokens = await getMomentumCalls({ hours: 24, minGainPercent: 0 });
            
            io.to('momentum-calls').emit('momentum-calls-data', {
                message: 'Momentum calls update',
                data: momentumTokens,
                timestamp: new Date()
            });

            console.log(`[MomentumCalls] Broadcasted ${momentumTokens.length} tokens with positive momentum`);
        } catch (error) {
            console.error('[MomentumCalls] Error broadcasting:', error);
            io.to('momentum-calls').emit('momentum-calls-error', {
                message: 'Error updating momentum calls',
                error: error.message,
                timestamp: new Date()
            });
        }
    }, MOMENTUM_INTERVAL_MS);

    console.log(`Stratus Relayer - Momentum calls broadcast started (interval: ${MOMENTUM_INTERVAL_MS}ms)`);
    console.log('Stratus Relayer - WebSocket crypto tracking service initialized');
};

export { app };
