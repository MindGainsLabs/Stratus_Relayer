/**
 * Keep-Alive Service
 * Mantém WebSocket e serviços sempre ativos, evitando cold start
 */

import axios from 'axios';

const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000; // 4 minutos
const HEALTH_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutos
const WARMUP_ENDPOINTS = [
  '/api/health',
  '/api/discord/channels',
  '/api/queue/stats'
];

let keepAliveTimer = null;
let healthCheckTimer = null;
let io = null;
let serverUrl = null;

/**
 * Inicializa keep-alive service
 * @param {Object} socketIO - Instância do Socket.IO
 * @param {string} baseUrl - URL base do servidor (ex: http://localhost:8081)
 */
export const initializeKeepAlive = (socketIO, baseUrl) => {
  io = socketIO;
  serverUrl = baseUrl || `http://localhost:${process.env.PORT || 8081}`;

  console.log('[KeepAlive] 🔄 Initializing keep-alive service...');
  console.log(`[KeepAlive] Server URL: ${serverUrl}`);

  // Configurar Socket.IO keep-alive
  setupSocketKeepAlive();

  // Iniciar health checks periódicos
  startHealthChecks();

  // Iniciar ping interno dos endpoints
  startInternalPing();

  // Warmup inicial
  warmupEndpoints();

  console.log('[KeepAlive] ✅ Keep-alive service started');
};

/**
 * Configura keep-alive no Socket.IO
 */
const setupSocketKeepAlive = () => {
  if (!io) return;

  // Configurações de keep-alive do Socket.IO
  io.engine.on('connection', (socket) => {
    // Aumentar timeout de inatividade
    socket.transport.on('packet', () => {
      socket.transport.discard();
    });
  });

  // Ping automático a cada 25s (padrão é 25s)
  io.engine.opts.pingInterval = 25000;
  io.engine.opts.pingTimeout = 60000;

  // Broadcast periódico para manter conexões ativas
  setInterval(() => {
    io.emit('server:heartbeat', { 
      timestamp: Date.now(),
      activeConnections: io.engine.clientsCount 
    });
  }, 30000); // A cada 30s

  console.log('[KeepAlive] Socket.IO keep-alive configured');
};

/**
 * Health checks periódicos
 */
const startHealthChecks = () => {
  healthCheckTimer = setInterval(async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/health`, {
        timeout: 5000,
        headers: { 'User-Agent': 'KeepAlive-HealthCheck' }
      });

      const stats = {
        status: response.data.status,
        uptime: response.data.uptime,
        memory: response.data.memory,
        connections: io ? io.engine.clientsCount : 0,
        timestamp: new Date().toISOString()
      };

      console.log(`[KeepAlive] ✅ Health check OK - ${stats.connections} connections, ${Math.round(stats.uptime / 60)}min uptime`);
      
      // Broadcast health status para clientes conectados
      if (io) {
        io.emit('server:health', stats);
      }
    } catch (error) {
      console.error('[KeepAlive] ⚠️ Health check failed:', error.message);
    }
  }, HEALTH_CHECK_INTERVAL);
};

/**
 * Ping interno dos endpoints para mantê-los warm
 */
const startInternalPing = () => {
  keepAliveTimer = setInterval(async () => {
    console.log('[KeepAlive] 🔄 Running warmup ping...');
    await warmupEndpoints();
  }, KEEP_ALIVE_INTERVAL);
};

/**
 * Faz warmup dos endpoints críticos
 */
const warmupEndpoints = async () => {
  const results = await Promise.allSettled(
    WARMUP_ENDPOINTS.map(async (endpoint) => {
      try {
        const url = `${serverUrl}${endpoint}`;
        const response = await axios.get(url, {
          timeout: 10000,
          headers: { 
            'User-Agent': 'KeepAlive-Warmup',
            'X-Keep-Alive': 'true'
          }
        });
        return { endpoint, status: 'ok', statusCode: response.status };
      } catch (error) {
        return { endpoint, status: 'error', error: error.message };
      }
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'ok').length;
  console.log(`[KeepAlive] Warmup completed: ${successful}/${WARMUP_ENDPOINTS.length} endpoints ready`);
};

/**
 * Para os timers de keep-alive
 */
export const stopKeepAlive = () => {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
  console.log('[KeepAlive] Service stopped');
};

/**
 * Middleware para ignorar requests de keep-alive nos logs
 */
export const keepAliveMiddleware = (req, res, next) => {
  // Marca requests de keep-alive para não logar
  if (req.headers['user-agent']?.includes('KeepAlive') || req.headers['x-keep-alive']) {
    req.isKeepAlive = true;
  }
  next();
};

export default {
  initializeKeepAlive,
  stopKeepAlive,
  keepAliveMiddleware
};
