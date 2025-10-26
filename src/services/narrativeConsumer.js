import { getChannel, NARRATIVE_QUEUE, MAX_RETRIES } from './queueService.js';
import TokenNarrative from '../models/TokenNarrative.js';
import {
  getCompleteTokenAnalysis,
  getTopicAIReport,
  calculateSentimentScore,
  extractTrendingStatus
} from './lunarCrushService.js';
import SentimentAnalysis from '../models/SentimentAnalysis.js';

// Controle de rate limiting: 10 req/min = processar 2 tokens/min (5 req cada)
const TOKENS_PER_MINUTE = 2;
const PROCESSING_INTERVAL = 60000 / TOKENS_PER_MINUTE; // 30 segundos entre tokens

let isProcessing = false;
let lastProcessTime = 0;

/**
 * Processa um token da fila (análise completa)
 * @param {Object} messageData - Dados da mensagem
 * @returns {Promise<boolean>} - true se sucesso, false se falhar
 */
const processTokenFromQueue = async (messageData) => {
  const { tokenSymbol, tokenAddress, narrativeId, callContext, retries = 0 } = messageData;
  const startTime = Date.now();

  try {
    console.log(`[Consumer] 🔄 Processing: ${tokenSymbol} (retry: ${retries}/${MAX_RETRIES})`);

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

        return { name, username, platform, followers, influence_score };
      })
      .filter(creator => creator.name && creator.name !== 'Unknown');

    // Processa top posts
    const topPosts = postsData.slice(0, 10)
      .map(post => {
        const text = post.text || post.body || post.content;
        const author = post.creator_name || post.creator?.name || post.author?.name || 'Unknown';
        const platform = post.platform || post.source || 'unknown';
        const engagement = post.interactions || post.engagement || 0;
        const timestamp = post.time ? new Date(post.time * 1000) : (post.created_at ? new Date(post.created_at) : new Date());
        const url = post.url || post.link || '';

        if (!text || text.trim() === '') return null;

        return { text: text.trim(), author, platform, engagement, timestamp, url };
      })
      .filter(post => post !== null);

    // Processa notícias
    const topNews = newsData.slice(0, 5)
      .map(news => {
        const title = news.title || news.headline || '';
        const source = news.source || news.publisher || 'Unknown';
        const url = news.url || news.link || '';
        const engagement = news.interactions || news.engagement || 0;
        const publishedAt = news.time ? new Date(news.time * 1000) : (news.published_at ? new Date(news.published_at) : new Date());

        if (!title || !url) return null;

        return { title: title.trim(), source, url, engagement, publishedAt };
      })
      .filter(news => news !== null);

    // Processa série temporal
    const timeSeries = timeSeriesData
      .map(point => {
        const timestamp = point.time ? new Date(point.time * 1000) : (point.timestamp ? new Date(point.timestamp) : null);
        
        if (!timestamp || isNaN(timestamp.getTime())) return null;

        return {
          timestamp,
          sentiment: point.sentiment || 50,
          interactions: point.interactions || 0,
          posts: point.posts || point.num_posts || 0
        };
      })
      .filter(point => point !== null);

    // Busca AI Report (pode demorar)
    let aiReport = null;
    let aiReportGeneratedAt = null;
    try {
      aiReport = await getTopicAIReport(tokenSymbol);
      aiReportGeneratedAt = new Date();
      console.log(`[Consumer] AI Report generated for ${tokenSymbol}`);
    } catch (error) {
      console.warn(`[Consumer] Could not generate AI report for ${tokenSymbol}:`, error.message);
    }

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
      { new: true, runValidators: true }
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
      callReference: callContext || {},
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

    console.log(`[Consumer] ✅ Completed: ${tokenSymbol} in ${Date.now() - startTime}ms`);
    return true;

  } catch (error) {
    console.error(`[Consumer] ❌ Failed: ${tokenSymbol}:`, error.message);
    
    // Atualiza status de erro no MongoDB
    await TokenNarrative.findByIdAndUpdate(narrativeId, {
      analysisStatus: 'failed',
      lastAnalysisError: error.message
    });

    return false;
  }
};

/**
 * Inicia consumer da fila com rate limiting
 */
