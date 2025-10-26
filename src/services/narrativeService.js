import TokenNarrative from '../models/TokenNarrative.js';
import SentimentAnalysis from '../models/SentimentAnalysis.js';
import {
  getCompleteTokenAnalysis,
  getTopicAIReport,
  calculateSentimentScore,
  extractTrendingStatus
} from './lunarCrushService.js';
import { enqueueTokenAnalysis } from './queueService.js';

/**
 * Processa uma nova call de token detectada no Discord
 * Cria ou atualiza a narrativa do token e adiciona na fila RabbitMQ
 * @param {Object} callData - Dados da call do Discord
 * @returns {Promise<Object>}
 */
export const processTokenCall = async (callData) => {
  const {
    tokenSymbol,
    tokenAddress,
    messageId,
    channelId,
    timestamp = new Date()
  } = callData;

  if (!tokenSymbol || !tokenAddress) {
    throw new Error('Token symbol and address are required');
  }

  console.log(`[Narrative] Processing call for token ${tokenSymbol} (${tokenAddress})`);

  try {
    // Verifica se já existe narrativa para este token
    let narrative = await TokenNarrative.findOne({ tokenAddress });

    const isNewNarrative = !narrative;

    if (narrative) {
      // Atualiza narrativa existente
      console.log(`[Narrative] Updating existing narrative for ${tokenSymbol}`);
      narrative.lastCallMessageId = messageId;
      narrative.lastCallChannelId = channelId;
      narrative.lastCallTimestamp = timestamp;
      narrative.totalCallsDetected += 1;
      narrative.analysisStatus = 'processing';
    } else {
      // Cria nova narrativa
      console.log(`[Narrative] Creating new narrative for ${tokenSymbol}`);
      narrative = new TokenNarrative({
        tokenSymbol,
        tokenAddress,
        lastCallMessageId: messageId,
        lastCallChannelId: channelId,
        lastCallTimestamp: timestamp,
        firstDetectedAt: timestamp,
        totalCallsDetected: 1,
        analysisStatus: 'processing'
      });
    }

    await narrative.save();

    // Adiciona na fila RabbitMQ ao invés de processar diretamente
    try {
      await enqueueTokenAnalysis({
        tokenSymbol,
        tokenAddress,
        narrativeId: narrative._id,
        callContext: {
          messageId,
          channelId,
          timestamp,
          isUpdate: !isNewNarrative
        },
        priority: isNewNarrative ? 7 : 5 // Novos tokens têm prioridade maior
      });

      console.log(`[Narrative] ✅ Token ${tokenSymbol} added to processing queue`);
    } catch (queueError) {
      console.error(`[Narrative] ⚠️ Failed to enqueue ${tokenSymbol}, falling back to direct processing:`, queueError.message);
      
      // Fallback: processamento direto se fila falhar
      performTokenAnalysis(narrative._id, tokenSymbol, tokenAddress, {
        messageId,
        channelId,
        timestamp,
        isUpdate: !isNewNarrative
      }).catch(error => {
        console.error(`[Narrative] Background analysis failed for ${tokenSymbol}:`, error);
      });
    }

    return {
      narrativeId: narrative._id,
      isNew: isNewNarrative,
      status: 'queued', // Mudou de 'processing' para 'queued'
      message: isNewNarrative 
        ? 'New narrative created, added to processing queue'
        : 'Narrative updated, added to processing queue'
    };

  } catch (error) {
    console.error(`[Narrative] Error processing token call for ${tokenSymbol}:`, error);
    throw error;
  }
};

/**
 * Realiza análise completa do token usando LunarCrush
 * NOTA: Esta função agora é chamada apenas pelo Consumer da fila ou como fallback
 * @param {string} narrativeId - ID da narrativa no MongoDB
 * @param {string} tokenSymbol - Símbolo do token (tentativa primária)
 * @param {string} tokenAddress - Address do token (fallback)
 * @param {Object} callContext - Contexto da call
 */
