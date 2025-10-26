# 🚀 Deployment Guide - Narrative & Sentiment Analysis System

## ✅ Pre-Deployment Checklist

### 1. Verificar Arquivos Criados
- [ ] `/src/models/TokenNarrative.js`
- [ ] `/src/models/SentimentAnalysis.js`
- [ ] `/src/services/lunarCrushService.js`
- [ ] `/src/services/narrativeService.js`
- [ ] `/src/controllers/narrativeController.js`
- [ ] `/src/routes/narrativeRoutes.js`
- [ ] `/src/services/messageService.js` (modificado)
- [ ] `/src/index.js` (modificado)
- [ ] `/.env` (modificado)

### 2. Verificar Dependências
Todas as dependências necessárias já devem estar instaladas:
```bash
# Verificar package.json
cat package.json | grep -E "express|mongoose|axios|dotenv"
```

Se necessário:
```bash
npm install express mongoose axios dotenv
```

### 3. Verificar MongoDB
```bash
# Testar conexão
mongo $MONGO_URI --eval "db.serverStatus()"

# Verificar collections (após primeiro uso)
mongo $MONGO_URI --eval "show collections"
# Deve mostrar: tokennarratives, sentimentanalyses
```

### 4. Verificar LunarCrush API Key
```bash
# Testar API key
curl https://lunarcrush.com/api/v4/coins/list/v1 \
  -H "Authorization: Bearer $LUNARCRUSH_API_KEY"

# Deve retornar JSON com lista de coins
```

## 🔧 Configuração

### 1. Variáveis de Ambiente
Editar `.env`:
```bash
# LunarCrush API
LUNARCRUSH_API_KEY=9rne3zn2iqa6bm273w6bxp9dz5mgsfwwv63mgiaj8

# MongoDB (já configurado)
MONGO_URI=mongodb+srv://discordUser:vitor12345@cluster0.qlbvk.mongodb.net/stratusMessages?retryWrites=true&w=majority

# Discord (já configurado)
TOKEN_DISCORD=...
CHANNEL_ID_1=...
CHANNEL_ID_2=...
...

# Servidor (já configurado)
PORT=8081
```

### 2. Índices MongoDB (Automático)
Os índices são criados automaticamente pelos schemas Mongoose. Para verificar:
```javascript
// TokenNarrative indexes
db.tokennarratives.getIndexes()
// Deve mostrar:
// - tokenSymbol_1_createdAt_-1
// - tokenAddress_1_updatedAt_-1
// - topicRank_1
// - sentimentScore_-1
// - socialMetrics.interactions_-1

// SentimentAnalysis indexes
db.sentimentanalyses.getIndexes()
// Deve mostrar:
// - tokenAddress_1_createdAt_-1
// - narrativeId_1_createdAt_-1
// - overallSentiment.score_-1
// - engagement.total_-1
// - triggerSource_1_createdAt_-1
```

## 🚀 Deploy Steps

### 1. Backup (Recomendado)
```bash
# Backup do código atual
cd /Users/vitorhrds/mnt/stratus-relayer
git add .
git commit -m "feat: add narrative and sentiment analysis system"
git push

# Backup do MongoDB
mongodump --uri=$MONGO_URI --out=./backup/$(date +%Y%m%d)
```

### 2. Verificar Sintaxe
```bash
# Verificar erros de sintaxe em todos arquivos novos
node --check src/models/TokenNarrative.js
node --check src/models/SentimentAnalysis.js
node --check src/services/lunarCrushService.js
node --check src/services/narrativeService.js
node --check src/controllers/narrativeController.js
node --check src/routes/narrativeRoutes.js

# Verificar arquivos modificados
node --check src/services/messageService.js
node --check src/index.js
```

### 3. Restart Servidor
```bash
# Parar servidor atual
pm2 stop stratus-relayer
# ou
pkill -f "node.*index.js"

# Reiniciar
pm2 start src/index.js --name stratus-relayer
# ou
npm start
# ou
node src/index.js
```

### 4. Verificar Logs
```bash
# PM2
pm2 logs stratus-relayer --lines 100

# Ou direto
tail -f logs/app.log

# Procurar por:
# - "Server running on port 8081"
# - Sem erros de import/require
# - Rotas registradas corretamente
```

### 5. Health Check
```bash
# 1. Verificar servidor
curl http://localhost:8081/api-docs

# 2. Verificar rotas de narrativa (requer auth)
curl http://localhost:8081/api/narrative/stats \
  -H "Authorization: Bearer $YOUR_TOKEN"

# Deve retornar JSON com estatísticas (pode estar vazio inicialmente)
```

