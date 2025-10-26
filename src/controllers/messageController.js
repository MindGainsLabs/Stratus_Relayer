import { retrieveMessages } from '../services/messageService.js';
import Message from '../models/Message.js';
import { configDotenv } from 'dotenv';
configDotenv();

export const getMessages = async (req, res) => {
    const { hours, channelId1, channelId2, channelId3, channelId4 } = req.body;
    const channelIds = [
        process.env.CHANNEL_ID_1 || channelId1,
        process.env.CHANNEL_ID_2 || channelId2,
        process.env.CHANNEL_ID_3 || channelId3,
        process.env.CHANNEL_ID_4 || channelId4
    ].filter(Boolean); // Filtra IDs de canal inválidos

    try {
        const allMessages = [];
        for (const channelId of channelIds) {
            if (!channelId) {
                console.error('ID do canal não fornecido.');
                continue;
            }
            const messages = await retrieveMessages(channelId, hours);
            allMessages.push(...messages);
        }
        res.json({ message: 'Mensagens coletadas com sucesso.', data: allMessages });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao recuperar mensagens.', details: error.message });
    }
};

export const downloadMessages = async (req, res) => {
    try {
        const messages = await Message.find({})
            .sort({ createdAt: -1 })
            .select('username description');

        const data = messages.map(msg => [
            msg.username,
            msg.description,
        ]);

        const jsonContent = JSON.stringify(data, null, 2);

        res.setHeader('Content-disposition', 'attachment; filename=messages.txt');
        res.setHeader('Content-Type', 'text/plain');
        res.send(jsonContent);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao baixar mensagens.', details: error.message });
    }
};
