# 📚 Narrative & Sentiment Analysis - Complete Implementation

## 🎯 Overview

Sistema completo de análise de sentimento e narrativa de tokens Solana usando a API do LunarCrush. 

**Trigger automático:** Quando uma nova call de token é detectada no Discord, o sistema automaticamente:
1. Extrai informações do token
2. Cria ou atualiza narrativa no MongoDB
3. Busca dados completos do LunarCrush
4. Calcula score de sentimento
5. Gera AI Report
6. Persiste histórico de análises

## 📁 Arquivos Implementados

### 🗄️ Models (`src/models/`)
- **TokenNarrative.js** - Schema principal de narrativa (unique por tokenAddress)
- **SentimentAnalysis.js** - Schema de histórico de análises

### 🔧 Services (`src/services/`)
- **lunarCrushService.js** - Integração completa com LunarCrush API v4
  - Rate limiting automático (10 req/min, 2000 req/dia)
  - Todos endpoints necessários
  - Cálculo de sentiment score
  
- **narrativeService.js** - Lógica de negócio
  - processTokenCall() - Cria/atualiza narrativa
  - performTokenAnalysis() - Análise completa assíncrona
  - getTokenNarrative() - Busca narrativa
  - searchNarratives() - Busca com filtros
  - reanalyzeToken() - Força re-análise
  
- **messageService.js** (modificado) - Trigger automático
  - Detecta tokens em mensagens do Discord
  - Chama processTokenCall() automaticamente

### 🎮 Controllers (`src/controllers/`)
- **narrativeController.js** - 8 endpoints implementados
  - Create/Update narrative
  - Get narrative
  - Search narratives
  - Get stats
  - Get trending
  - Reanalyze
  - Get sentiment history
  - Delete narrative

### 🛣️ Routes (`src/routes/`)
- **narrativeRoutes.js** - Router completo
  - Swagger documentation
  - Autenticação em todos endpoints
  - Validação de parâmetros

### 📖 Documentation (`docs/`)
1. **NARRATIVE_SENTIMENT_SYSTEM.md** - Documentação completa (2500+ linhas)
   - Estrutura de dados detalhada
   - Fluxo de funcionamento
   - API endpoints com exemplos
   - Cálculo de sentimento
   - Casos de uso
   - Troubleshooting

2. **NARRATIVE_QUICKSTART.md** - Guia rápido de uso
   - Setup rápido
   - Exemplos de uso
   - Features principais
   - Erros comuns

3. **IMPLEMENTATION_SUMMARY.md** - Sumário de implementação
   - Checklist completo
   - Arquivos criados/modificados
   - Status do projeto
   - Próximos passos

### 🧪 Examples (`examples/`)
- **narrative-test.js** - Suite completa de testes
  - 8 testes de exemplo
  - Cobertura de todos endpoints
  - Instruções de execução

### ⚙️ Configuration
- **.env** (modificado) - Adicionada LUNARCRUSH_API_KEY
- **src/index.js** (modificado) - Rotas registradas

## 🚀 Quick Start

### 1. Configuração
```bash
# 1. Adicionar ao .env
LUNARCRUSH_API_KEY=9rne3zn2iqa6bm273w6bxp9dz5mgsfwwv63mgiaj8

# 2. Instalar dependências (se necessário)
npm install

# 3. Reiniciar servidor
npm start
```

### 2. Uso Automático
Envie uma mensagem no Discord com informações de token. O sistema detectará e processará automaticamente.

### 3. Uso Manual via API
```bash
# Criar narrativa
curl -X POST http://localhost:8081/api/narrative \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tokenSymbol":"BONK","tokenAddress":"DezXAZ8z7Pnrn..."}'

# Buscar narrativa
curl http://localhost:8081/api/narrative/DezXAZ8z7Pnrn... \
  -H "Authorization: Bearer YOUR_TOKEN"

# Ver trending
curl http://localhost:8081/api/narrative/trending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 API Endpoints

Base: `http://localhost:8081/api/narrative`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/` | Criar/atualizar narrativa |
| GET | `/:tokenAddress` | Buscar narrativa |
| GET | `/search` | Buscar com filtros |
| GET | `/stats` | Estatísticas gerais |
| GET | `/trending` | Tokens trending |
| POST | `/:tokenAddress/reanalyze` | Forçar re-análise |
| GET | `/:tokenAddress/sentiment` | Histórico de análises |
| DELETE | `/:tokenAddress` | Deletar narrativa |

