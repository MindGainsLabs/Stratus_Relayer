import mongoose from 'mongoose';
import ChannelCall from '../../src/models/ChannelCall.js';
import { calculateWinRate, buildWalletRanking } from '../../src/services/channelStatsService.js';

describe('channelStatsService', () => {
  beforeAll(async () => {
    const uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/stratus_stats_test';
    await mongoose.connect(uri, { dbName: 'stats_test' });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await ChannelCall.deleteMany({});
  });

  test('calculateWinRate empty channel', async () => {
    const res = await calculateWinRate('chan1');
    expect(res.total).toBe(0);
    expect(res.winRate).toBe(0);
  });

  test('calculateWinRate with wins and losses', async () => {
    await ChannelCall.create([
      { channelId: 'c1', entryPrice: 1, highestPrice: 1.6, hit50PctGain: true },
      { channelId: 'c1', entryPrice: 2, highestPrice: 2.2, hit50PctGain: false },
      { channelId: 'c1', entryPrice: 3, highestPrice: 5, hit50PctGain: true }
    ]);
    const res = await calculateWinRate('c1');
    expect(res.total).toBe(3);
    expect(res.wins).toBe(2);
    expect(res.winRate).toBeCloseTo(2/3, 5);
  });

  test('buildWalletRanking basic', async () => {
    await ChannelCall.create([
      { channelId: 'c2', authorId: 'w1', authorUsername: 'A', entryPrice: 1, highestPrice: 1.6, hit50PctGain: true },
      { channelId: 'c2', authorId: 'w1', authorUsername: 'A', entryPrice: 2, highestPrice: 2.1 },
      { channelId: 'c2', authorId: 'w2', authorUsername: 'B', entryPrice: 1, highestPrice: 1.2 }
    ]);
    const ranking = await buildWalletRanking('c2');
    expect(ranking.length).toBe(2);
    const w1 = ranking.find(r => r.walletAddress === 'w1');
    expect(w1.callsCount).toBe(2);
    expect(w1.wins).toBe(1);
  });
});
