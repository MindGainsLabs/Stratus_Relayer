import ChannelCall from '../models/ChannelCall.js';
import WalletPerformance from '../models/WalletPerformance.js';
import { extractCallsFromMessages } from './callExtractionService.js';

/**
 * Calcula win-rate: wins / totalCalls (wins são calls com hit50PctGain true)
 */
export const calculateWinRate = async (channelId, timeframeHours = null) => {
  const match = { channelId };
  if (timeframeHours) {
    match.createdAt = { $gte: new Date(Date.now() - timeframeHours * 3600 * 1000) };
  }

  const agg = await ChannelCall.aggregate([
    { $match: match },
    { $group: { _id: '$channelId', total: { $sum: 1 }, wins: { $sum: { $cond: ['$hit50PctGain', 1, 0] } } } },
    { $project: { _id: 0, channelId: '$_id', total: 1, wins: 1, winRate: { $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$wins', '$total'] }] } } }
  ]);
  return agg[0] || { channelId, total: 0, wins: 0, winRate: 0 };
};

/**
 * Retorna a melhor call baseada em (highestPrice - entryPrice)/entryPrice em um intervalo.
 */
export const findBestCall = async (channelId, days = 1) => {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const calls = await ChannelCall.find({ channelId, createdAt: { $gte: since }, entryPrice: { $gt: 0 }, highestPrice: { $gt: 0 } })
    .sort({ createdAt: -1 })
    .lean();
  let best = null;
  for (const c of calls) {
    const peakGainPct = ((c.highestPrice - c.entryPrice) / c.entryPrice) * 100;
    if (!best || peakGainPct > best.peakGainPct) {
      best = { ...c, peakGainPct };
    }
  }
  return best;
};

/**
 * Retorna melhor call para 1D / 7D / 30D.
 */
export const bestCallsWindows = async (channelId) => {
  const [d1, d7, d30] = await Promise.all([
    findBestCall(channelId, 1),
    findBestCall(channelId, 7),
    findBestCall(channelId, 30)
  ]);
  return { last1d: d1, last7d: d7, last30d: d30 };
};

/**
 * Gera ranking de carteiras com base em calls associadas.
 * Considera priceSnapshots para calcular peakGainPct por call.
 */
export const buildWalletRanking = async (channelId) => {
  const calls = await ChannelCall.find({ channelId }).lean();
  const walletMap = new Map();

  for (const call of calls) {
    const peakGainPct = (call.entryPrice > 0 && call.highestPrice > 0)
      ? ((call.highestPrice - call.entryPrice) / call.entryPrice) * 100
      : 0;
    const win = peakGainPct >= 50;

    // placeholder: assume uma carteira por call (pode ser expandido depois vinculando carteiras reais)
    // future: extrair carteiras de mensagens quando disponível
    const walletAddress = call.authorId || 'unknown-author';
    const label = call.authorUsername || 'Unknown';
    if (!walletMap.has(walletAddress)) {
      walletMap.set(walletAddress, {
        walletAddress,
        walletLabel: label,
        callsCount: 0,
        wins: 0,
        losses: 0,
        totalPeakGainPct: 0,
        totalEntry: 0,
        peakGainSamples: 0,
        holdTimeMinutesSamples: 0,
        totalHoldTimeMinutes: 0
      });
    }
    const w = walletMap.get(walletAddress);
    w.callsCount += 1;
    if (win) w.wins += 1; else w.losses += 1;
    if (peakGainPct > 0) {
      w.totalPeakGainPct += peakGainPct;
      w.peakGainSamples += 1;
    }
    if (call.entryPrice) w.totalEntry += call.entryPrice;
    // hold time: diferença entre agora e createdAt (placeholder, até termos close event)
    if (call.createdAt) {
      const holdMinutes = (Date.now() - new Date(call.createdAt).getTime()) / 60000;
      w.totalHoldTimeMinutes += holdMinutes;
      w.holdTimeMinutesSamples += 1;
    }
  }

  const ranking = [];
  for (const w of walletMap.values()) {
    const winRate = w.callsCount > 0 ? w.wins / w.callsCount : 0;
    ranking.push({
      walletAddress: w.walletAddress,
      walletLabel: w.walletLabel,
      callsCount: w.callsCount,
      wins: w.wins,
      losses: w.losses,
      winRate,
      averagePeakGainPct: w.peakGainSamples > 0 ? w.totalPeakGainPct / w.peakGainSamples : 0,
      averageEntryPrice: w.callsCount > 0 ? w.totalEntry / w.callsCount : 0,
      averageHoldTimeMinutes: w.holdTimeMinutesSamples > 0 ? w.totalHoldTimeMinutes / w.holdTimeMinutesSamples : 0
    });
  }

  ranking.sort((a, b) => b.winRate - a.winRate || b.averagePeakGainPct - a.averagePeakGainPct);

  return ranking;
};

/**
 * Recalcula e persiste ranking de carteiras em WalletPerformance.
 */
export const persistWalletRanking = async (channelId) => {
  const ranking = await buildWalletRanking(channelId);
  for (const r of ranking) {
    const winBuckets = {
      gte200: 0,
      gte100: 0,
      gte50: 0,
      lt50: 0
    };
    // buckets deriváveis se necessário no futuro

    await WalletPerformance.findOneAndUpdate(
      { channelId, walletAddress: r.walletAddress },
      {
        channelId,
        walletAddress: r.walletAddress,
        walletLabel: r.walletLabel,
        callsCount: r.callsCount,
        wins: r.wins,
        losses: r.losses,
        winRate: r.winRate,
        averagePeakGainPct: r.averagePeakGainPct,
        averageEntryPrice: r.averageEntryPrice,
        averageHoldTimeMinutes: r.averageHoldTimeMinutes,
        lastUpdated: new Date(),
        gainBuckets: winBuckets
      },
      { upsert: true, new: true }
    );
  }
  return ranking;
};

/**
 * Retorna estatísticas completas de um canal.
 */
export const getChannelStats = async (channelId) => {
  // Se não há calls ainda, tenta extrair a partir das mensagens recentes
  const existingCount = await ChannelCall.countDocuments({ channelId });
  if (existingCount === 0) {
    await extractCallsFromMessages({ channelIds: [channelId], hours: 72, limit: 1000 });
  }
  const [overall, bestWindows, walletTop] = await Promise.all([
    calculateWinRate(channelId),
    bestCallsWindows(channelId),
    buildWalletRanking(channelId)
  ]);

  return {
    channelId,
    winRate: overall.winRate,
    totalCalls: overall.total,
    wins: overall.wins,
    bestCalls: bestWindows,
    walletRanking: walletTop.slice(0, 50),
    top3: walletTop.slice(0, 3)
  };
};