**Autenticação:** Todos endpoints requerem `Authorization: Bearer TOKEN`

## 📚 Documentação

### Para começar:
1. **Quick Start:** `docs/NARRATIVE_QUICKSTART.md`
   - Guia rápido de 5 minutos
   - Exemplos práticos

### Para entender o sistema:
2. **Documentação Completa:** `docs/NARRATIVE_SENTIMENT_SYSTEM.md`
   - Estrutura detalhada de dados
   - Fluxo de funcionamento
   - Cálculos e algoritmos
   - Casos de uso

### Para testar:
3. **Suite de Testes:** `examples/narrative-test.js`
   - Execute: `node examples/narrative-test.js`
   - 8 testes cobrindo todos endpoints

### Para desenvolver:
4. **Implementation Summary:** `docs/IMPLEMENTATION_SUMMARY.md`
   - O que foi implementado
   - Como funciona
   - Próximos passos

## ✨ Features Principais

✅ **Auto-trigger** - Detecta tokens no Discord automaticamente  
✅ **Smart Update** - Atualiza ao invés de duplicar  
✅ **Análise Completa** - 5 endpoints do LunarCrush em paralelo  
✅ **AI Reports** - Análise gerada por IA em markdown  
✅ **Sentiment Score** - Cálculo ponderado multi-fatorial (0-100)  
✅ **Platform Breakdown** - Twitter, Reddit, YouTube, Telegram  
✅ **Time Series** - Histórico de 7 dias  
✅ **Top Content** - Creators, posts, news com maior engajamento  
✅ **Trending Detection** - Identifica tokens em alta  
✅ **Historical Analysis** - Preserva todas análises  
✅ **Rate Limiting** - Gerenciamento automático  
✅ **Error Handling** - Análise parcial se endpoints falharem  
✅ **Swagger Docs** - Documentação automática da API  
✅ **Autenticação** - JWT em todos endpoints  

## 🗄️ MongoDB Collections

### TokenNarrative
- **Propósito:** Narrativa principal de cada token
- **Unique Key:** tokenAddress
- **Dados:** Sentimento, métricas sociais, trending, creators, posts, news, AI report
- **Update:** Quando nova call é detectada

### SentimentAnalysis
- **Propósito:** Histórico de análises
- **Relação:** Múltiplas por token (narrativeId)
- **Dados:** Platform sentiment, engagement, keywords, hashtags, comparação
- **Criação:** Cada análise (initial, update, scheduled)

## 🔄 Fluxo de Dados

```
Discord Message → extractTokenInfo() → Token?
                                         ↓ Yes
                                   processTokenCall()
                                         ↓
                         Exists? → Yes → Update + totalCalls++
                             ↓ No
                         Create new narrative
                                         ↓
                              performTokenAnalysis() (async)
                                         ↓
                    ┌────────────────────┴────────────────────┐
                    ↓                    ↓                     ↓
            Topic Data          Time Series              Posts/News
                    ↓                    ↓                     ↓
                  Creators          AI Report           Sentiment Calc
                    └────────────────────┬────────────────────┘
                                         ↓
                           Update TokenNarrative
                                         ↓
                          Create SentimentAnalysis
                                         ↓
                                      Done ✅
```

## 🧪 Testing

### Teste Automático
1. Configure Discord bot
2. Envie mensagem com token
3. Sistema detecta e processa automaticamente

