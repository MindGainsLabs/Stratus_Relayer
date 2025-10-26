# Token Narrative & Sentiment Analysis System

Sistema integrado de análise de sentimento e narrativa de tokens usando a API do LunarCrush, trigado automaticamente quando novas calls são detectadas no Discord.

## 📋 Visão Geral

O sistema monitora mensagens do Discord em busca de novas calls de tokens e automaticamente:
1. Detecta informações do token (símbolo, endereço, preço)
2. Cria ou atualiza uma narrativa no MongoDB
3. Busca dados completos do LunarCrush API
4. Gera análise de sentimento detalhada
5. Persiste histórico de análises

## 🗄️ Estrutura de Dados

### TokenNarrative Collection
Armazena a narrativa principal de cada token (única por `tokenAddress`):

```javascript
{
  tokenSymbol: "BONK",
  tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  
  // Referência à última call
  lastCallMessageId: "1234567890",
  lastCallChannelId: "1332431823170703421",
  lastCallTimestamp: ISODate("2025-10-21T10:30:00Z"),
  
  // Dados do LunarCrush
  topicId: "bonk",
  topicRank: 45,
  aiReport: "# BONK Analysis\n\n...", // Markdown do AI Report
  
  // Sentimento agregado
  sentimentScore: 72, // 0-100
  sentimentBreakdown: {
    positive: 60,
    neutral: 30,
    negative: 10
  },
  
  // Métricas sociais
  socialMetrics: {
    interactions: 125000,
    posts: 450,
    contributors: 89,
    engagementScore: 68
  },
  
  // Trending
  trending: {
    status: "up", // up, down, flat
    percentChange: 15.5
  },
  
  // Top creators/influencers
  topCreators: [
    {
      name: "Crypto Analyst",
      username: "cryptoanalyst",
      platform: "twitter",
      followers: 50000,
      influence_score: 85
    }
  ],
  
  // Posts recentes com maior engajamento
  topPosts: [
    {
      text: "BONK to the moon! 🚀",
      author: "trader123",
      platform: "twitter",
      engagement: 5000,
      timestamp: ISODate(),
      url: "https://twitter.com/..."
    }
  ],
  
  // Notícias relevantes
  topNews: [
    {
      title: "BONK surges 50% on new partnership",
      source: "CoinDesk",
      url: "https://...",
      engagement: 10000,
      publishedAt: ISODate()
    }
  ],
  
  // Série temporal (última semana)
  timeSeries: [
    {
      timestamp: ISODate(),
      sentiment: 70,
      interactions: 12000,
      posts: 45
    }
  ],
  
  // Metadados
  totalCallsDetected: 3,
  firstDetectedAt: ISODate(),
  analysisStatus: "completed", // pending, processing, completed, failed
  
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

### SentimentAnalysis Collection
Armazena histórico detalhado de cada análise:

```javascript
{
  tokenSymbol: "BONK",
  tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  narrativeId: ObjectId("..."),
  
  analysisType: "update", // initial, update, scheduled
  
  // Sentimento por plataforma
  platformSentiment: {
    twitter: { score: 75, volume: 80000, mentions: 300 },
    reddit: { score: 68, volume: 25000, mentions: 100 },
    youtube: { score: 70, volume: 15000, mentions: 30 },
    telegram: { score: 72, volume: 5000, mentions: 20 }
  },
  
  // Score geral
  overallSentiment: {
    score: 72,
    classification: "positive" // very_negative, negative, neutral, positive, very_positive
  },
  
  // Métricas de engajamento
  engagement: {
    total: 125000,
    likes: 50000,
    shares: 30000,
    comments: 25000,
    views: 20000
  },
  
  // Palavras-chave
  keywords: [
    { term: "moon", frequency: 45, sentiment: 80 },
    { term: "partnership", frequency: 30, sentiment: 75 }
  ],
  
  // Hashtags
  hashtags: [
    { tag: "#bonk", count: 200 },
    { tag: "#solana", count: 150 }
  ],
  
  // Contexto
  triggerSource: "discord_call",
  callReference: {
    messageId: "1234567890",
    channelId: "1332431823170703421",
    timestamp: ISODate()
  },
  
  // Comparação
  comparedToPrevious: {
    sentimentChange: +5.5,
    engagementChange: +15000,
    volumeChange: +50
  },
  
  // Metadados
  analysisMetadata: {
    dataSource: "LunarCrush",
    apiVersion: "v4",
    processingTime: 3500, // ms
    confidence: 85
  },
  
  status: "completed",
  createdAt: ISODate()
}
```

## 🔄 Fluxo de Funcionamento

### 1. Detecção Automática (messageService.js)
```javascript
// Quando uma mensagem do Discord é processada
const tokenInfo = extractTokenInfo(description);

