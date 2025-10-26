import mongoose from 'mongoose';

/**
 * SentimentAnalysis
 * Armazena histórico detalhado de análises de sentimento por token
 * Cada análise representa um snapshot em um momento específico
 */
const sentimentAnalysisSchema = new mongoose.Schema({
  // Referência ao token
  tokenSymbol: { type: String, index: true, required: true },
  tokenAddress: { type: String, index: true, required: true },
  
  // Referência à narrativa principal
  narrativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TokenNarrative' },
  
  // Dados da análise
  analysisType: { 
    type: String, 
    enum: ['initial', 'update', 'scheduled'],
    default: 'initial'
  },
  
  // Scores de sentimento por plataforma
  platformSentiment: {
    twitter: {
      score: { type: Number, min: 0, max: 100 },
      volume: { type: Number, default: 0 },
      mentions: { type: Number, default: 0 }
    },
    reddit: {
      score: { type: Number, min: 0, max: 100 },
      volume: { type: Number, default: 0 },
      mentions: { type: Number, default: 0 }
    },
    youtube: {
      score: { type: Number, min: 0, max: 100 },
      volume: { type: Number, default: 0 },
      mentions: { type: Number, default: 0 }
    },
    telegram: {
      score: { type: Number, min: 0, max: 100 },
      volume: { type: Number, default: 0 },
      mentions: { type: Number, default: 0 }
    }
  },
  
  // Score geral de sentimento
  overallSentiment: {
    score: { type: Number, min: 0, max: 100 },
    classification: {
      type: String,
      enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']
    }
  },
  
  // Métricas de engajamento
  engagement: {
    total: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  
  // Palavras-chave e hashtags
  keywords: [{
    term: String,
    frequency: Number,
    sentiment: Number
  }],
  
  hashtags: [{
    tag: String,
    count: Number
  }],
  
  // Contexto da análise
  triggerSource: {
    type: String,
    enum: ['discord_call', 'scheduled_update', 'manual_request'],
    default: 'discord_call'
  },
  
  callReference: {
    messageId: String,
    channelId: String,
    timestamp: Date
  },
  
  // Comparação com análise anterior
  comparedToPrevious: {
    sentimentChange: { type: Number },
    engagementChange: { type: Number },
    volumeChange: { type: Number }
  },
  
  // Metadados da análise
  analysisMetadata: {
    dataSource: { type: String, default: 'LunarCrush' },
    apiVersion: { type: String, default: 'v4' },
    processingTime: { type: Number }, // ms
    confidence: { type: Number, min: 0, max: 100 }
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'partial', 'failed'],
    default: 'completed'
  },
  error: { type: String },
  
}, { timestamps: true });

// Índices para queries otimizadas
sentimentAnalysisSchema.index({ tokenAddress: 1, createdAt: -1 });
sentimentAnalysisSchema.index({ narrativeId: 1, createdAt: -1 });
sentimentAnalysisSchema.index({ 'overallSentiment.score': -1 });
sentimentAnalysisSchema.index({ 'engagement.total': -1 });
sentimentAnalysisSchema.index({ triggerSource: 1, createdAt: -1 });

// Virtual para classificação de sentimento
sentimentAnalysisSchema.virtual('sentimentLabel').get(function() {
  const score = this.overallSentiment.score;
  if (score >= 80) return 'Very Positive 😊';
  if (score >= 60) return 'Positive 🙂';
  if (score >= 40) return 'Neutral 😐';
  if (score >= 20) return 'Negative 😞';
  return 'Very Negative 😢';
});

export default mongoose.model('SentimentAnalysis', sentimentAnalysisSchema);
