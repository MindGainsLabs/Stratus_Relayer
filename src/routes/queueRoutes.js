import express from 'express';
import { getQueueStats, reprocessDLQ, purgeQueue } from '../services/queueService.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Queue
 *   description: RabbitMQ queue management endpoints
 */

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: Get queue statistics
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({
      message: 'Queue statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      error: 'Error getting queue statistics',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/queue/reprocess-dlq:
 *   post:
 *     summary: Reprocess messages from Dead Letter Queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: number
 *                 description: Number of messages to reprocess (default: 10)
 *     responses:
 *       200:
 *         description: Messages reprocessed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/reprocess-dlq', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    const reprocessed = await reprocessDLQ(limit);
    
    res.json({
      message: `Successfully reprocessed ${reprocessed} messages from DLQ`,
      reprocessedCount: reprocessed
    });
  } catch (error) {
    console.error('Error reprocessing DLQ:', error);
    res.status(500).json({
      error: 'Error reprocessing DLQ',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/queue/purge:
 *   post:
 *     summary: Purge queue (admin only - use with caution!)
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               queueName:
 *                 type: string
 *                 description: Name of the queue to purge
 *               confirm:
 *                 type: boolean
 *                 description: Must be true to confirm purge
 *     responses:
 *       200:
 *         description: Queue purged successfully
 *       400:
 *         description: Confirmation required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/purge', authenticateToken, async (req, res) => {
  try {
    const { queueName, confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json({
        error: 'Purge confirmation required',
        message: 'Set "confirm": true to purge the queue'
      });
    }

    const purgedCount = await purgeQueue(queueName);
    
    res.json({
      message: `Successfully purged ${purgedCount} messages`,
      purgedCount,
      queueName: queueName || 'narrative_analysis_queue'
    });
  } catch (error) {
    console.error('Error purging queue:', error);
    res.status(500).json({
      error: 'Error purging queue',
      details: error.message
    });
  }
});

export default router;
