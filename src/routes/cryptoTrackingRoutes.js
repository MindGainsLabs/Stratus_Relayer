import express from 'express';
import { 
    getStructuredCryptoData,
    getTokenStatistics,
    searchTokens,
    getTopTokens
} from '../controllers/cryptoTrackingController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: CryptoTracking
 *   description: API endpoints for crypto wallet and token tracking
 */

/**
 * @swagger
 * /api/crypto/structured-data:
 *   post:
 *     summary: Get structured crypto tracking data from Discord messages
 *     tags: [CryptoTracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Parameters for extracting crypto data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *                 description: Number of hours to look back
 *               tokenSymbol:
 *                 type: string
 *                 description: Filter by specific token symbol (optional)
 *               walletName:
 *                 type: string
 *                 description: Filter by wallet name (optional)
 *               channelId:
 *                 type: string
 *                 description: ID of Discord channel to retrieve latest messages from (optional)
 *     responses:
 *       200:
 *         description: Structured crypto data retrieved successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while retrieving data
 */
router.post('/structured-data', authenticateToken, getStructuredCryptoData);

/**
 * @swagger
 * /api/crypto/token-stats:
 *   get:
 *     summary: Get token statistics summary
 *     tags: [CryptoTracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *         description: Number of hours to look back (default: 24)
 *     responses:
 *       200:
 *         description: Token statistics retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while retrieving statistics
 */
router.get('/token-stats', authenticateToken, getTokenStatistics);

/**
 * @swagger
 * /api/crypto/search:
 *   get:
 *     summary: Search tokens by symbol or ID
 *     tags: [CryptoTracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for token symbol or ID
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *         description: Number of hours to look back (default: 24)
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid or missing search query
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while searching
 */
router.get('/search', authenticateToken, searchTokens);

/**
 * @swagger
 * /api/crypto/top-tokens:
 *   get:
 *     summary: Get top tokens by specified metric
 *     tags: [CryptoTracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [totalSol, mentions, uniqueWallets, riskScore]
 *         description: Metric to sort by (default: totalSol)
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *         description: Number of hours to look back (default: 24)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of results to return (default: 10)
 *     responses:
 *       200:
 *         description: Top tokens retrieved successfully
 *       400:
 *         description: Invalid metric specified
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while retrieving top tokens
 */
router.get('/top-tokens', authenticateToken, getTopTokens);

export default router;