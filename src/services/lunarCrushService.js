import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const LUNARCRUSH_API_KEY = process.env.LUNARCRUSH_API_KEY || '';
const LUNARCRUSH_BASE_URL = 'https://lunarcrush.com/api4/public';

// Rate limiting configuration (Individual Plan: 10 req/min, 2000/day)
const RATE_LIMIT = {
  requestsPerMinute: 10,
  requestsPerDay: 2000,
  currentMinute: new Date().getMinutes(),
  currentDay: new Date().getDate(),
  minuteCount: 0,
  dayCount: 0
};

/**
 * Verifica e gerencia rate limiting
 */
const checkRateLimit = () => {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDate();

  // Reset contador de minuto
  if (currentMinute !== RATE_LIMIT.currentMinute) {
    RATE_LIMIT.currentMinute = currentMinute;
    RATE_LIMIT.minuteCount = 0;
  }

  // Reset contador de dia
  if (currentDay !== RATE_LIMIT.currentDay) {
    RATE_LIMIT.currentDay = currentDay;
    RATE_LIMIT.dayCount = 0;
  }

  // Verifica limites
  if (RATE_LIMIT.minuteCount >= RATE_LIMIT.requestsPerMinute) {
    throw new Error('Rate limit exceeded: Max 10 requests per minute');
  }

  if (RATE_LIMIT.dayCount >= RATE_LIMIT.requestsPerDay) {
    throw new Error('Rate limit exceeded: Max 2000 requests per day');
  }

  // Incrementa contadores
  RATE_LIMIT.minuteCount++;
  RATE_LIMIT.dayCount++;
};

/**
 * Faz requisição à API do LunarCrush
 */
const makeRequest = async (endpoint, params = {}) => {
  checkRateLimit();

  try {
    const url = `${LUNARCRUSH_BASE_URL}${endpoint}`;
    console.log(`[LunarCrush] Request: ${url}`, params);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${LUNARCRUSH_API_KEY}`,
        'Accept': 'application/json'
      },
      params,
      timeout: 10000
    });

    console.log(`[LunarCrush] Response status: ${response.status}`);
    
    // A resposta da API v4 tem estrutura: { data: [...] } ou { data: {...} }
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`LunarCrush API Error: ${error.response.status}`, error.response.data);
      throw new Error(`LunarCrush API Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      console.error('LunarCrush API: No response received', error.message);
      throw new Error('LunarCrush API: No response received');
    } else {
      console.error('LunarCrush API Request Error:', error.message);
      throw error;
    }
  }
};

/**
 * Busca dados detalhados de um tópico/token
 * Tenta primeiro com symbol, se falhar usa address como fallback
 * @param {string} topic - Token symbol ou address
 * @param {string} fallbackTopic - Topic alternativo (opcional)
 * @returns {Promise<Object>}
 */
export const getTopicData = async (topic, fallbackTopic = null) => {
  try {
    // Primeira tentativa com o topic fornecido
    const normalizedTopic = topic.toLowerCase();
    const data = await makeRequest(`/topic/${normalizedTopic}/v1`);
    
    // Verifica se retornou dados válidos
    if (!data || !data.data) {
      throw new Error(`No data returned for topic: ${topic}`);
    }
    
    console.log(`[LunarCrush] ✅ Found data using: ${topic}`);
    return data;
  } catch (error) {
    // Se houver fallback e o erro não for de rate limit, tenta com fallback
    if (fallbackTopic && !error.message.includes('Rate limit')) {
      console.warn(`[LunarCrush] ⚠️ Failed with ${topic}, trying fallback: ${fallbackTopic}`);
      try {
        const normalizedFallback = fallbackTopic.toLowerCase();
        const data = await makeRequest(`/topic/${normalizedFallback}/v1`);
        
        if (!data || !data.data) {
          throw new Error(`No data returned for fallback topic: ${fallbackTopic}`);
        }
        
        console.log(`[LunarCrush] ✅ Found data using fallback: ${fallbackTopic}`);
        return data;
      } catch (fallbackError) {
        console.error(`[LunarCrush] ❌ Both attempts failed for ${topic}:`, fallbackError.message);
        throw fallbackError;
      }
    }
    
    console.error(`Error fetching topic data for ${topic}:`, error.message);
    throw error;
  }
};

