import express from 'express';
import cors from 'cors';
import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';
import connectDB from './config/db.js';
import messageRoutes from './routes/messageRoutes.js';
import { retrieveMessages } from './services/messageService.js';

dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'https://srv711516.hstgr.cloud/stratus/',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Servir arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

// Rotas
app.use('/api', messageRoutes);

// Agendar cron job
const collectMessages = async () => {
    const channelIds = [
        process.env.CHANNEL_ID_1 || req.body.channelId1,
        process.env.CHANNEL_ID_2 || req.body.channelId2,
        process.env.CHANNEL_ID_3 || req.body.channelId3
    ];
    const hours = parseInt(process.env.CRON_HOURS) || 6;

    if (channelIds.length === 0) {
        console.error('CHANNEL_IDS não estão configurados no ambiente.');
        return;
    }

    try {
        for (const channelId of channelIds) {
            const messages = await retrieveMessages(channelId, hours);
            console.log(`Coleta de mensagens concluída para o canal ${channelId}. Total de novas mensagens: ${messages.length}`);
        }
    } catch (error) {
        console.error('Erro ao coletar mensagens no cron job:', error);
    }
};

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/2 * * * * *';

cron.schedule(CRON_SCHEDULE, () => {
    console.log('Iniciando cron job para coletar mensagens...');
    collectMessages();
});

console.log(`Cron job agendado com a seguinte expressão: "${CRON_SCHEDULE}"`);

export { app };
