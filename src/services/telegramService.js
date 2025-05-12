import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { configDotenv } from 'dotenv';
configDotenv();

const sendToTelegram = async (text) => {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
    const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_ID || '';

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_IDS) {
        console.error('Telegram Token ou Chat IDs não configurados.');
        return;
    }

    const chatIds = TELEGRAM_CHAT_IDS.split(',').map(id => id.trim());

    for (const chatId of chatIds) {
        try {
            const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            const data = response.data;

            if (!data.ok) {
                console.error(`Erro ao enviar mensagem para o Telegram (Chat ID: ${chatId}):`, data.description);
            }
        } catch (error) {
            if (error.response) {
                console.error(`Erro ao enviar mensagem para o Telegram (Chat ID: ${chatId}):`, error.response.data.description || error.response.statusText);
            } else if (error.request) {
                console.error(`Erro ao enviar mensagem para o Telegram (Chat ID: ${chatId}): Nenhuma resposta recebida.`);
            } else {
                console.error(`Erro ao enviar mensagem para o Telegram (Chat ID: ${chatId}):`, error.message);
            }
        }
    }
};

const sendToTelegramClient = async (text) => {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
    const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_ID || '';
    
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_IDS) {
        console.error('Telegram Token ou Chat IDs não configurados.');
        process.exit(1);
    }

    const chatIds = TELEGRAM_CHAT_IDS.split(',').map(id => id.trim());
    const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

    for (const chatId of chatIds) {
        try {
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error(`Erro ao enviar mensagem pelo cliente Telegram (Chat ID: ${chatId}):`, error.message);
            console.log('Tentando enviar mensagem em HTML...');
            await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
        }
    }
};

export { sendToTelegram, sendToTelegramClient };