/**
 * Busca série temporal de um tópico (última semana)
 * NOTA: Time-series não disponível no Individual Plan (retorna 402)
 * @param {string} topic - Token symbol ou address
 * @param {number} days - Número de dias (padrão: 7)
 * @param {string} fallbackTopic - Topic alternativo (opcional)
 * @returns {Promise<Object>}
 */
export const getTopicTimeSeries = async (topic, days = 7, fallbackTopic = null) => {
  try {
    const normalizedTopic = topic.toLowerCase();
    const data = await makeRequest(`/topic/${normalizedTopic}/time-series/v1`, {
      interval: '1d',
      data_points: days
    });
    return data;
  } catch (error) {
    // Time-series não disponível no plano Individual
    if (error.message.includes('402')) {
      console.warn(`Time series not available for Individual Plan (402)`);
      return { data: [] }; // Retorna vazio ao invés de falhar
    }
    
    // Tenta fallback se disponível
    if (fallbackTopic && !error.message.includes('Rate limit')) {
      try {
        const normalizedFallback = fallbackTopic.toLowerCase();
        const data = await makeRequest(`/topic/${normalizedFallback}/time-series/v1`, {
          interval: '1d',
          data_points: days
        });
        return data;
      } catch (fallbackError) {
        if (fallbackError.message.includes('402')) {
          return { data: [] };
        }
      }
    }
    
    console.error(`Error fetching time series for ${topic}:`, error.message);
    return { data: [] }; // Retorna vazio ao invés de falhar completamente
  }
};

/**
 * Busca top posts de um tópico
 * @param {string} topic - Token symbol ou address
 * @param {number} limit - Número de posts (padrão: 10)
 * @param {string} fallbackTopic - Topic alternativo (opcional)
 * @returns {Promise<Object>}
 */
export const getTopicPosts = async (topic, limit = 10, fallbackTopic = null) => {
  try {
    const normalizedTopic = topic.toLowerCase();
    const data = await makeRequest(`/topic/${normalizedTopic}/posts/v1`, {
      limit
    });
    return data || { data: [] };
  } catch (error) {
    // Tenta fallback se disponível
    if (fallbackTopic && !error.message.includes('Rate limit')) {
      try {
        const normalizedFallback = fallbackTopic.toLowerCase();
        const data = await makeRequest(`/topic/${normalizedFallback}/posts/v1`, {
          limit
        });
        return data || { data: [] };
      } catch (fallbackError) {
        console.error(`Error fetching posts (fallback) for ${fallbackTopic}:`, fallbackError.message);
      }
    }
    
    console.error(`Error fetching posts for ${topic}:`, error.message);
    return { data: [] }; // Retorna vazio ao invés de falhar
  }
};

/**
 * Busca notícias relevantes de um tópico
 * @param {string} topic - Token symbol ou address
 * @param {number} limit - Número de notícias (padrão: 5)
 * @param {string} fallbackTopic - Topic alternativo (opcional)
 * @returns {Promise<Object>}
 */
export const getTopicNews = async (topic, limit = 5, fallbackTopic = null) => {
  try {
    const normalizedTopic = topic.toLowerCase();
    const data = await makeRequest(`/topic/${normalizedTopic}/news/v1`, {
      limit
    });
    return data || { data: [] };
  } catch (error) {
    // Tenta fallback se disponível
    if (fallbackTopic && !error.message.includes('Rate limit')) {
      try {
        const normalizedFallback = fallbackTopic.toLowerCase();
        const data = await makeRequest(`/topic/${normalizedFallback}/news/v1`, {
          limit
        });
        return data || { data: [] };
      } catch (fallbackError) {
        console.error(`Error fetching news (fallback) for ${fallbackTopic}:`, fallbackError.message);
      }
    }
    
    console.error(`Error fetching news for ${topic}:`, error.message);
    return { data: [] }; // Retorna vazio ao invés de falhar
  }
};

