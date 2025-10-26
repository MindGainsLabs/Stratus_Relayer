import {
  processTokenCall,
  getTokenNarrative,
  searchNarratives,
  reanalyzeToken
} from '../services/narrativeService.js';
import TokenNarrative from '../models/TokenNarrative.js';
import SentimentAnalysis from '../models/SentimentAnalysis.js';

/**
 * Processa uma nova call de token (manual trigger)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createTokenNarrative = async (req, res) => {
  try {
    const { tokenSymbol, tokenAddress, messageId, channelId } = req.body;

    if (!tokenSymbol || !tokenAddress) {
      return res.status(400).json({
        error: 'Token symbol and address are required'
      });
    }

    const result = await processTokenCall({
      tokenSymbol,
      tokenAddress,
      messageId: messageId || 'manual',
      channelId: channelId || 'api',
      timestamp: new Date()
    });

    res.status(result.isNew ? 201 : 200).json({
      message: 'Token call processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating token narrative:', error);
    res.status(500).json({
      error: 'Error processing token call',
      details: error.message
    });
  }
};

/**
 * Busca narrativa de um token específico
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getNarrative = async (req, res) => {
  try {
    const { tokenAddress } = req.params;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address is required' });
    }

    const result = await getTokenNarrative(tokenAddress);

    if (!result || !result.narrative) {
      return res.status(404).json({
        error: 'Narrative not found for this token',
        message: 'This token has not been analyzed yet. Create a call first.'
      });
    }

    res.json({
      message: 'Narrative retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching narrative:', error);
    res.status(500).json({
      error: 'Error fetching narrative',
      details: error.message
    });
  }
};

/**
 * Busca narrativas com filtros
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const searchNarrativesController = async (req, res) => {
  try {
    const {
      tokenSymbol,
      minSentiment,
      maxSentiment,
      minRank,
      maxRank,
      status,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const options = {
      tokenSymbol,
      minSentiment: minSentiment ? parseFloat(minSentiment) : undefined,
      maxSentiment: maxSentiment ? parseFloat(maxSentiment) : undefined,
      minRank: minRank ? parseInt(minRank, 10) : undefined,
      maxRank: maxRank ? parseInt(maxRank, 10) : undefined,
      status,
      sortBy,
      sortOrder,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };

    const result = await searchNarratives(options);

    res.json({
      message: 'Narratives retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error searching narratives:', error);
    res.status(500).json({
      error: 'Error searching narratives',
      details: error.message
    });
  }
};

/**
 * Força re-análise de um token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const reanalyze = async (req, res) => {
  try {
    const { tokenAddress } = req.params;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address is required' });
    }

    const result = await reanalyzeToken(tokenAddress);

    res.json({
      message: 'Token re-analysis completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error reanalyzing token:', error);
    res.status(500).json({
      error: 'Error reanalyzing token',
      details: error.message
    });
  }
};

/**
 * Busca análises de sentimento de um token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTokenSentimentAnalyses = async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { limit = 10, page = 1 } = req.query;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address is required' });
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [analyses, total] = await Promise.all([
      SentimentAnalysis.find({ tokenAddress })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      SentimentAnalysis.countDocuments({ tokenAddress })
    ]);

    res.json({
      message: 'Sentiment analyses retrieved successfully',
      data: analyses,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Error fetching sentiment analyses:', error);
    res.status(500).json({
      error: 'Error fetching sentiment analyses',
      details: error.message
    });
  }
};

/**
 * Busca estatísticas gerais de narrativas
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getNarrativeStats = async (req, res) => {
  try {
    const [
      total,
      completed,
      processing,
      failed,
      avgSentiment,
      topSentiment,
      topRanked
    ] = await Promise.all([
      TokenNarrative.countDocuments(),
      TokenNarrative.countDocuments({ analysisStatus: 'completed' }),
      TokenNarrative.countDocuments({ analysisStatus: 'processing' }),
      TokenNarrative.countDocuments({ analysisStatus: 'failed' }),
      TokenNarrative.aggregate([
        { $match: { analysisStatus: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$sentimentScore' } } }
      ]),
      TokenNarrative.find({ analysisStatus: 'completed' })
        .sort({ sentimentScore: -1 })
        .limit(10)
        .select('tokenSymbol tokenAddress sentimentScore socialMetrics.interactions topicRank'),
      TokenNarrative.find({ analysisStatus: 'completed', topicRank: { $ne: null } })
        .sort({ topicRank: 1 })
        .limit(10)
        .select('tokenSymbol tokenAddress topicRank sentimentScore socialMetrics.interactions')
    ]);

    res.json({
      message: 'Narrative statistics retrieved successfully',
      data: {
        total,
        byStatus: {
          completed,
          processing,
          failed
        },
        averageSentiment: avgSentiment[0]?.avg || 0,
        topBySentiment: topSentiment,
        topByRank: topRanked
      }
    });
  } catch (error) {
    console.error('Error fetching narrative stats:', error);
    res.status(500).json({
      error: 'Error fetching narrative statistics',
      details: error.message
    });
  }
};

/**
 * Busca trending tokens baseado em narrativas
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTrendingTokens = async (req, res) => {
  try {
    const { limit = 20, metric = 'interactions' } = req.query;

    const validMetrics = ['interactions', 'sentimentScore', 'topicRank'];
    const sortMetric = validMetrics.includes(metric) ? metric : 'interactions';

    let sort = {};
    if (sortMetric === 'topicRank') {
      sort = { topicRank: 1 }; // Menor rank = melhor posição
    } else if (sortMetric === 'interactions') {
      sort = { 'socialMetrics.interactions': -1 };
    } else {
      sort = { sentimentScore: -1 };
    }

    const trending = await TokenNarrative.find({
      analysisStatus: 'completed',
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Última semana
    })
      .sort(sort)
      .limit(parseInt(limit, 10))
      .select('tokenSymbol tokenAddress sentimentScore socialMetrics trending topicRank updatedAt');

    res.json({
      message: 'Trending tokens retrieved successfully',
      data: trending,
      sortedBy: sortMetric
    });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    res.status(500).json({
      error: 'Error fetching trending tokens',
      details: error.message
    });
  }
};

/**
 * Deleta uma narrativa (admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteNarrative = async (req, res) => {
  try {
    const { tokenAddress } = req.params;

    if (!tokenAddress) {
      return res.status(400).json({ error: 'Token address is required' });
    }

    const narrative = await TokenNarrative.findOneAndDelete({ tokenAddress });

    if (!narrative) {
      return res.status(404).json({ error: 'Narrative not found' });
    }

    // Deleta análises de sentimento relacionadas
    await SentimentAnalysis.deleteMany({ narrativeId: narrative._id });

    res.json({
      message: 'Narrative and related analyses deleted successfully',
      deletedToken: {
        symbol: narrative.tokenSymbol,
        address: narrative.tokenAddress
      }
    });
  } catch (error) {
    console.error('Error deleting narrative:', error);
    res.status(500).json({
      error: 'Error deleting narrative',
      details: error.message
    });
  }
};

export default {
  createTokenNarrative,
  getNarrative,
  searchNarrativesController,
  reanalyze,
  getTokenSentimentAnalyses,
  getNarrativeStats,
  getTrendingTokens,
  deleteNarrative
};
