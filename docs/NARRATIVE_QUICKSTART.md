# 🚀 Quick Start: Narrative & Sentiment Analysis

Sistema automático de análise de sentimento de tokens usando LunarCrush API, trigado por calls no Discord.

## ⚡ Funcionamento Rápido

1. **Mensagem detectada no Discord** → Extrai `tokenAddress` e `tokenSymbol`
2. **Cria/Atualiza TokenNarrative** → MongoDB
3. **Busca dados no LunarCrush** → 5 endpoints em paralelo
4. **Calcula sentimento** → Score 0-100
5. **Gera AI Report** → Markdown formatado
6. **Salva SentimentAnalysis** → Histórico completo

## 📦 Collections MongoDB

### TokenNarrative
- **Uma por token** (unique: tokenAddress)
- Narrativa agregada com dados mais recentes
- Inclui: sentiment, metrics, creators, posts, news, timeSeries

### SentimentAnalysis
- **Múltiplas por token** (histórico)
- Snapshot de cada análise
- Comparação com análise anterior

## 🔌 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/narrative` | Criar/atualizar narrativa |
| GET | `/api/narrative/:tokenAddress` | Buscar narrativa |
| GET | `/api/narrative/search` | Buscar com filtros |
| GET | `/api/narrative/stats` | Estatísticas gerais |
| GET | `/api/narrative/trending` | Tokens em alta |
| POST | `/api/narrative/:tokenAddress/reanalyze` | Forçar re-análise |
| GET | `/api/narrative/:tokenAddress/sentiment` | Histórico de análises |
| DELETE | `/api/narrative/:tokenAddress` | Deletar narrativa |

## 🔧 Setup

1. **Adicione ao .env:**
```bash
LUNARCRUSH_API_KEY=your_api_key_here
```

2. **Importar em index.js:**
```javascript
import narrativeRoutes from './routes/narrativeRoutes.js';
app.use('/api/narrative', narrativeRoutes);
```

3. **Já está integrado!** 
   - messageService.js já chama `processTokenCall()` automaticamente

## 📊 Exemplo de Uso

```bash
# Buscar narrativa
curl http://localhost:8081/api/narrative/DezXAZ8z7Pnrn... \
  -H "Authorization: Bearer TOKEN"

# Buscar trending por sentimento
curl http://localhost:8081/api/narrative/trending?metric=sentimentScore \
  -H "Authorization: Bearer TOKEN"

# Forçar análise manual
curl -X POST http://localhost:8081/api/narrative \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tokenSymbol":"BONK","tokenAddress":"DezXAZ..."}'
```

## 🎯 Features Principais

✅ **Auto-trigger** quando token detectado no Discord  
✅ **Update automático** se mesma call aparecer novamente  
✅ **Rate limiting** (10/min, 2000/dia)  
✅ **AI Reports** com markdown formatado  
✅ **Sentiment Score** 0-100 multi-fatorial  
✅ **Platform breakdown** (Twitter, Reddit, YouTube, Telegram)  
✅ **Time series** última semana  
✅ **Top creators** e influencers  
✅ **Top posts** por engajamento  
✅ **Trending news** agregadas  
✅ **Histórico completo** de análises  

## 🔍 Dados Coletados

### Do LunarCrush:
- Sentiment score e breakdown
- Social metrics (interactions, posts, contributors)
- Trending status (up/down/flat)
- Top creators/influencers
- Posts com maior engajamento
- Notícias relevantes
- Série temporal (7 dias)
- AI Report (análise completa em markdown)

### Calculado:
- Score de sentimento ponderado
- Comparação com análise anterior
- Keywords e hashtags extraídos
- Classificação de sentimento
- Platform sentiment scores

## 📈 Score de Sentimento

```
Score = (
  socialScore * 0.30 +
  galaxyScore * 0.25 +
  altRank * 0.20 +        # invertido: menor rank = melhor
  interactions * 0.15 +   # normalizado log
  contributors * 0.10     # normalizado log
)
```

**Classificação:**
- 80-100: Very Positive 😊
- 60-79: Positive 🙂
- 40-59: Neutral 😐
- 20-39: Negative 😞
- 0-19: Very Negative 😢

## ⚠️ Rate Limits

**LunarCrush Individual Plan:**
- 10 requisições/minuto
- 2000 requisições/dia

**Gerenciado automaticamente** pelo `lunarCrushService.js`

## 🔄 Update Logic

Quando **mesma call** é detectada:
1. Incrementa `totalCallsDetected`
2. Atualiza `lastCallTimestamp`
3. Re-executa análise completa
4. Cria novo `SentimentAnalysis` com tipo `update`
5. Calcula `comparedToPrevious` (deltas)

## 🚨 Erros Comuns

**Token não encontrado:**
```
analysisStatus: 'failed'
lastAnalysisError: 'No topic data found for TOKEN'
```

**Rate limit:**
```
error: 'Rate limit exceeded: Max 10 requests per minute'
```

**Análise parcial:**
- Salva dados disponíveis
- Status: 'completed'
- Campo `errors[]` com falhas

## 📝 Logs

```bash
[Narrative] Processing call for token BONK (DezXAZ8z...)
[Narrative] Creating new narrative for BONK
[Narrative] Starting analysis for BONK
[Narrative] AI Report generated for BONK
[Narrative] Analysis completed for BONK in 3500ms
```

## 🎨 Frontend Integration

### Exemplo: Card de Token
```javascript
const response = await fetch(`/api/narrative/${tokenAddress}`);
const { narrative, recentAnalyses } = response.data;

// Mostrar sentimento
const sentiment = narrative.sentimentScore;
const emoji = sentiment >= 80 ? '😊' : 
              sentiment >= 60 ? '🙂' : 
              sentiment >= 40 ? '😐' : 
              sentiment >= 20 ? '😞' : '😢';

// Mostrar trending
const trend = narrative.trending.status; // 'up', 'down', 'flat'
const icon = trend === 'up' ? '📈' : 
             trend === 'down' ? '📉' : '➡️';

// Mostrar AI Report (markdown)
import marked from 'marked';
const html = marked.parse(narrative.aiReport);
```

## 🔐 Auth Required

Todos endpoints requerem:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 📚 Documentação Completa

Ver: `/docs/NARRATIVE_SENTIMENT_SYSTEM.md`

---

**Status:** ✅ Implementado e integrado  
**Testado:** Aguardando testes em produção  
**API Version:** v1.0  
**LunarCrush API:** v4