/**
 * Busca top creators/influencers de um tópico
 * @param {string} topic - Token symbol ou address
 * @param {number} limit - Número de creators (padrão: 10)
 * @param {string} fallbackTopic - Topic alternativo (opcional)
 * @returns {Promise<Object>}
 */
export const getTopicCreators = async (topic, limit = 10, fallbackTopic = null) => {
  try {
    const normalizedTopic = topic.toLowerCase();
    const data = await makeRequest(`/topic/${normalizedTopic}/creators/v1`, {
      limit
    });
    return data || { data: [] };
  } catch (error) {
    // Tenta fallback se disponível
    if (fallbackTopic && !error.message.includes('Rate limit')) {
      try {
        const normalizedFallback = fallbackTopic.toLowerCase();
        const data = await makeRequest(`/topic/${normalizedFallback}/creators/v1`, {
          limit
        });
        return data || { data: [] };
      } catch (fallbackError) {
        console.error(`Error fetching creators (fallback) for ${fallbackTopic}:`, fallbackError.message);
      }
    }
    
    console.error(`Error fetching creators for ${topic}:`, error.message);
    return { data: [] }; // Retorna vazio ao invés de falhar
  }
};

/**
 * Busca AI Report de um tópico
 * @param {string} topic - Nome ou símbolo do token
 * @returns {Promise<string>} - Markdown report
 */
