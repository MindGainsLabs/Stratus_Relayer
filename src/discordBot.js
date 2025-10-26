import { Client, GatewayIntentBits } from 'discord.js';
import { sendEventsToAll } from './routes/sseRoutes.js';
import { formatMultiBuyMessage } from './utils/formatter.js';
import ChannelCall from './models/ChannelCall.js';
import dotenv from 'dotenv';
dotenv.config();

// Lista de canais (se vazio captura todos)
const CALL_CHANNEL_IDS = (process.env.DISCORD_CALL_CHANNEL_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

// Padrões que indicam uma call de compra
const CALL_PATTERNS = [
    /MULTI BUY/i,
    /BUY ALERT/i,
    /ENTRY\s*@/i,
    /CALL:\s*/i
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`🤖 Bot logado como ${client.user.tag}`);
    console.log('Monitorando canais para calls:', CALL_CHANNEL_IDS.length ? CALL_CHANNEL_IDS.join(', ') : 'TODOS');
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;
        const channelOk = CALL_CHANNEL_IDS.length === 0 || CALL_CHANNEL_IDS.includes(message.channelId);
        if (!channelOk) return;

        const content = message.content || '';
        const isCall = CALL_PATTERNS.some(r => r.test(content));
        if (!isCall) return;

        // Heurísticas de extração
        const tokenSymbolMatch = content.match(/#?(?:MULTI BUY\s+)?([A-Z0-9]{2,10})/i);
        const tokenSymbol = tokenSymbolMatch ? tokenSymbolMatch[1].toUpperCase() : null;
        const tokenAddressMatch = content.match(/([A-Za-z0-9]{30,})/);
        const tokenAddress = tokenAddressMatch ? tokenAddressMatch[1] : null;
        const entryMatch = content.match(/ENTRY\s*@\s*([0-9]*\.?[0-9]+)/i) || content.match(/@\s*([0-9]*\.?[0-9]+)/);
        const entryPrice = entryMatch ? parseFloat(entryMatch[1]) : null;

        const callDoc = await ChannelCall.create({
            channelId: message.channelId,
            channelName: message.channel?.name,
            messageId: message.id,
            tokenSymbol,
            tokenAddress,
            entryPrice: entryPrice || undefined,
            highestPrice: entryPrice || 0,
            lowestPrice: entryPrice || 0,
            authorId: message.author.id,
            authorUsername: message.author.username,
            tags: [],
            priceSnapshots: entryPrice ? [{ price: entryPrice }] : []
        });

        console.log(`📈 Call registrada canal=${callDoc.channelId} token=${callDoc.tokenSymbol || 'N/A'} entry=${callDoc.entryPrice || 'N/A'}`);

        if (content.includes('MULTI BUY')) {
            const formattedContent = formatMultiBuyMessage(content);
            const eventPayload = {
                id: message.id,
                author: { username: message.author.username },
                content: formattedContent,
                embeds: message.embeds
            };
            sendEventsToAll([eventPayload]);
        }
    } catch (err) {
        console.error('Erro ao processar call Discord:', err.message);
    }
});

client.login(process.env.DISCORD_TOKEN);