import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';
import connectDB from './config/db.js';
import messageRoutes from './routes/messageRoutes.js';
import cryptoTrackingRoutes from './routes/cryptoTrackingRoutes.js';
import { retrieveMessages } from './services/messageService.js';
import { sseRoutes, sendEventsToAll } from './routes/sseRoutes.js';
import { swaggerUi, swaggerSpec } from './swagger.js';
import geoip from 'geoip-lite';
import requestIp from 'request-ip';
import axios from 'axios';
// import './discordBot.js';

dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://srv800316.hstgr.cloud/', 'http://srv800316.hstgr.cloud//api-docs'],
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
app.use('/sse', sseRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Agendar cron job para coletar mensagens e enviar aos clientes conectados
const collectMessages = async () => {
    const channelIds = [
        process.env.CHANNEL_ID_1,
        process.env.CHANNEL_ID_2,
        process.env.CHANNEL_ID_3
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
        if(collectedMessages.length > 0) {
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

console.log(`Cron job agendado com a expressão: "${CRON_SCHEDULE}"`);

export { app };