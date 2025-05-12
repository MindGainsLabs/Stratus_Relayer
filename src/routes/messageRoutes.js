import express from 'express';
import { getMessages, downloadMessages } from '../controllers/messageController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Operações relacionadas às mensagens do Discord
 */

/**
 * @swagger
 * /api/retrieve-messages:
 *   post:
 *     summary: Extrai mensagens de canais do Discord
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Parâmetros para extração de mensagens
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channelId:
 *                 type: string
 *                 description: ID do canal principal
 *               hours:
 *                 type: number
 *                 description: Número de horas para retornar mensagens recentes
 *               channelId1:
 *                 type: string
 *                 description: ID do primeiro canal (opcional)
 *               channelId2:
 *                 type: string
 *                 description: ID do segundo canal (opcional)
 *               channelId3:
 *                 type: string
 *                 description: ID do terceiro canal (opcional)
 *     responses:
 *       200:
 *         description: Mensagens coletadas com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Solicitação inválida.
 *       401:
 *         description: Token inválido ou ausente.
 */
router.post('/retrieve-messages', authenticateToken, getMessages);

/**
 * @swagger
 * /api/download-messages:
 *   get:
 *     summary: Baixa todas as mensagens coletadas
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arquivo contendo todas as mensagens coletadas.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       401:
 *         description: Token inválido ou ausente.
 */
router.get('/download-messages', authenticateToken, downloadMessages);

export default router;