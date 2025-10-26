import ChannelCall from '../models/ChannelCall.js';
import { getChannelStats } from '../services/channelStatsService.js';

export const getChannelCalls = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const calls = await ChannelCall.find({ channelId: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));
    const total = await ChannelCall.countDocuments({ channelId: id });
    res.json({ page: parseInt(page, 10), limit: parseInt(limit, 10), total, calls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getChannelStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await getChannelStats(id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