const performTokenAnalysis = async (narrativeId, tokenSymbol, tokenAddress, callContext) => {
  const startTime = Date.now();

  try {
    console.log(`[Narrative] Starting analysis for ${tokenSymbol} (${tokenAddress})`);

    // Busca análise completa: tenta symbol primeiro, fallback para address
    const analysis = await getCompleteTokenAnalysis(tokenSymbol, tokenAddress);

    // Extrai dados principais
    const topicData = analysis.topic?.data || null;
    const timeSeriesData = analysis.timeSeries?.data || [];
    const postsData = analysis.posts?.data || [];
    const newsData = analysis.news?.data || [];
    const creatorsData = analysis.creators?.data || [];

    if (!topicData) {
      throw new Error(`No topic data found for ${tokenSymbol} on LunarCrush`);
    }

    // Calcula sentimento
    const sentiment = calculateSentimentScore(analysis.topic);

    // Extrai trending
    const trending = extractTrendingStatus(analysis.topic);

    // Prepara dados agregados
    const socialMetrics = {
      interactions: topicData.interactions_24h || 0,
      posts: topicData.num_posts || 0,
      contributors: topicData.contributors_24h || 0,
      engagementScore: topicData.social_score || 0
    };

    // Processa top creators
    const topCreators = creatorsData.slice(0, 10)
      .map(creator => {
        const name = creator.name || creator.display_name || creator.username || 'Unknown';
        const username = creator.screen_name || creator.username || creator.handle || '';
        const platform = creator.platform || creator.source || 'unknown';
        const followers = creator.followers || creator.follower_count || 0;
        const influence_score = creator.influence_score || creator.score || 0;

        return {
          name,
          username,
          platform,
          followers,
          influence_score
        };
      })
      .filter(creator => creator.name && creator.name !== 'Unknown'); // Remove creators sem nome válido

    // Processa top posts
    const topPosts = postsData.slice(0, 10)
      .map(post => {
        // Valida dados obrigatórios antes de criar o objeto
        const text = post.text || post.body || post.content;
        const author = post.creator_name || post.creator?.name || post.author?.name || 'Unknown';
        const platform = post.platform || post.source || 'unknown';
        const engagement = post.interactions || post.engagement || 0;
        const timestamp = post.time ? new Date(post.time * 1000) : (post.created_at ? new Date(post.created_at) : new Date());
        const url = post.url || post.link || '';

        // Só inclui posts com dados válidos
        if (!text || text.trim() === '') {
          return null;
        }

        return {
          text: text.trim(),
          author,
          platform,
          engagement,
          timestamp,
          url
        };
      })
      .filter(post => post !== null); // Remove posts inválidos

    // Processa notícias
    const topNews = newsData.slice(0, 5)
      .map(news => {
        const title = news.title || news.headline || '';
        const source = news.source || news.publisher || 'Unknown';
        const url = news.url || news.link || '';
        const engagement = news.interactions || news.engagement || 0;
        const publishedAt = news.time ? new Date(news.time * 1000) : (news.published_at ? new Date(news.published_at) : new Date());

        // Só inclui notícias com título e URL
        if (!title || !url) {
          return null;
        }

        return {
          title: title.trim(),
          source,
          url,
          engagement,
          publishedAt
        };
      })
      .filter(news => news !== null); // Remove notícias inválidas

    // Processa série temporal
    const timeSeries = timeSeriesData
      .map(point => {
        const timestamp = point.time ? new Date(point.time * 1000) : (point.timestamp ? new Date(point.timestamp) : null);
        
        // Só inclui pontos com timestamp válido
        if (!timestamp || isNaN(timestamp.getTime())) {
          return null;
        }

        return {
          timestamp,
          sentiment: point.sentiment || 50,
          interactions: point.interactions || 0,
          posts: point.posts || point.num_posts || 0
        };
      })
      .filter(point => point !== null); // Remove pontos inválidos

    // Busca AI Report (pode demorar)
    let aiReport = null;
    let aiReportGeneratedAt = null;
    try {
      aiReport = await getTopicAIReport(tokenSymbol);
      aiReportGeneratedAt = new Date();
      console.log(`[Narrative] AI Report generated for ${tokenSymbol}`);
    } catch (error) {
      console.warn(`[Narrative] Could not generate AI report for ${tokenSymbol}:`, error.message);
    }

    // Log dos dados processados para debug
    console.log(`[Narrative] Processed data for ${tokenSymbol}:`, {
      topCreatorsCount: topCreators.length,
      topPostsCount: topPosts.length,
      topNewsCount: topNews.length,
      timeSeriesCount: timeSeries.length,
      hasAiReport: !!aiReport
    });

    // Atualiza narrativa no MongoDB
    const narrative = await TokenNarrative.findByIdAndUpdate(
      narrativeId,
      {
        topicId: topicData.id,
        topicRank: topicData.alt_rank || topicData.topic_rank || null,
        aiReport,
        aiReportGeneratedAt,
        sentimentScore: sentiment.score,
        sentimentBreakdown: sentiment.breakdown,
        socialMetrics,
        trending,
        topCreators: topCreators.length > 0 ? topCreators : [],
        topPosts: topPosts.length > 0 ? topPosts : [],
        topNews: topNews.length > 0 ? topNews : [],
        timeSeries: timeSeries.length > 0 ? timeSeries : [],
        analysisStatus: 'completed',
        lastAnalysisError: null
      },
      { new: true, runValidators: true } // Adiciona runValidators para validar antes de salvar
    );

    // Cria registro de análise de sentimento
    const previousAnalysis = await SentimentAnalysis.findOne({
      tokenAddress: narrative.tokenAddress
    }).sort({ createdAt: -1 });

    const sentimentAnalysis = new SentimentAnalysis({
      tokenSymbol: narrative.tokenSymbol,
      tokenAddress: narrative.tokenAddress,
      narrativeId: narrative._id,
      analysisType: previousAnalysis ? 'update' : 'initial',
      
      // Platform sentiment (extraído de social_dominance se disponível)
      platformSentiment: extractPlatformSentiment(topicData),
      
      overallSentiment: {
        score: sentiment.score,
        classification: classifySentiment(sentiment.score)
      },
      
      engagement: {
        total: socialMetrics.interactions,
        likes: topicData.likes_24h || 0,
        shares: topicData.shares_24h || 0,
        comments: topicData.comments_24h || 0,
        views: topicData.views_24h || 0
      },
      
      keywords: extractKeywords(postsData),
      hashtags: extractHashtags(postsData),
      
      triggerSource: 'discord_call',
      callReference: {
        messageId: callContext.messageId,
        channelId: callContext.channelId,
        timestamp: callContext.timestamp
      },
      
      comparedToPrevious: previousAnalysis ? {
        sentimentChange: sentiment.score - previousAnalysis.overallSentiment.score,
        engagementChange: socialMetrics.interactions - previousAnalysis.engagement.total,
        volumeChange: socialMetrics.posts - (previousAnalysis.engagement.posts || 0)
      } : {},
      
      analysisMetadata: {
        dataSource: 'LunarCrush',
        apiVersion: 'v4',
        processingTime: Date.now() - startTime,
        confidence: topicData.social_score || 50
      },
      
      status: 'completed'
    });

    await sentimentAnalysis.save();

    console.log(`[Narrative] Analysis completed for ${tokenSymbol} in ${Date.now() - startTime}ms`);
    
    return {
      narrative,
      sentimentAnalysis
    };

  } catch (error) {
    console.error(`[Narrative] Analysis failed for ${tokenSymbol}:`, error);
    
    // Atualiza status de erro
    await TokenNarrative.findByIdAndUpdate(narrativeId, {
      analysisStatus: 'failed',
      lastAnalysisError: error.message
    });

    throw error;
  }
};

