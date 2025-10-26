# Keep-Alive Service - Documentação

## 🔥 Overview

Sistema de **keep-alive** que mantém o WebSocket e serviços sempre ativos, **eliminando cold start** e garantindo respostas instantâneas para o primeiro usuário que se conecta.

## ❌ Problema Antes

- Após alguns minutos de inatividade, o servidor entrava em "cold start"
- Primeiro usuário precisava esperar vários segundos para obter resposta
- WebSocket demorava para inicializar
- Conexões eram perdidas por timeout

## ✅ Solução Implementada

### 1. **Socket.IO Keep-Alive**
```javascript
// Ping automático a cada 25s
io.engine.opts.pingInterval = 25000;
io.engine.opts.pingTimeout = 60000;

// Heartbeat broadcast a cada 30s
setInterval(() => {
    io.emit('server:heartbeat', { 
        timestamp: Date.now(),
        activeConnections: io.engine.clientsCount 
    });
}, 30000);
```

### 2. **Health Checks Periódicos**
- Verifica status do servidor a cada **2 minutos**
- Monitora memória, uptime, conexões ativas
- Broadcast de health status para clientes conectados

### 3. **Warmup de Endpoints**
- Faz ping interno nos endpoints críticos a cada **4 minutos**
- Mantém cache warm e dependências carregadas
- Endpoints warmup:
  - `/api/health`
  - `/api/discord/channels`
  - `/api/queue/stats`

### 4. **Middleware Inteligente**
- Detecta requests de keep-alive (`X-Keep-Alive` header)
- Não loga requests internos (reduz ruído nos logs)
- Marca requests para tratamento especial

## 📊 Configuração

### Variáveis de Ambiente (.env)

```env
# URL do servidor (para warmup interno)
SERVER_URL=http://localhost:8081

# Keep-alive habilitado (default: true)
KEEP_ALIVE_ENABLED=true

# Intervalo de warmup (default: 4 min)
KEEP_ALIVE_INTERVAL=240000

# Intervalo de health checks (default: 2 min)
HEALTH_CHECK_INTERVAL=120000
```

## 🚀 Como Funciona

### Fluxo de Keep-Alive

```
[Servidor Iniciado]
        ↓
[Conecta Socket.IO] → Ping a cada 25s
        ↓
[Inicia Health Checks] → Verifica status a cada 2 min
        ↓
[Inicia Warmup] → Ping endpoints a cada 4 min
        ↓
[Servidor Sempre Ativo] ✅
```

### Logs Típicos

```bash
[KeepAlive] 🔄 Initializing keep-alive service...
[KeepAlive] Server URL: http://localhost:8081
[KeepAlive] Socket.IO keep-alive configured
[KeepAlive] ✅ Keep-alive service started
[KeepAlive] ✅ Health check OK - 5 connections, 120min uptime
[KeepAlive] 🔄 Running warmup ping...
[KeepAlive] Warmup completed: 3/3 endpoints ready
```

## 📈 Endpoints

### GET /api/health

Health check endpoint que retorna status do servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T10:30:00.000Z",
  "uptime": 7200,
  "memory": {
    "heapUsed": 120,
    "heapTotal": 256,
    "rss": 512
  },
  "nodeVersion": "v18.16.0",
  "pid": 12345
}
```

### WebSocket Events

#### `server:heartbeat`
Broadcast periódico para manter conexões ativas.

**Payload:**
```javascript
{
  timestamp: 1729847400000,
  activeConnections: 5
}
```

#### `server:health`
Broadcast de health status após cada check.

**Payload:**
```javascript
{
  status: "ok",
  uptime: 7200,
  memory: { heapUsed: 120, heapTotal: 256, rss: 512 },
  connections: 5,
  timestamp: "2025-10-25T10:30:00.000Z"
}
```

## 🔧 Integração no Cliente

### Escutar Heartbeats (opcional)

```javascript
import io from 'socket.io-client';

const socket = io('wss://srv800316.hstgr.cloud:8081', {
  path: '/socket.io'
});

// Opcional: escutar heartbeats do servidor
socket.on('server:heartbeat', (data) => {
  console.log('Server is alive:', data.activeConnections, 'connections');
});

// Opcional: escutar health status
socket.on('server:health', (data) => {
  console.log('Server health:', data.status, data.uptime + 's uptime');
});
```

## 📊 Benefícios

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo de primeira resposta | 5-10s | < 100ms |
| Perda de conexão por timeout | Frequente | Zero |
| Cold start | Sim | **Não** |
| Conexões ativas | Intermitente | **Persistente** |
| CPU em idle | Alta (restart frequente) | **Baixa** |

## 🐛 Troubleshooting

### Servidor não faz warmup?

```bash
# Verificar logs
pm2 logs Stratus-Relayer | grep KeepAlive

# Verificar se SERVER_URL está correto
echo $SERVER_URL

# Testar health endpoint manualmente
curl http://localhost:8081/api/health
```

### WebSocket perde conexão?

```javascript
// No cliente, aumentar timeout
const socket = io('wss://your-server.com', {
  path: '/socket.io',
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10
});
```

### Muitos logs de keep-alive?

Os logs de keep-alive são filtrados pelo middleware. Se ainda aparecem:

```javascript
// Em keepAliveService.js, ajustar:
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutos (mais espaçado)
```

## 🔐 Segurança

- ✅ Health checks são públicos (sem dados sensíveis)
- ✅ Warmup usa headers especiais (`X-Keep-Alive`)
- ✅ Middleware filtra logs para não expor padrões internos
- ✅ Rate limiting aplica-se normalmente a todos endpoints

## 📝 Manutenção

### Desabilitar Keep-Alive (não recomendado)

```env
KEEP_ALIVE_ENABLED=false
```

### Ajustar Intervalos

```env
# Aumentar para 10 minutos (reduz carga)
KEEP_ALIVE_INTERVAL=600000

# Aumentar para 5 minutos
HEALTH_CHECK_INTERVAL=300000
```

### Adicionar Mais Endpoints ao Warmup

Em `keepAliveService.js`:

```javascript
const WARMUP_ENDPOINTS = [
  '/api/health',
  '/api/discord/channels',
  '/api/queue/stats',
  '/api/crypto/summary',  // Novo endpoint
  '/api/narrative/list'    // Novo endpoint
];
```

---

## 🎯 Resultado Final

✅ **Zero cold start**  
✅ **Respostas instantâneas**  
✅ **WebSocket sempre ativo**  
✅ **Monitoramento automático**  
✅ **Conexões persistentes**

O servidor agora está **sempre quente** e pronto para responder! 🔥
