import mongoose from 'mongoose';

/**
 * WalletPerformance
 * Armazena métricas agregadas de uma carteira dentro de um canal específico.
 * Usado para ranking de carteiras por canal.
 */
const walletPerformanceSchema = new mongoose.Schema({
  channelId: { type: String, index: true, required: true },
  channelName: { type: String },
  walletAddress: { type: String, index: true },
  walletLabel: { type: String },
  callsCount: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 }, // wins / callsCount
  averagePeakGainPct: { type: Number, default: 0 },
  averageEntryPrice: { type: Number, default: 0 },
  averageHoldTimeMinutes: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  // distribuição opcional
  gainBuckets: {
    gte50: { type: Number, default: 0 },
    gte100: { type: Number, default: 0 },
    gte200: { type: Number, default: 0 },
    lt50: { type: Number, default: 0 }
  }
}, { timestamps: true });

walletPerformanceSchema.index({ channelId: 1, winRate: -1 });
walletPerformanceSchema.index({ channelId: 1, averagePeakGainPct: -1 });

export default mongoose.model('WalletPerformance', walletPerformanceSchema);
