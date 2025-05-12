import { Client, GatewayIntentBits } from 'discord.js';
import { sendEventsToAll } from './routes/sseRoutes.js';
import { formatMultiBuyMessage } from './utils/formatter.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Necessário para capturar o conteúdo das mensagens
    ]
});

client.once('ready', () => {
    console.log(`🤖 Bot logado como ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    // Ignora mensagens do próprio bot
    if (message.author.bot) return;
    
    // Se a mensagem tiver o padrão "MULTI BUY", aplica a formatação
    if (message.content.includes("MULTI BUY")) {
        console.log("Mensagem MULTI BUY recebida.");
        const formattedContent = formatMultiBuyMessage(message.content);
    
        // Cria um objeto com os dados que serão enviados via SSE
        const eventPayload = { 
            id: message.id,
            author: {
                username: message.author.username,
            },
            content: formattedContent,
            embeds: message.embeds
        };
    
        // Envia para os clientes conectados (SSE)
        sendEventsToAll([eventPayload]);
    
        // Se desejar, também envie para o Telegram (ou outras integrações)
        // Exemplo: sendToTelegramClient(formattedContent);
    }
});

client.login(process.env.DISCORD_TOKEN);