### Teste Manual
```bash
# 1. Editar AUTH_TOKEN em examples/narrative-test.js
# 2. Executar
node examples/narrative-test.js

# Output esperado:
# ✅ Narrativa criada
# ✅ Narrativa encontrada
# ✅ Estatísticas
# ✅ Trending tokens
# ✅ Histórico de análises
# etc.
```

### Verificar Status
```bash
# Via API
curl http://localhost:8081/api/narrative/stats \
  -H "Authorization: Bearer TOKEN"

# Via MongoDB
mongo
> use stratusMessages
> db.tokennarratives.find({}).count()
> db.sentimentanalyses.find({}).count()
```

## 🎯 Casos de Uso

### 1. Dashboard de Sentimento
Mostrar tokens com melhor/pior sentimento em tempo real
```javascript
const response = await fetch('/api/narrative/search?sortBy=sentimentScore&sortOrder=desc&limit=10');
```

### 2. Alertas de Trending
Notificar quando token entra em alta
```javascript
const response = await fetch('/api/narrative/trending?metric=sentimentScore');
// Filter: trending.status === 'up' && sentimentScore > 70
```

### 3. Análise Comparativa
Ver evolução de sentimento ao longo do tempo
```javascript
const response = await fetch(`/api/narrative/${address}/sentiment?limit=30`);
// Chart: comparedToPrevious.sentimentChange over time
```

### 4. AI Reports
Exibir análises completas geradas por IA
```javascript
import marked from 'marked';
const { narrative } = await fetch(`/api/narrative/${address}`).then(r => r.json());
const html = marked.parse(narrative.aiReport);
```

### 5. Influencer Tracking
Identificar criadores mais ativos
```javascript
const { narrative } = await fetch(`/api/narrative/${address}`).then(r => r.json());
// Display: narrative.topCreators (sorted by influence_score)
```

## ⚠️ Importante

### Rate Limits
- **LunarCrush Individual Plan:** 10 req/min, 2000 req/dia
- **Gerenciado automaticamente** pelo sistema
- Análise completa usa ~5-6 requisições

### Análise Assíncrona
- `processTokenCall()` retorna imediatamente
- Análise real pode demorar 3-10 segundos
- Check status via `narrative.analysisStatus`

### Símbolos vs Endereços
- **LunarCrush** busca por símbolo (ex: "BONK")
- **MongoDB** indexa por tokenAddress (único)
- Sistema extrai ambos da mensagem

## 🐛 Troubleshooting

### Token não encontrado
```javascript
{
  analysisStatus: 'failed',
  lastAnalysisError: 'No topic data found for TOKEN on LunarCrush'
}
```
**Solução:** Verificar se token existe no LunarCrush

### Rate limit excedido
```javascript
{
  error: 'Rate limit exceeded: Max 10 requests per minute'
}
```
**Solução:** Aguardar 1 minuto ou implementar queue

### Análise não completa
- Check `narrative.analysisStatus`
- Se 'processing' por muito tempo, check logs
- Se 'failed', ver `narrative.lastAnalysisError`

## 📈 Próximos Passos

- [ ] Cron job para atualização periódica
- [ ] Webhook/SSE para notificar análise completa
- [ ] Dashboard frontend
- [ ] Cache de dados
- [ ] Métricas de performance
- [ ] Sistema de alertas
- [ ] Suporte a batch processing
- [ ] Relatórios agregados por categoria

## 📞 Suporte

- **Documentação Completa:** `docs/NARRATIVE_SENTIMENT_SYSTEM.md`
- **Quick Start:** `docs/NARRATIVE_QUICKSTART.md`
- **Testes:** `examples/narrative-test.js`
- **Swagger UI:** `http://localhost:8081/api-docs`

## ✅ Status

**Implementação:** ✅ 100% Completa  
**Documentação:** ✅ 100% Completa  
**Testes:** ✅ Suite de exemplos pronta  
**Integração:** ✅ Totalmente integrado  

**Pronto para produção!** 🚀

---

**Última atualização:** 21 de Outubro de 2025  
**Versão:** 1.0.0  
**API:** LunarCrush v4
