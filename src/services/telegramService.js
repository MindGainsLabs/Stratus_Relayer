import axios from 'axios';
import { configDotenv } from 'dotenv';
configDotenv();

const sendToTelegram = async (text) => {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Telegram Token ou Chat ID não configurado.');
        return;
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const data = response.data; // ✅ Correto: Utilizar `response.data` diretamente

        if (!data.ok) {
            console.error('Erro ao enviar mensagem para o Telegram:', data.description);
        }
    } catch (error) {
        if (error.response) {
            // O servidor respondeu com um status fora do intervalo 2xx
            console.error('Erro ao enviar mensagem para o Telegram:', error.response.data.description || error.response.statusText);
        } else if (error.request) {
            // A requisição foi feita, mas nenhuma resposta foi recebida
            console.error('Erro ao enviar mensagem para o Telegram: Nenhuma resposta recebida.');
        } else {
            // Algo ocorreu na configuração da requisição
            console.error('Erro ao enviar mensagem para o Telegram:', error.message);
        }
    }
};

export { sendToTelegram };

import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram Token ou Chat ID não configurado.');
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

const sendToTelegramClient = async (text) => {
    try {
        await bot.sendMessage(TELEGRAM_CHAT_ID, text, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Erro ao enviar mensagem para o Telegram:', error.message);
    }
};

export { sendToTelegramClient };