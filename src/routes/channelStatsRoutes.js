import { Router } from 'express';
import { getChannelCalls, getChannelStatistics } from '../controllers/channelStatsController.js';

const router = Router();

router.get('/channels/:id/calls', getChannelCalls);
router.get('/channels/:id/stats', getChannelStatistics);

export default router;
