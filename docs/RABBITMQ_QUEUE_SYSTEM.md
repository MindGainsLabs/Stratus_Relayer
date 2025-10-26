# Sistema de Filas RabbitMQ - Narrative Analysis

## 📋 Resumo

Sistema de filas implementado para respeitar o rate limit da LunarCrush API (10 req/min) e garantir que nenhuma análise de token seja perdida.

## 🏗️ Arquitetura

```
Discord Message → processTokenCall() → RabbitMQ Queue → Consumer (2 tokens/min) → LunarCrush API
                                                              ↓
                                                      MongoDB (TokenNarrative)
```

## 📦 Componentes Criados

### 1. **queueService.js**
Gerencia conexão e operações com RabbitMQ:
- ✅ `connectRabbitMQ()` - Conecta ao RabbitMQ com reconexão automática
- ✅ `enqueueTokenAnalysis()` - Adiciona token na fila
- ✅ `getQueueStats()` - Estatísticas da fila
- ✅ `reprocessDLQ()` - Reprocessa mensagens que falharam
- ✅ `purgeQueue()` - Limpa fila (admin)

**Filas:**
- `narrative_analysis_queue` - Fila principal
- `narrative_analysis_dlq` - Dead Letter Queue (mensagens que falharam 3x)

### 2. **narrativeConsumer.js**
Consumer que processa tokens respeitando rate limit:
- ✅ Processa **2 tokens por minuto** (10 requisições / 5 endpoints = 2 tokens)
- ✅ Intervalo de **30 segundos** entre tokens
- ✅ Sistema de **retry automático** (3 tentativas)
- ✅ Mensagens que falham 3x vão para DLQ
- ✅ Manual acknowledgment (ACK/NACK)

### 3. **queueRoutes.js**
Endpoints REST para gerenciar filas:
- `GET /api/queue/stats` - Estatísticas (mensagens na fila, consumers, etc.)
- `POST /api/queue/reprocess-dlq` - Reprocessa mensagens da DLQ
- `POST /api/queue/purge` - Limpa fila (requer confirmação)

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
RABBITMQ_URL=amqp://admin:senha_forte_aqui@localhost:5672
```

### Dependências Instaladas
```bash
npm install amqplib
```

## 🚀 Como Funciona

### Fluxo de Processamento

1. **Token detectado no Discord**
   ```javascript
   processTokenCall({ tokenSymbol, tokenAddress, ... })
   ```

2. **Token adicionado à fila RabbitMQ**
   ```javascript
   enqueueTokenAnalysis({
     tokenSymbol: 'QUANTCAT',
     tokenAddress: '7xGFk...',
     narrativeId: '...',
     priority: 7 // Novos tokens têm prioridade maior
   })
   ```

3. **Consumer processa com rate limiting**
   - Aguarda 30s entre cada token
   - Faz 5 requisições LunarCrush (topic, timeSeries, posts, news, creators)
   - Total: 10 req/min ✅

4. **Se sucesso:**
   - Mensagem removida da fila (ACK)
   - TokenNarrative atualizado com `analysisStatus: 'completed'`

5. **Se falha:**
   - Retry automático (até 3x)
   - Após 3 falhas → vai para DLQ

### Rate Limiting

```javascript
// Configuração
const TOKENS_PER_MINUTE = 2;
const PROCESSING_INTERVAL = 30000; // 30 segundos

// Cada token faz 5 requisições
// 2 tokens/min × 5 req = 10 req/min ✅
```

## 📊 Monitoramento

### Ver Estatísticas da Fila
```bash
GET http://srv800316.hstgr.cloud:8081/api/queue/stats
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "mainQueue": {
    "name": "narrative_analysis_queue",
    "messageCount": 15,
    "consumerCount": 1
  },
  "deadLetterQueue": {
    "name": "narrative_analysis_dlq",
    "messageCount": 3
  },
  "status": "connected"
}
```

### Reprocessar DLQ
```bash
POST http://srv800316.hstgr.cloud:8081/api/queue/reprocess-dlq
Authorization: Bearer <token>
Content-Type: application/json

{
  "limit": 10
}
```

### Management UI (RabbitMQ)
Acesse: http://168.231.90.235:15672
- **Login:** admin
- **Senha:** senha_forte_aqui

## 🔄 Sistema de Retry

```
Tentativa 1 → Falha → Retry 1
              ↓
Tentativa 2 → Falha → Retry 2
              ↓
Tentativa 3 → Falha → DLQ (Dead Letter Queue)
```

Mensagens na DLQ podem ser reprocessadas manualmente via API.

## 🎯 Benefícios

✅ **Respeita Rate Limit:** 10 req/min garantido
✅ **Zero Perda:** Todas as análises são enfileiradas
✅ **Retry Automático:** 3 tentativas antes de desistir
✅ **Priorização:** Novos tokens processados primeiro
✅ **Fallback:** Se RabbitMQ falhar, processa diretamente
✅ **Monitoramento:** Estatísticas em tempo real
✅ **Escalável:** Pode adicionar mais consumers

## 📈 Performance Esperada

| Métrica | Valor |
|---------|-------|
| Tokens processados por minuto | 2 |
| Requisições LunarCrush por minuto | 10 |
| Tempo médio de processamento | ~20-30s por token |
| Taxa de sucesso (com retry) | ~95% |

## 🐛 Troubleshooting

### Fila crescendo muito?
```bash
# Ver estatísticas
GET /api/queue/stats

# Limpar fila (cuidado!)
POST /api/queue/purge
{
  "confirm": true
}
```

### Mensagens na DLQ?
```bash
# Reprocessar
POST /api/queue/reprocess-dlq
{
  "limit": 50
}
```

### RabbitMQ não conecta?
```bash
# Na VPS, verificar status
sudo systemctl status rabbitmq-server

# Reiniciar se necessário
sudo systemctl restart rabbitmq-server
```

## 🔐 Segurança

- ✅ Autenticação via Bearer token nos endpoints da API
- ✅ Conexão RabbitMQ com usuário/senha
- ✅ Mensagens persistentes (sobrevivem a restart)
- ✅ Dead Letter Queue para análise de falhas

## 📝 Logs

```
[RabbitMQ] ✅ Connected and queues configured
[Queue] ✅ Enqueued: QUANTCAT (7xGFkFTDyMqdVtzYhP7StaUN2ypaeZMxkgr6i6Wwpump)
[Consumer] 🚀 Starting with rate limit: 2 tokens/min (10 API req/min)
[Consumer] ⏳ Rate limit: waiting 30s...
[Consumer] 🔄 Processing: QUANTCAT (retry: 0/3)
[Consumer] ✅ Completed: QUANTCAT in 25431ms
```

---

**Sistema implementado com sucesso! 🎉**

Agora todas as análises de tokens são processadas de forma controlada, respeitando o rate limit da LunarCrush API e garantindo que nenhuma informação seja perdida.