## 🧪 Testes Pós-Deploy

### Teste 1: Criar Narrativa Manual
```bash
curl -X POST http://localhost:8081/api/narrative \
  -H "Authorization: Bearer $YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenSymbol": "SOL",
    "tokenAddress": "So11111111111111111111111111111111111111112"
  }'

# Expected: 201 Created
# Response: { "message": "Token call processed successfully", "data": {...} }
```

### Teste 2: Aguardar Processamento
```bash
# Aguardar 10 segundos
sleep 10

# Buscar narrativa
curl http://localhost:8081/api/narrative/So11111111111111111111111111111111111111112 \
  -H "Authorization: Bearer $YOUR_TOKEN"

# Expected: 200 OK
# Response: { "message": "Narrative retrieved successfully", "data": {...} }
# Verificar: analysisStatus === "completed" ou "failed"
```

### Teste 3: Verificar MongoDB
```bash
mongo $MONGO_URI <<EOF
use stratusMessages
db.tokennarratives.find({tokenSymbol: "SOL"}).pretty()
db.sentimentanalyses.find({tokenSymbol: "SOL"}).pretty()
EOF

# Deve mostrar documentos criados
```

### Teste 4: Teste Automático via Discord
1. Envie mensagem no Discord com token (ex: BONK)
2. Aguarde processamento (10-15s)
3. Verifique logs:
```bash
pm2 logs stratus-relayer | grep "Narrative"

# Expected:
# [Narrative] Processing call for token BONK
# [Narrative] Creating new narrative for BONK
# [Narrative] Starting analysis for BONK
# [Narrative] Analysis completed for BONK in 3500ms
```

### Teste 5: Buscar Estatísticas
```bash
curl http://localhost:8081/api/narrative/stats \
  -H "Authorization: Bearer $YOUR_TOKEN"

# Expected: JSON com contadores
# {
#   "total": 1,
#   "byStatus": {"completed": 1, "processing": 0, "failed": 0},
#   "averageSentiment": 65.5,
#   ...
# }
```

### Teste 6: Buscar Trending
```bash
curl http://localhost:8081/api/narrative/trending?limit=5 \
  -H "Authorization: Bearer $YOUR_TOKEN"

# Expected: Array de tokens
```

## 📊 Monitoramento

### 1. Logs a Monitorar
```bash
# Sucesso
[Narrative] Processing call for token BONK
[Narrative] Analysis completed for BONK in 3500ms

# Atenção
[Narrative] Could not generate AI report for BONK: timeout
# Não crítico, análise continua sem AI report

# Erro
[Narrative] Error processing token call for BONK: ...
[Narrative] Analysis failed for BONK: ...
# Verificar: lastAnalysisError na narrativa
```

### 2. Rate Limiting
```bash
# Monitor de rate limits
grep "Rate limit" logs/app.log

# Se aparecer:
# "Rate limit exceeded: Max 10 requests per minute"
# "Rate limit exceeded: Max 2000 requests per day"

# Ação: Aguardar reset ou implementar queue
```

### 3. MongoDB Disk Usage
```bash
mongo $MONGO_URI --eval "
  db.tokennarratives.stats().size / 1024 / 1024
  db.sentimentanalyses.stats().size / 1024 / 1024
"

# Tamanho estimado:
# - 1 TokenNarrative: ~5-10KB
# - 1 SentimentAnalysis: ~3-5KB
# - 1000 narrativas: ~5-10MB
# - 10000 análises: ~30-50MB
```

### 4. API Performance
```bash
# Tempo médio de resposta
grep "Analysis completed" logs/app.log | \
  awk -F'in ' '{print $2}' | \
  awk '{sum+=$1; n++} END {print sum/n "ms"}'

# Expected: 2000-5000ms
# Se > 10000ms: Verificar rate limits ou timeout
```

## 🔥 Troubleshooting

### Erro: "Cannot find module './routes/narrativeRoutes.js'"
**Causa:** Arquivo não foi criado ou caminho incorreto  
**Solução:**
```bash
ls -la src/routes/narrativeRoutes.js
# Se não existir, criar novamente
```

### Erro: "LUNARCRUSH_API_KEY is not defined"
**Causa:** Variável não configurada no .env  
**Solução:**
```bash
echo "LUNARCRUSH_API_KEY=9rne3zn2iqa6bm273w6bxp9dz5mgsfwwv63mgiaj8" >> .env
# Reiniciar servidor
```

### Erro: "Rate limit exceeded"
**Causa:** Muitas requisições em curto período  
**Solução:**
```bash
# Aguardar 1 minuto
sleep 60

# Ou implementar queue para processar em lote
```