export const startNarrativeConsumer = async () => {
  try {
    const channel = getChannel();
    
    if (!channel) {
      console.error('[Consumer] Channel not available, waiting...');
      setTimeout(startNarrativeConsumer, 5000);
      return;
    }

    console.log('[Consumer] 🚀 Starting with rate limit: 2 tokens/min (10 API req/min)');

    channel.consume(NARRATIVE_QUEUE, async (msg) => {
      if (!msg) return;

      // Controle de rate limiting
      const now = Date.now();
      const timeSinceLastProcess = now - lastProcessTime;

      if (timeSinceLastProcess < PROCESSING_INTERVAL) {
        const waitTime = PROCESSING_INTERVAL - timeSinceLastProcess;
        console.log(`[Consumer] ⏳ Rate limit: waiting ${Math.round(waitTime / 1000)}s...`);
        
        // Rejeita mensagem temporariamente (requeue)
        channel.nack(msg, false, true);
        
        // Aguarda antes de aceitar próxima mensagem
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return;
      }

      if (isProcessing) {
        console.log('[Consumer] ⏸️ Already processing, requeueing...');
        channel.nack(msg, false, true);
        return;
      }

      isProcessing = true;
      lastProcessTime = Date.now();

      try {
        const messageData = JSON.parse(msg.content.toString());
        const success = await processTokenFromQueue(messageData);

        if (success) {
          // Sucesso: remove da fila
          channel.ack(msg);
        } else {
          // Falhou: verifica retries
          const retries = (messageData.retries || 0) + 1;

          if (retries >= MAX_RETRIES) {
            console.warn(`[Consumer] ⚠️ Max retries reached for ${messageData.tokenSymbol}, sending to DLQ`);
            channel.nack(msg, false, false); // Vai para DLQ
          } else {
            console.log(`[Consumer] 🔄 Retry ${retries}/${MAX_RETRIES} for ${messageData.tokenSymbol}`);
            
            // Incrementa contador de retries e reenfileira
            messageData.retries = retries;
            channel.sendToQueue(
              NARRATIVE_QUEUE,
              Buffer.from(JSON.stringify(messageData)),
              { persistent: true }
            );
            
            channel.ack(msg); // Remove mensagem original
          }
        }
      } catch (error) {
        console.error('[Consumer] Error processing message:', error);
        channel.nack(msg, false, true); // Requeue on parse error
      } finally {
        isProcessing = false;
      }
    }, {
      noAck: false // Manual acknowledgment
    });

    console.log('[Consumer] ✅ Consumer started and listening');

  } catch (error) {
    console.error('[Consumer] Error starting consumer:', error);
    setTimeout(startNarrativeConsumer, 10000); // Retry após 10s
  }
};

// Helper functions (copiadas do narrativeService.js)
const extractPlatformSentiment = (topicData) => {
  const platforms = {
    twitter: { score: 50, volume: 0, mentions: 0 },
    reddit: { score: 50, volume: 0, mentions: 0 },
    youtube: { score: 50, volume: 0, mentions: 0 },
    telegram: { score: 50, volume: 0, mentions: 0 }
  };

  if (topicData.social_dominance) {
    const dominance = topicData.social_dominance;
    
    if (dominance.twitter) {
      platforms.twitter.volume = dominance.twitter * topicData.interactions_24h || 0;
      platforms.twitter.mentions = Math.round(dominance.twitter * topicData.num_posts || 0);
      platforms.twitter.score = Math.min(100, Math.round(dominance.twitter * 200));
    }
    
    if (dominance.reddit) {
      platforms.reddit.volume = dominance.reddit * topicData.interactions_24h || 0;
      platforms.reddit.mentions = Math.round(dominance.reddit * topicData.num_posts || 0);
      platforms.reddit.score = Math.min(100, Math.round(dominance.reddit * 200));
    }
  }

  return platforms;
};

const classifySentiment = (score) => {
  if (score >= 80) return 'very_positive';
  if (score >= 60) return 'positive';
  if (score >= 40) return 'neutral';
  if (score >= 20) return 'negative';
  return 'very_negative';
};

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

  return Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term, frequency]) => ({ term, frequency, sentiment: 50 }));
};

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

  return Object.entries(hashtags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));
};

export default { startNarrativeConsumer };