if (tokenInfo && tokenInfo.tokenId) {
  // Extrai símbolo do token
  const symbolMatch = description.match(/\$([A-Z]{2,10})\b/);
  const tokenSymbol = symbolMatch ? symbolMatch[1] : 'UNKNOWN';
  
  // Trigger análise (não bloqueia)
  processTokenCall({
    tokenSymbol,
    tokenAddress: tokenInfo.tokenId,
    messageId: message.id,
    channelId: channelId,
    timestamp: new Date(message.timestamp)
  });
}
```

### 2. Processamento (narrativeService.js)
```javascript
// Verifica se já existe narrativa
let narrative = await TokenNarrative.findOne({ tokenAddress });

if (narrative) {
  // Atualiza call existente
  narrative.totalCallsDetected += 1;
  narrative.lastCallTimestamp = timestamp;
} else {
  // Cria nova narrativa
  narrative = new TokenNarrative({ ... });
}

// Inicia análise assíncrona
performTokenAnalysis(narrative._id, tokenSymbol, callContext);
```

### 3. Análise LunarCrush (lunarCrushService.js)
```javascript
// Busca dados completos (5 endpoints em paralelo)
const [topicData, timeSeries, posts, news, creators] = 
  await Promise.allSettled([
    getTopicData(tokenSymbol),
    getTopicTimeSeries(tokenSymbol, 7),
    getTopicPosts(tokenSymbol, 10),
    getTopicNews(tokenSymbol, 5),
    getTopicCreators(tokenSymbol, 10)
  ]);

// Calcula sentimento
const sentiment = calculateSentimentScore(topicData);

// Busca AI Report (pode demorar)
const aiReport = await getTopicAIReport(tokenSymbol);
```

### 4. Persistência
```javascript
// Atualiza narrativa
await TokenNarrative.findByIdAndUpdate(narrativeId, {
  sentimentScore: sentiment.score,
  socialMetrics,
  trending,
  topCreators,
  topPosts,
  topNews,
  timeSeries,
  aiReport,
  analysisStatus: 'completed'
});

// Cria registro de análise
const sentimentAnalysis = new SentimentAnalysis({
  tokenSymbol,
  tokenAddress,
  narrativeId,
  overallSentiment,
  platformSentiment,
  engagement,
  keywords,
  hashtags,
  comparedToPrevious
});

await sentimentAnalysis.save();
```

## 🌐 API Endpoints

### POST /api/narrative
Cria ou atualiza narrativa manualmente

**Request:**
```json
{
  "tokenSymbol": "BONK",
  "tokenAddress": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "messageId": "optional",
  "channelId": "optional"
}
```

**Response:**
```json
{
  "message": "Token call processed successfully",
  "data": {
    "narrativeId": "67123abc...",
    "isNew": true,
    "status": "processing"
  }
}
```

### GET /api/narrative/:tokenAddress
Busca narrativa de um token

**Response:**
```json
{
  "message": "Narrative retrieved successfully",
  "data": {
    "narrative": { ... },
    "recentAnalyses": [ ... ]
  }
}
```

### GET /api/narrative/search
Busca narrativas com filtros

**Query Params:**
- `tokenSymbol` - Filtro por símbolo (partial match)
- `minSentiment` / `maxSentiment` - Range de sentimento (0-100)
- `minRank` / `maxRank` - Range de ranking
- `status` - pending, processing, completed, failed
- `sortBy` - updatedAt, sentimentScore, topicRank, socialMetrics.interactions
- `sortOrder` - asc, desc
- `page` - Página (default: 1)
- `limit` - Resultados por página (default: 20)

### GET /api/narrative/stats
Estatísticas gerais

**Response:**
```json
{
  "data": {
    "total": 150,
    "byStatus": {
      "completed": 140,
      "processing": 5,
      "failed": 5
    },
    "averageSentiment": 65.5,
    "topBySentiment": [ ... ],
    "topByRank": [ ... ]
  }
}
```

### GET /api/narrative/trending
Tokens em alta

**Query Params:**
- `limit` - Número de resultados (default: 20)
- `metric` - interactions, sentimentScore, topicRank (default: interactions)

### POST /api/narrative/:tokenAddress/reanalyze
Força re-análise de um token

### GET /api/narrative/:tokenAddress/sentiment
Busca histórico de análises de sentimento

**Query Params:**
- `page` - Página (default: 1)
- `limit` - Resultados por página (default: 10)

### DELETE /api/narrative/:tokenAddress
Deleta narrativa e análises (admin)

## ⚙️ Configuração

### Variáveis de Ambiente (.env)
```bash
# LunarCrush API
LUNARCRUSH_API_KEY=your_api_key_here

