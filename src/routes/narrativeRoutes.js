import express from 'express';
import {
  createTokenNarrative,
  getNarrative,
  searchNarrativesController,
  reanalyze,
  getTokenSentimentAnalyses,
  getNarrativeStats,
  getTrendingTokens,
  deleteNarrative
} from '../controllers/narrativeController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Narrative
 *   description: Token narrative and sentiment analysis using LunarCrush API
 */

/**
 * @swagger
 * /api/narrative:
 *   post:
 *     summary: Create or update token narrative analysis
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Token call data to trigger narrative analysis
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenSymbol
 *               - tokenAddress
 *             properties:
 *               tokenSymbol:
 *                 type: string
 *                 description: Token symbol (e.g., "SOL", "BONK")
 *               tokenAddress:
 *                 type: string
 *                 description: Token contract address
 *               messageId:
 *                 type: string
 *                 description: Discord message ID (optional)
 *               channelId:
 *                 type: string
 *                 description: Discord channel ID (optional)
 *     responses:
 *       201:
 *         description: New narrative created successfully
 *       200:
 *         description: Existing narrative updated successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while processing
 */
router.post('/', authenticateToken, createTokenNarrative);

/**
 * @swagger
 * /api/narrative/search:
 *   get:
 *     summary: Search narratives with filters and pagination
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tokenSymbol
 *         schema:
 *           type: string
 *         description: Filter by token symbol (partial match)
 *       - in: query
 *         name: minSentiment
 *         schema:
 *           type: number
 *         description: Minimum sentiment score (0-100)
 *       - in: query
 *         name: maxSentiment
 *         schema:
 *           type: number
 *         description: Maximum sentiment score (0-100)
 *       - in: query
 *         name: minRank
 *         schema:
 *           type: number
 *         description: Minimum topic rank
 *       - in: query
 *         name: maxRank
 *         schema:
 *           type: number
 *         description: Maximum topic rank
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         description: Analysis status filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [updatedAt, sentimentScore, topicRank, socialMetrics.interactions]
 *         description: "Sort field (default: updatedAt)"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: "Sort order (default: desc)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: "Results per page (default: 20)"
 *     responses:
 *       200:
 *         description: Narratives retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while searching
 */
router.get('/search', authenticateToken, searchNarrativesController);

/**
 * @swagger
 * /api/narrative/stats:
 *   get:
 *     summary: Get narrative statistics
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while fetching statistics
 */
router.get('/stats', authenticateToken, getNarrativeStats);

/**
 * @swagger
 * /api/narrative/trending:
 *   get:
 *     summary: Get trending tokens based on narratives
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: "Number of results (default: 20)"
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [interactions, sentimentScore, topicRank]
 *         description: "Sort metric (default: interactions)"
 *     responses:
 *       200:
 *         description: Trending tokens retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while fetching trending
 */
router.get('/trending', authenticateToken, getTrendingTokens);

/**
 * @swagger
 * /api/narrative/{tokenAddress}:
 *   get:
 *     summary: Get narrative for a specific token
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Token contract address
 *     responses:
 *       200:
 *         description: Narrative retrieved successfully
 *       404:
 *         description: Narrative not found for this token
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while fetching narrative
 */
router.get('/:tokenAddress', authenticateToken, getNarrative);

/**
 * @swagger
 * /api/narrative/{tokenAddress}/reanalyze:
 *   post:
 *     summary: Force re-analysis of a token
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Token contract address
 *     responses:
 *       200:
 *         description: Re-analysis completed successfully
 *       404:
 *         description: Narrative not found for this token
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error during re-analysis
 */
router.post('/:tokenAddress/reanalyze', authenticateToken, reanalyze);

/**
 * @swagger
 * /api/narrative/{tokenAddress}/sentiment:
 *   get:
 *     summary: Get sentiment analyses for a specific token
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Token contract address
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: "Results per page (default: 10)"
 *     responses:
 *       200:
 *         description: Sentiment analyses retrieved successfully
 *       400:
 *         description: Invalid token address
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while fetching analyses
 */
router.get('/:tokenAddress/sentiment', authenticateToken, getTokenSentimentAnalyses);

/**
 * @swagger
 * /api/narrative/{tokenAddress}:
 *   delete:
 *     summary: Delete narrative and related analyses (admin)
 *     tags: [Narrative]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Token contract address
 *     responses:
 *       200:
 *         description: Narrative deleted successfully
 *       404:
 *         description: Narrative not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error while deleting
 */
router.delete('/:tokenAddress', authenticateToken, deleteNarrative);

export default router;
