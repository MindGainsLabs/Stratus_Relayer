import express from 'express';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WebSocket
 *   description: WebSocket API documentation (Reference Only - Not HTTP endpoints)
 */

/**
 * @swagger
 * /websocket/authenticate:
 *   post:
 *     summary: "[WebSocket Event] Authenticate with the server"
 *     tags: [WebSocket]
 *     description: |
 *       **This is not an HTTP endpoint - it's a WebSocket event reference.**
 *       
 *       To use: Connect to `ws://srv800316.hstgr.cloud:8081` and emit this event.
 *       
 *       ```javascript
 *       socket.emit('authenticate', { token: 'your-bearer-token' });
 *       ```
 *     requestBody:
 *       description: Authentication data to send via WebSocket
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Bearer token for authentication
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: "WebSocket Response: 'authenticated' event"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully authenticated"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user123"
 *                     username:
 *                       type: string
 *                       example: "trader01"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: "WebSocket Response: 'authentication-failed' event"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid token"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /websocket/subscribe-crypto-tracking:
 *   post:
 *     summary: "[WebSocket Event] Subscribe to crypto tracking updates"
 *     tags: [WebSocket]
 *     description: |
 *       **This is not an HTTP endpoint - it's a WebSocket event reference.**
 *       
 *       Must be authenticated first. Then emit this event to start receiving real-time updates.
 *       
 *       ```javascript
 *       socket.emit('subscribe-crypto-tracking', {
 *         hours: 24,
 *         tokenSymbol: 'SOL', // optional
 *         walletName: 'whale_wallet' // optional
 *       });
 *       ```
 *     requestBody:
 *       description: Subscription parameters
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *                 description: "Number of hours to look back (default: 24)"
 *                 example: 24
 *               tokenSymbol:
 *                 type: string
 *                 description: Filter by specific token symbol (optional)
 *                 example: "SOL"
 *               walletName:
 *                 type: string
 *                 description: Filter by wallet name (optional)
 *                 example: "whale_wallet"
 *               channelId:
 *                 type: string
 *                 description: Discord channel ID to filter (optional)
 *                 example: "123456789012345678"
 *     responses:
 *       200:
 *         description: "WebSocket Response: 'subscription-confirmed' event"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscribed to crypto tracking updates"
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     hours:
 *                       type: number
 *                     tokenSymbol:
 *                       type: string
 *                       nullable: true
 *                     walletName:
 *                       type: string
 *                       nullable: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /websocket/crypto-tracking-update:
 *   get:
 *     summary: "[WebSocket Event] Real-time crypto tracking data"
 *     tags: [WebSocket]
 *     description: |
 *       **This is not an HTTP endpoint - it's a WebSocket event reference.**
 *       
 *       After subscribing, you'll receive this event with real-time data.
 *       
 *       ```javascript
 *       socket.on('crypto-tracking-update', (data) => {
 *         console.log('New crypto data:', data);
 *       });
 *       ```
 *     responses:
 *       200:
 *         description: "WebSocket Event: Real-time crypto tracking data"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "crypto-tracking-update"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenSymbol:
 *                       type: string
 *                       example: "SOL"
 *                     walletName:
 *                       type: string
 *                       example: "whale_wallet"
 *                     totalSol:
 *                       type: number
 *                       example: 1250.75
 *                     riskScore:
 *                       type: number
 *                       example: 0.85
 *                     mentions:
 *                       type: number
 *                       example: 15
 *                     uniqueWallets:
 *                       type: number
 *                       example: 8
 *                     lastActivity:
 *                       type: string
 *                       format: date-time
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           amount:
 *                             type: number
 *                           type:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /websocket/connection:
 *   get:
 *     summary: "[WebSocket] Connection Information"
 *     tags: [WebSocket]
 *     description: |
 *       **WebSocket Connection Details:**
 *       
 *       - **URL:** `ws://srv800316.hstgr.cloud:8081`
 *       - **Protocol:** WebSocket
 *       - **Authentication:** Required (Bearer token)
 *       
 *       **Connection Flow:**
 *       1. Connect to WebSocket URL
 *       2. Emit 'authenticate' event with your token
 *       3. Wait for 'authenticated' event
 *       4. Emit 'subscribe-crypto-tracking' event
 *       5. Receive real-time 'crypto-tracking-update' events
 *       
 *       **Example Client Code:**
 *       ```javascript
 *       const socket = io('ws://srv800316.hstgr.cloud:8081');
 *       
 *       socket.emit('authenticate', { token: 'your-token' });
 *       
 *       socket.on('authenticated', () => {
 *         socket.emit('subscribe-crypto-tracking', { hours: 24 });
 *       });
 *       
 *       socket.on('crypto-tracking-update', (data) => {
 *         console.log('Real-time data:', data);
 *       });
 *       ```
 *     responses:
 *       200:
 *         description: Connection information (this is documentation only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 websocket_url:
 *                   type: string
 *                   example: "ws://srv800316.hstgr.cloud:8081"
 *                 authentication:
 *                   type: string
 *                   example: "Bearer token required"
 *                 events:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["authenticate", "subscribe-crypto-tracking", "crypto-tracking-update"]
 */

// Note: These are not real routes - they're just for Swagger documentation
// The actual WebSocket events are handled in websocketRoutes.js

export default router;
