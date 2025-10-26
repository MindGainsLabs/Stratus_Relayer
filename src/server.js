// filepath: /src/server.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import { app, initializeWebSocket } from './index.js';
import { initializeKeepAlive } from './services/keepAliveService.js';

const PORT = process.env.PORT || 80;

// Criar servidor HTTP
const server = createServer(app);

// Configurar Socket.IO com CORS dinâmico
const allowedSocketOrigins = [
    'https://smarteye.one',
    'https://smarteye.one/',
    'https://mindgains.xyz',
    'https://www.mindgains.xyz',
    'https://mindgains-launch-pad-rust.vercel.app',
    'https://mindgains-launch-pad-rust.vercel.app/',
    'https://mindgains-updated.vercel.app/',
    'https://mindgains-preview.vercel.app/',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:80',
];

// Permitir adicionar origens extras via variável de ambiente (separadas por vírgula)
if (process.env.EXTRA_SOCKET_ORIGINS) {
    process.env.EXTRA_SOCKET_ORIGINS.split(',').map(o => o.trim()).forEach(o => {
        if (o && !allowedSocketOrigins.includes(o)) allowedSocketOrigins.push(o);
    });
}

// Caminho customizável para Socket.IO (para servir atrás de /relayer)
const SOCKET_IO_PATH = process.env.SOCKET_IO_PATH || '/socket.io';

const io = new Server(server, {
    path: SOCKET_IO_PATH,
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true); // permitir ferramentas locais sem origin
            const normalized = origin.endsWith('/') ? origin.slice(0, -1) : origin;
            const match = allowedSocketOrigins.some(o => {
                const base = o.endsWith('/') ? o.slice(0, -1) : o;
                return base === normalized;
            });
            if (match) {
                return callback(null, true);
            }
            console.warn(`Socket.IO CORS bloqueado para origem não autorizada: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST']
    }
});

// Inicializar WebSocket service
initializeWebSocket(io);

// Inicializar Keep-Alive Service (evita cold start)
const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
initializeKeepAlive(io, serverUrl);

// Exportar io para uso em outros módulos
export { io };

server.listen(PORT, () => {
    console.log(`Stratus Relayer - Servidor rodando em http://localhost:${PORT}`);
    console.log(`Stratus Relayer - WebSocket available at path ${SOCKET_IO_PATH} -> ws://localhost:${PORT}${SOCKET_IO_PATH}`);
    console.log('Para produção atrás de Nginx com /relayer: use wss://SEU_DOMINIO/relayer' + SOCKET_IO_PATH);
    console.log('[KeepAlive] 🔥 Keep-alive service active - no cold start!');
});