export const getTopicAIReport = async (topic) => {
  try {
    const response = await axios.get(`https://lunarcrush.ai/topic/${topic}`, {
      headers: {
        'Authorization': `Bearer ${LUNARCRUSH_API_KEY}`,
        'Accept': 'application/json, text/markdown, text/plain'
      },
      timeout: 15000
    });

    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      return JSON.stringify(response.data, null, 2);
    } else if (contentType.includes('text/markdown') || contentType.includes('text/plain')) {
      return response.data;
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching AI report for ${topic}:`, error.message);
    throw error;
  }
};

/**
 * Busca lista de trending topics
 * @param {number} limit - Número de topics (padrão: 20)
 * @returns {Promise<Object>}
 */
export const getTrendingTopics = async (limit = 20) => {
  try {
    const data = await makeRequest('/topics/list/v1', {
      limit,
      sort: 'rank'
    });
    return data;
  } catch (error) {
    console.error('Error fetching trending topics:', error.message);
    throw error;
  }
};

/**
 * Análise completa de um token
 * Tenta primeiro com tokenSymbol, fallback para tokenAddress
 * @param {string} primaryTopic - Token symbol (tentativa primária)
 * @param {string} fallbackTopic - Token address (fallback)
 * @returns {Promise<Object>}
 */
export const getCompleteTokenAnalysis = async (primaryTopic, fallbackTopic = null) => {
  try {
    console.log(`Starting complete analysis for token: ${primaryTopic}${fallbackTopic ? ` (fallback: ${fallbackTopic})` : ''}`);

    // Executa todas as requisições em paralelo com Promise.allSettled
    // para que falhas individuais não quebrem toda a análise
    const [topic, timeSeries, posts, news, creators] = await Promise.allSettled([
      getTopicData(primaryTopic, fallbackTopic),
      getTopicTimeSeries(primaryTopic, 7, fallbackTopic),
      getTopicPosts(primaryTopic, 10, fallbackTopic),
      getTopicNews(primaryTopic, 5, fallbackTopic),
      getTopicCreators(primaryTopic, 10, fallbackTopic)
    ]);

    return {
      topic: topic.status === 'fulfilled' ? topic.value : null,
      timeSeries: timeSeries.status === 'fulfilled' ? timeSeries.value : { data: [] },
      posts: posts.status === 'fulfilled' ? posts.value : { data: [] },
      news: news.status === 'fulfilled' ? news.value : { data: [] },
      creators: creators.status === 'fulfilled' ? creators.value : { data: [] }
    };
  } catch (error) {
    console.error(`Error in complete token analysis for ${primaryTopic}:`, error.message);
    throw error;
  }
};/**
 * Calcula score de sentimento baseado nos dados do LunarCrush
 * Baseado no código TypeScript que funciona
 * @param {Object} topicData - Dados do tópico do LunarCrush
 * @returns {Object}
 */
export const calculateSentimentScore = (topicData) => {
  if (!topicData || !topicData.data) {
    return {
      score: 50, // neutro por padrão
      breakdown: { positive: 33.33, neutral: 33.33, negative: 33.33 }
    };
  }

  const data = topicData.data;
  
  // Usar sentiment direto se disponível (API v4 já calcula)
  if (data.sentiment !== undefined && data.sentiment !== null) {
    const sentiment = Math.round(data.sentiment);
    let breakdown;
    
    if (sentiment >= 70) {
      breakdown = { positive: 70, neutral: 20, negative: 10 };
    } else if (sentiment >= 60) {
      breakdown = { positive: 60, neutral: 30, negative: 10 };
    } else if (sentiment >= 50) {
      breakdown = { positive: 40, neutral: 40, negative: 20 };
    } else if (sentiment >= 40) {
      breakdown = { positive: 30, neutral: 40, negative: 30 };
    } else {
      breakdown = { positive: 20, neutral: 30, negative: 50 };
    }
    
    return {
      score: sentiment,
      breakdown
    };
  }
  
  // Fallback: Calcula baseado em interactions e contributors
  const interactions = data.interactions_24h || data.num_posts || 0;
  const contributors = data.num_contributors || 0;
  const topicRank = data.topic_rank || 999;
  
  // Score baseado em normalização
  const normalizedInteractions = Math.min(100, Math.log10(interactions + 1) * 20);
  const normalizedContributors = Math.min(100, Math.log10(contributors + 1) * 25);
  const normalizedRank = Math.max(0, 100 - (topicRank / 10)); // Rank menor = melhor
  
  const score = Math.round(
    (normalizedInteractions * 0.4) +
    (normalizedContributors * 0.3) +
    (normalizedRank * 0.3)
  );
  
  let breakdown;
  if (score >= 70) {
    breakdown = { positive: 70, neutral: 20, negative: 10 };
  } else if (score >= 60) {
    breakdown = { positive: 60, neutral: 30, negative: 10 };
  } else if (score >= 50) {
    breakdown = { positive: 40, neutral: 40, negative: 20 };
  } else if (score >= 40) {
    breakdown = { positive: 30, neutral: 40, negative: 30 };
  } else {
    breakdown = { positive: 20, neutral: 30, negative: 50 };
  }

  return {
    score,
    breakdown
  };
};

/**
 * Extrai trending status dos dados do tópico
 * @param {Object} topicData - Dados do tópico
 * @returns {Object}
 */
export const extractTrendingStatus = (topicData) => {
  if (!topicData || !topicData.data) {
    return { status: 'flat', percentChange: 0 };
  }

  const data = topicData.data;
  const percentChange = data.percent_change_24h || 0;

  let status = 'flat';
  if (percentChange > 5) status = 'up';
  else if (percentChange < -5) status = 'down';

  return {
    status,
    percentChange: Math.round(percentChange * 100) / 100
  };
};

export default {
  getTopicData,
  getTopicTimeSeries,
  getTopicPosts,
  getTopicNews,
  getTopicCreators,
  getTopicAIReport,
  getTrendingTopics,
  getCompleteTokenAnalysis,
  calculateSentimentScore,
  extractTrendingStatus
};
