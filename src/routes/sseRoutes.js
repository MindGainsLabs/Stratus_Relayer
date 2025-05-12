import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
const router = express.Router();

// Array para armazenar conexões dos clientes
const clients = [];

/**
 * @swagger
 * tags:
 *   name: SSE
 *   description: Endpoint de Server Sent Events para transmitir mensagens em tempo real
 */

/**
 * @swagger
 * /sse/stream:
 *   get:
 *     summary: Conecta ao stream SSE para receber mensagens em tempo real
 *     tags: [SSE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conexão estabelecida para envio de eventos SSE.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: Token inválido ou ausente.
 */
router.get('/stream', authenticateToken, (req, res) => {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);
    console.log(`Cliente ${clientId} conectado para SSE.`);

    // Remove o cliente se a conexão for fechada
    req.on('close', () => {
        console.log(`Cliente ${clientId} desconectado.`);
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });
});

// Função para enviar eventos a todos os clientes conectados
const sendEventsToAll = (newMessages) => {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(newMessages)}\n\n`);
    });
};

export { router as sseRoutes, sendEventsToAll };