/**
 * Extrai sentimento por plataforma
 */
const extractPlatformSentiment = (topicData) => {
  const platforms = {
    twitter: { score: 50, volume: 0, mentions: 0 },
    reddit: { score: 50, volume: 0, mentions: 0 },
    youtube: { score: 50, volume: 0, mentions: 0 },
    telegram: { score: 50, volume: 0, mentions: 0 }
  };

  // LunarCrush fornece social_dominance que mostra distribuição por plataforma
  if (topicData.social_dominance) {
    const dominance = topicData.social_dominance;
    
    if (dominance.twitter) {
      platforms.twitter.volume = dominance.twitter * topicData.interactions_24h || 0;
      platforms.twitter.mentions = Math.round(dominance.twitter * topicData.num_posts || 0);
      platforms.twitter.score = calculatePlatformScore(dominance.twitter);
    }
    
    if (dominance.reddit) {
      platforms.reddit.volume = dominance.reddit * topicData.interactions_24h || 0;
      platforms.reddit.mentions = Math.round(dominance.reddit * topicData.num_posts || 0);
      platforms.reddit.score = calculatePlatformScore(dominance.reddit);
    }
    
    // YouTube e Telegram podem não estar disponíveis em todos os casos
  }

  return platforms;
};

/**
 * Calcula score de plataforma baseado em dominância
 */
