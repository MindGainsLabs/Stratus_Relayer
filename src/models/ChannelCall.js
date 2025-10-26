import mongoose from 'mongoose';

/**
 * ChannelCall
 * Representa uma call de compra publicada em um canal do Discord.
 * Uma call descreve o ativo, preço de entrada (se conhecido), horário, autor e métricas de desempenho.
 * Critério de WIN: se em qualquer momento o preço atingir +50% sobre o entryPrice.
 */
const channelCallSchema = new mongoose.Schema({
  channelId: { type: String, index: true, required: true },
  channelName: { type: String },
  messageId: { type: String, index: true },
  tokenSymbol: { type: String, index: true },
  tokenAddress: { type: String, index: true },
  entryPrice: { type: Number }, // preço no momento da call
  highestPrice: { type: Number, default: 0 }, // maior preço observado após a call
  lowestPrice: { type: Number, default: 0 },
  // percentGainAtual = ((currentPrice - entryPrice)/entryPrice)*100 calculado on-the-fly em services
  hit50PctGain: { type: Boolean, default: false },
  authorId: { type: String },
  authorUsername: { type: String },
  tags: [{ type: String, index: true }],
  // snapshots de preços (timestamp, price) para futura análise
  priceSnapshots: [{
    at: { type: Date, default: Date.now },
    price: Number
  }],
  // métricas derivadas
  winCriteria: { type: String, default: 'peak >= 1.5 * entry' },
  bestWindow: {
    last1d: { type: Number, default: 0 },
    last7d: { type: Number, default: 0 },
    last30d: { type: Number, default: 0 }
  },
  // timestamps
}, { timestamps: true });

channelCallSchema.index({ channelId: 1, createdAt: -1 });
channelCallSchema.index({ tokenAddress: 1, createdAt: -1 });

export default mongoose.model('ChannelCall', channelCallSchema);