### Erro: "No topic data found for TOKEN on LunarCrush"
**Causa:** Token não existe ou símbolo incorreto no LunarCrush  
**Solução:**
1. Verificar símbolo correto: https://lunarcrush.com/coins
2. Token pode ser muito novo
3. Usar outro token para teste (ex: SOL, BONK, WIF)

### Status "processing" por muito tempo
**Causa:** Análise travou ou timeout  
**Solução:**
```bash
# Forçar re-análise
curl -X POST http://localhost:8081/api/narrative/$TOKEN_ADDRESS/reanalyze \
  -H "Authorization: Bearer $YOUR_TOKEN"
```

### MongoDB Connection Error
**Causa:** MONGO_URI incorreto ou MongoDB offline  
**Solução:**
```bash
# Testar conexão
mongo $MONGO_URI --eval "db.serverStatus()"

# Verificar .env
cat .env | grep MONGO_URI
```

## 🔒 Segurança

### 1. API Key Protection
```bash
# Nunca commit API keys
grep -r "LUNARCRUSH_API_KEY" .git/
# Deve estar vazio

# Se acidentalmente commitado:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

### 2. Rate Limiting Adicional (Opcional)
Implementar rate limiting no Express para proteger endpoints:
```javascript
import rateLimit from 'express-rate-limit';

const narrativeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20 // 20 requests por minuto
});

app.use('/api/narrative', narrativeLimiter, narrativeRoutes);
```

### 3. Authentication
Todos endpoints já requerem `authenticateToken` middleware.
Verificar se JWT_SECRET está configurado:
```bash
cat .env | grep JWT_SECRET
```

## 📈 Performance Optimization

### 1. Índices MongoDB
Já configurados automaticamente. Para otimizar queries:
```javascript
// Queries mais comuns devem usar índices:
// ✅ Bom: tokennarratives.find({tokenAddress: "..."})
// ✅ Bom: tokennarratives.find({}).sort({sentimentScore: -1})
// ❌ Evitar: tokennarratives.find({lastAnalysisError: {$exists: true}})
```

### 2. Cache (Futuro)
Implementar Redis para cache de narrativas:
```javascript
// Pseudo-código
const cached = await redis.get(`narrative:${tokenAddress}`);
if (cached) return JSON.parse(cached);

const narrative = await TokenNarrative.findOne({tokenAddress});
await redis.setex(`narrative:${tokenAddress}`, 300, JSON.stringify(narrative));
```

### 3. Batch Processing (Futuro)
Processar múltiplas calls em lote:
```javascript
// Cron job a cada 5 minutos
// Busca todas narrativas com status "pending"
// Processa em lote respeitando rate limits
```

## 🎉 Success Indicators

Sistema está funcionando corretamente se:

✅ Servidor inicia sem erros  
✅ Rotas `/api/narrative/*` retornam 200/201  
✅ MongoDB collections criadas (tokennarratives, sentimentanalyses)  
✅ Logs mostram análises sendo completadas  
✅ Tokens detectados no Discord são processados automaticamente  
✅ Rate limiting funciona (não excede limites)  
✅ Swagger UI mostra endpoints de narrativa  
✅ Stats endpoint retorna dados válidos  

## 📞 Support

Se encontrar problemas:

1. **Verificar logs:**
```bash
pm2 logs stratus-relayer --lines 200 | grep -i error
```

2. **Verificar documentação:**
   - `docs/NARRATIVE_SENTIMENT_SYSTEM.md` - Documentação completa
   - `docs/NARRATIVE_QUICKSTART.md` - Guia rápido
   - `docs/IMPLEMENTATION_SUMMARY.md` - Sumário

3. **Executar testes:**
```bash
node examples/narrative-test.js
```

4. **Verificar API key:**
```bash
curl https://lunarcrush.com/api/v4/coins/list/v1 \
  -H "Authorization: Bearer $LUNARCRUSH_API_KEY"
```

## ✅ Post-Deploy Checklist

- [ ] Servidor reiniciado sem erros
- [ ] Health check passou
- [ ] Teste manual de criação passou
- [ ] Teste automático via Discord passou
- [ ] MongoDB collections criadas
- [ ] Logs não mostram erros críticos
- [ ] Stats endpoint retorna dados
- [ ] Swagger UI acessível
- [ ] Rate limiting funcionando
- [ ] Backup criado

**Deploy Status:** ✅ Ready for Production

---

**Last Updated:** 21 de Outubro de 2025  
**Version:** 1.0.0  
**Environment:** Production