const calculatePlatformScore = (dominance) => {
  // Maior dominância = maior score
  return Math.min(100, Math.round(dominance * 200));
};

/**
 * Classifica sentimento baseado no score
 */
const classifySentiment = (score) => {
  if (score >= 80) return 'very_positive';
  if (score >= 60) return 'positive';
  if (score >= 40) return 'neutral';
  if (score >= 20) return 'negative';
  return 'very_negative';
};

/**
 * Extrai keywords dos posts
 */
const extractKeywords = (posts) => {
  const keywords = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'in', 'on', 'at']);

  posts.forEach(post => {
    const text = (post.text || post.body || '').toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    
    words.forEach(word => {
      if (!stopWords.has(word)) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    });
  });

  // Retorna top 20 keywords
  return Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term, frequency]) => ({
      term,
      frequency,
      sentiment: 50 // neutro por padrão, poderia ser calculado com análise adicional
    }));
};

/**
 * Extrai hashtags dos posts
 */
const extractHashtags = (posts) => {
  const hashtags = {};

  posts.forEach(post => {
    const text = post.text || post.body || '';
    const tags = text.match(/#[a-zA-Z0-9_]+/g) || [];
    
    tags.forEach(tag => {
      const normalized = tag.toLowerCase();
      hashtags[normalized] = (hashtags[normalized] || 0) + 1;
    });
  });

  // Retorna top 15 hashtags
  return Object.entries(hashtags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));
};

/**
 * Busca narrativa de um token
 * @param {string} tokenAddress - Endereço do token
 * @returns {Promise<Object>}
 */
export const getTokenNarrative = async (tokenAddress) => {
  try {
    const narrative = await TokenNarrative.findOne({ tokenAddress });
    
    if (!narrative) {
      return null;
    }

    // Busca análises de sentimento relacionadas
    const sentimentAnalyses = await SentimentAnalysis.find({
      narrativeId: narrative._id
    }).sort({ createdAt: -1 }).limit(10);

    return {
      narrative,
      recentAnalyses: sentimentAnalyses
    };
  } catch (error) {
    console.error(`Error fetching narrative for ${tokenAddress}:`, error);
    throw error;
  }
};

/**
 * Busca narrativas com filtros e paginação
 * @param {Object} options - Opções de busca
 * @returns {Promise<Object>}
 */
export const searchNarratives = async (options = {}) => {
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
  } = options;

  try {
    const query = {};

    if (tokenSymbol) {
      query.tokenSymbol = new RegExp(tokenSymbol, 'i');
    }

    if (minSentiment !== undefined || maxSentiment !== undefined) {
      query.sentimentScore = {};
      if (minSentiment !== undefined) query.sentimentScore.$gte = minSentiment;
      if (maxSentiment !== undefined) query.sentimentScore.$lte = maxSentiment;
    }

    if (minRank !== undefined || maxRank !== undefined) {
      query.topicRank = {};
      if (minRank !== undefined) query.topicRank.$gte = minRank;
      if (maxRank !== undefined) query.topicRank.$lte = maxRank;
    }

    if (status) {
      query.analysisStatus = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [narratives, total] = await Promise.all([
      TokenNarrative.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      TokenNarrative.countDocuments(query)
    ]);

    return {
      data: narratives,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + narratives.length < total
      }
    };
  } catch (error) {
    console.error('Error searching narratives:', error);
    throw error;
  }
};

/**
 * Força re-análise de um token
 * @param {string} tokenAddress - Endereço do token
 * @returns {Promise<Object>}
 */
export const reanalyzeToken = async (tokenAddress) => {
  try {
    const narrative = await TokenNarrative.findOne({ tokenAddress });
    
    if (!narrative) {
      throw new Error(`Narrative not found for token ${tokenAddress}`);
    }

    narrative.analysisStatus = 'processing';
    await narrative.save();

    // Inicia análise
    await performTokenAnalysis(narrative._id, narrative.tokenSymbol, {
      messageId: 'manual_reanalysis',
      channelId: 'system',
      timestamp: new Date(),
      isUpdate: true
    });

    return {
      message: 'Re-analysis completed successfully',
      narrativeId: narrative._id
    };
  } catch (error) {
    console.error(`Error reanalyzing token ${tokenAddress}:`, error);
    throw error;
  }
};

export default {
  processTokenCall,
  getTokenNarrative,
  searchNarratives,
  reanalyzeToken
};
