import mongoose from 'mongoose';

/**
 * TokenNarrative
 * Armazena análises de narrativa e sentimento de tokens usando LunarCrush API
 * Uma narrativa é gerada quando uma nova call é detectada no Discord
 * Se houver nova call do mesmo token, a row é atualizada
 */
const tokenNarrativeSchema = new mongoose.Schema({
  // Identificação do token
  tokenSymbol: { type: String, index: true, required: true },
  tokenAddress: { type: String, index: true, required: true, unique: true },
  
  // Referência à call que triggou a análise
  lastCallMessageId: { type: String },
  lastCallChannelId: { type: String },
  lastCallTimestamp: { type: Date },
  
  // Dados do tópico no LunarCrush
  topicId: { type: String },
  topicRank: { type: Number },
  
  // AI Report (markdown)
  aiReport: { type: String },
  aiReportGeneratedAt: { type: Date },
  
  // Métricas de sentimento
  sentimentScore: { type: Number, min: 0, max: 100 },
  sentimentBreakdown: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 }
  },
  
  // Métricas sociais agregadas
  socialMetrics: {
    interactions: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    contributors: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 }
  },
  
  // Trending indicators
  trending: {
    status: { type: String, enum: ['up', 'down', 'flat'], default: 'flat' },
    percentChange: { type: Number, default: 0 }
  },
  
  // Top creators/influencers
  topCreators: [{
    name: String,
    username: String,
    platform: String,
    followers: Number,
    influence_score: Number
  }],
  
  // Posts recentes com maior engajamento
  topPosts: [{
    text: String,
    author: String,
    platform: String,
    engagement: Number,
    timestamp: Date,
    url: String
  }],
  
  // Notícias relevantes
  topNews: [{
    title: String,
    source: String,
    url: String,
    engagement: Number,
    publishedAt: Date
  }],
  
  // Séries temporais (última semana)
  timeSeries: [{
    timestamp: Date,
    sentiment: Number,
    interactions: Number,
    posts: Number
  }],
  
  // Metadados
  totalCallsDetected: { type: Number, default: 1 },
  firstDetectedAt: { type: Date, default: Date.now },
  
  // Status da análise
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  lastAnalysisError: { type: String },
  
}, { timestamps: true });

// Índices compostos para queries eficientes
tokenNarrativeSchema.index({ tokenSymbol: 1, createdAt: -1 });
tokenNarrativeSchema.index({ tokenAddress: 1, updatedAt: -1 });
tokenNarrativeSchema.index({ 'topicRank': 1 });
tokenNarrativeSchema.index({ 'sentimentScore': -1 });
tokenNarrativeSchema.index({ 'socialMetrics.interactions': -1 });

export default mongoose.model('TokenNarrative', tokenNarrativeSchema);
