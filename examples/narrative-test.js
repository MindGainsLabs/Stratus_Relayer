/**
 * Testes de exemplo para o sistema de Narrative & Sentiment Analysis
 * Execute com: node examples/narrative-test.js
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Substituir com token válido

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Teste 1: Criar uma nova narrativa manualmente
 */
const testCreateNarrative = async () => {
  console.log('\n📝 Teste 1: Criar narrativa para BONK');
  
  try {
    const response = await api.post('/narrative', {
      tokenSymbol: 'BONK',
      tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      messageId: 'test-message-001',
      channelId: 'test-channel-001'
    });
    
    console.log('✅ Narrativa criada:', response.data);
    return response.data.data.narrativeId;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Teste 2: Buscar narrativa de um token
 */
const testGetNarrative = async (tokenAddress) => {
  console.log('\n🔍 Teste 2: Buscar narrativa');
  
  try {
    const response = await api.get(`/narrative/${tokenAddress}`);
    
    const { narrative, recentAnalyses } = response.data.data;
    
    console.log('✅ Narrativa encontrada:');
    console.log('  - Token:', narrative.tokenSymbol);
    console.log('  - Sentiment Score:', narrative.sentimentScore);
    console.log('  - Topic Rank:', narrative.topicRank);
    console.log('  - Interactions:', narrative.socialMetrics.interactions);
    console.log('  - Trending:', narrative.trending.status, `(${narrative.trending.percentChange}%)`);
    console.log('  - Total Calls:', narrative.totalCallsDetected);
    console.log('  - Status:', narrative.analysisStatus);
    console.log('  - Análises recentes:', recentAnalyses.length);
    
    if (narrative.aiReport) {
      console.log('  - AI Report:', narrative.aiReport.substring(0, 100) + '...');
    }
    
    return narrative;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Teste 3: Buscar narrativas com filtros
 */
const testSearchNarratives = async () => {
  console.log('\n🔎 Teste 3: Buscar narrativas com filtros');
  
  try {
    const response = await api.get('/narrative/search', {
      params: {
        minSentiment: 60,
        status: 'completed',
        sortBy: 'sentimentScore',
        sortOrder: 'desc',
        limit: 5
      }
    });
    
    const { data, pagination } = response.data;
    
    console.log(`✅ Encontradas ${data.length} narrativas:`);
    data.forEach((narrative, index) => {
      console.log(`  ${index + 1}. ${narrative.tokenSymbol} - Score: ${narrative.sentimentScore}`);
    });
    
    console.log('  Pagination:', pagination);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Teste 4: Buscar estatísticas gerais
 */
const testGetStats = async () => {
  console.log('\n📊 Teste 4: Estatísticas gerais');
  
  try {
    const response = await api.get('/narrative/stats');
    
    const { data } = response.data;
    
    console.log('✅ Estatísticas:');
    console.log('  - Total de narrativas:', data.total);
    console.log('  - Completas:', data.byStatus.completed);
    console.log('  - Processando:', data.byStatus.processing);
    console.log('  - Falhas:', data.byStatus.failed);
    console.log('  - Sentiment médio:', data.averageSentiment.toFixed(2));
    
    console.log('\n  Top 3 por sentimento:');
    data.topBySentiment.slice(0, 3).forEach((token, index) => {
      console.log(`    ${index + 1}. ${token.tokenSymbol} - ${token.sentimentScore}`);
    });
    
    console.log('\n  Top 3 por ranking:');
    data.topByRank.slice(0, 3).forEach((token, index) => {
      console.log(`    ${index + 1}. ${token.tokenSymbol} - Rank #${token.topicRank}`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Teste 5: Buscar tokens trending
 */
const testGetTrending = async () => {
  console.log('\n🔥 Teste 5: Tokens trending');
  
  try {
    const response = await api.get('/narrative/trending', {
      params: {
        metric: 'sentimentScore',
        limit: 10
      }
    });
    
    const { data, sortedBy } = response.data;
    
    console.log(`✅ Top 10 trending (${sortedBy}):`);
    data.forEach((token, index) => {
      const emoji = token.trending.status === 'up' ? '📈' : 
                    token.trending.status === 'down' ? '📉' : '➡️';
      console.log(`  ${index + 1}. ${emoji} ${token.tokenSymbol} - Score: ${token.sentimentScore}`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Teste 6: Buscar histórico de análises de sentimento
 */
const testGetSentimentHistory = async (tokenAddress) => {
  console.log('\n📈 Teste 6: Histórico de análises');
  
  try {
    const response = await api.get(`/narrative/${tokenAddress}/sentiment`, {
      params: {
        limit: 5
      }
    });
    
    const { data, pagination } = response.data;
    
    console.log(`✅ Últimas ${data.length} análises:`);
    data.forEach((analysis, index) => {
      console.log(`  ${index + 1}. ${analysis.createdAt}`);
      console.log(`     - Type: ${analysis.analysisType}`);
      console.log(`     - Score: ${analysis.overallSentiment.score} (${analysis.overallSentiment.classification})`);
      console.log(`     - Engagement: ${analysis.engagement.total}`);
      console.log(`     - Processing time: ${analysis.analysisMetadata.processingTime}ms`);
      
      if (analysis.comparedToPrevious?.sentimentChange) {
        const change = analysis.comparedToPrevious.sentimentChange;
        const arrow = change > 0 ? '⬆️' : change < 0 ? '⬇️' : '➡️';
        console.log(`     - Change: ${arrow} ${change > 0 ? '+' : ''}${change.toFixed(2)}`);
      }
    });
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Teste 7: Forçar re-análise
 */
const testReanalyze = async (tokenAddress) => {
  console.log('\n🔄 Teste 7: Forçar re-análise');
  
  try {
    const response = await api.post(`/narrative/${tokenAddress}/reanalyze`);
    
    console.log('✅ Re-análise iniciada:', response.data);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Teste 8: Atualizar narrativa existente (simula nova call)
 */
const testUpdateNarrative = async () => {
  console.log('\n🔄 Teste 8: Atualizar narrativa existente');
  
  try {
    const response = await api.post('/narrative', {
      tokenSymbol: 'BONK',
      tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      messageId: 'test-message-002',
      channelId: 'test-channel-001'
    });
    
    console.log('✅ Narrativa atualizada:', response.data);
    console.log('  - Is New:', response.data.data.isNew);
    console.log('  - Status:', response.data.data.status);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
};

/**
 * Executa todos os testes em sequência
 */
const runAllTests = async () => {
  console.log('🚀 Iniciando testes do sistema de Narrative & Sentiment Analysis\n');
  console.log('⚠️  Certifique-se de ter configurado:');
  console.log('  - LUNARCRUSH_API_KEY no .env');
  console.log('  - AUTH_TOKEN válido neste arquivo');
  console.log('  - Servidor rodando em http://localhost:8081\n');
  
  const tokenAddress = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'; // BONK
  
  try {
    // Teste 1: Criar narrativa
    await testCreateNarrative();
    
    // Aguarda processamento (análise é assíncrona)
    console.log('\n⏳ Aguardando processamento (10s)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Teste 2: Buscar narrativa
    await testGetNarrative(tokenAddress);
    
    // Teste 3: Buscar com filtros
    await testSearchNarratives();
    
    // Teste 4: Estatísticas
    await testGetStats();
    
    // Teste 5: Trending
    await testGetTrending();
    
    // Teste 6: Histórico de sentimento
    await testGetSentimentHistory(tokenAddress);
    
    // Teste 7: Re-análise
    await testReanalyze(tokenAddress);
    
    // Aguarda re-análise
    console.log('\n⏳ Aguardando re-análise (10s)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Teste 8: Atualizar narrativa
    await testUpdateNarrative();
    
    console.log('\n✅ Todos os testes concluídos!');
    
  } catch (error) {
    console.error('\n❌ Erro durante testes:', error.message);
  }
};

// Executa testes se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testCreateNarrative,
  testGetNarrative,
  testSearchNarratives,
  testGetStats,
  testGetTrending,
  testGetSentimentHistory,
  testReanalyze,
  testUpdateNarrative
};