# Discord
TOKEN_DISCORD=your_discord_token
CHANNEL_ID_1=channel_id_1
CHANNEL_ID_2=channel_id_2
...

# MongoDB
MONGO_URI=mongodb+srv://...

# Outros
PORT=8081
```

### Rate Limits (LunarCrush Individual Plan)
- **10 requisições/minuto**
- **2000 requisições/dia**

O sistema gerencia automaticamente os rate limits e lança erros se exceder.

## 🔍 Como Usar

### 1. Detecção Automática
O sistema detecta automaticamente quando:
- Uma mensagem no Discord contém informações de token
- O padrão é reconhecido pelo `extractTokenInfo()`
- É extraído o tokenAddress e (opcionalmente) o tokenSymbol

### 2. Consulta Manual
Use a API para consultar narrativas:

```bash
# Buscar narrativa de um token
curl -X GET "http://localhost:8081/api/narrative/DezXAZ8z..." \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buscar trending
curl -X GET "http://localhost:8081/api/narrative/trending?metric=sentimentScore&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Forçar re-análise
curl -X POST "http://localhost:8081/api/narrative/DezXAZ8z.../reanalyze" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Criar Narrativa Manual
```bash
curl -X POST "http://localhost:8081/api/narrative" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenSymbol": "BONK",
    "tokenAddress": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
  }'
```

## 📊 Cálculo de Sentimento

O score de sentimento (0-100) é calculado baseado em múltiplos fatores:

```javascript
const factors = {
  socialScore: data.social_score || 50,        // 30% peso
  galaxyScore: data.galaxy_score || 50,        // 25% peso
  altRank: 100 - data.alt_rank || 50,          // 20% peso (invertido)
  interactions: log(interactions) * 20,         // 15% peso (normalizado)
  contributors: log(contributors) * 25          // 10% peso (normalizado)
};

score = Σ (factor * weight)
```

**Classificação:**
- 80-100: Very Positive 😊
- 60-79: Positive 🙂
- 40-59: Neutral 😐
- 20-39: Negative 😞
- 0-19: Very Negative 😢

## 🔄 Update Logic

Quando uma nova call do mesmo token é detectada:

1. **Incrementa contador:** `totalCallsDetected += 1`
2. **Atualiza referências:** `lastCallMessageId`, `lastCallTimestamp`
3. **Re-executa análise:** Busca dados atualizados do LunarCrush
4. **Cria nova SentimentAnalysis:** Com `analysisType: 'update'`
5. **Compara com anterior:** Calcula deltas de sentimento e engajamento

## 🚨 Tratamento de Erros

### Token não encontrado no LunarCrush
```javascript
{
  analysisStatus: 'failed',
  lastAnalysisError: 'No topic data found for TOKEN on LunarCrush'
}
```

### Rate limit excedido
```javascript
{
  error: 'Rate limit exceeded: Max 10 requests per minute'
}
```

### Análise parcial
Se alguns endpoints do LunarCrush falharem, o sistema:
- Salva os dados disponíveis
- Registra erros no campo `errors[]`
- Define `status: 'completed'` (parcial)

## 📈 Monitoramento

### Logs importantes
```bash
[Narrative] Processing call for token BONK (DezXAZ8z...)
[Narrative] Creating new narrative for BONK
[Narrative] Starting analysis for BONK
[Narrative] AI Report generated for BONK
[Narrative] Analysis completed for BONK in 3500ms
```

### Verificar status
```bash
# Via API
GET /api/narrative/stats

# Via MongoDB
db.tokennarratives.aggregate([
  { $group: { 
    _id: "$analysisStatus", 
    count: { $sum: 1 } 
  }}
])
```

## 🎯 Casos de Uso

1. **Dashboard de Sentimento:** Mostrar tokens com melhor/pior sentimento
2. **Alertas de Trending:** Notificar quando token entra em alta
3. **Comparação Temporal:** Ver evolução de sentimento ao longo do tempo
4. **AI Reports:** Exibir análises completas geradas por IA
5. **Influencer Tracking:** Identificar criadores mais ativos por token
6. **News Aggregation:** Agregar notícias relevantes por token

## 🔐 Segurança

- Todos os endpoints requerem autenticação via `authenticateToken`
- API key do LunarCrush armazenada em variáveis de ambiente
- Rate limiting implementado para evitar abuse
- Validação de dados de entrada

## 📚 Referências

- [LunarCrush API v4 Docs](https://lunarcrush.com/developers/docs)
- [MongoDB Mongoose](https://mongoosejs.com/)
- [Express.js](https://expressjs.com/)
