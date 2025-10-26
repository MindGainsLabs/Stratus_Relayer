# WebSocket Paths e Conexões (Stratus Relayer)

Este documento explica como conectar-se ao WebSocket do Stratus Relayer em diferentes cenários (local, produção com Nginx, subpath `/relayer`).

## 1. Variável de Ambiente

Use a variável `SOCKET_IO_PATH` para definir o path base do Socket.IO:
```
SOCKET_IO_PATH=/socket.io        # (padrão)
SOCKET_IO_PATH=/relayer/socket.io  # quando servindo atrás de /relayer
```

## 2. Cenários de Deploy

| Cenário | URL HTTP Base | Path Socket.IO | URL WebSocket (Socket.IO Client) |
|---------|---------------|----------------|----------------------------------|
| Local dev simples | http://localhost:8081 | /socket.io | ws://localhost:8081/socket.io |
| Produção direta (sem subpath) | https://srv800316.hstgr.cloud | /socket.io | wss://srv800316.hstgr.cloud/socket.io |
| Produção com subpath (/relayer) | https://srv800316.hstgr.cloud/relayer | /relayer/socket.io | wss://srv800316.hstgr.cloud/relayer/socket.io |
| Produção com Nginx proxy + Node 8081 | https://srv800316.hstgr.cloud | /socket.io | wss://srv800316.hstgr.cloud/socket.io |

## 3. Exemplo de Configuração Nginx (subpath)

```
location /relayer/socket.io/ {
    proxy_pass http://127.0.0.1:8081/relayer/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 60s;
}

location /relayer/ {
    proxy_pass http://127.0.0.1:8081/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
}
```

Se o app Node não conhece o prefixo `/relayer`, você pode usar reescrita:
```
location /relayer/socket.io/ {
    proxy_pass http://127.0.0.1:8081/socket.io/;
    # ...demais cabeçalhos
}
```
Então mantenha `SOCKET_IO_PATH=/socket.io`.

## 4. Cliente Socket.IO (Vanilla)
```javascript
import { io } from 'socket.io-client';

// Caso sem subpath
const socket = io('wss://srv800316.hstgr.cloud', {
  path: '/socket.io',
  transports: ['websocket']
});

// Caso com subpath /relayer
const socketRelayer = io('wss://srv800316.hstgr.cloud', {
  path: '/relayer/socket.io',
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected base', socket.id);
  socket.emit('authenticate', { token: 'SEU_TOKEN' });
});
```

## 5. Integração em Next.js (Frontend no Vercel)
```javascript
// utils/socket.js
import { io } from 'socket.io-client';

const WS_BASE = process.env.NEXT_PUBLIC_STRATUS_WSS || 'wss://srv800316.hstgr.cloud';
const WS_PATH = process.env.NEXT_PUBLIC_STRATUS_WS_PATH || '/socket.io';

export const socket = io(WS_BASE, {
  path: WS_PATH,
  transports: ['websocket'],
  timeout: 10000,
  reconnectionAttempts: 8
});
```

`.env.local` no frontend:
```
NEXT_PUBLIC_STRATUS_WSS=wss://srv800316.hstgr.cloud
# Para subpath:
# NEXT_PUBLIC_STRATUS_WS_PATH=/relayer/socket.io
```

## 6. Teste via wscat
```
wscat -c wss://srv800316.hstgr.cloud/socket.io/?EIO=4&transport=websocket
# Subpath:
wscat -c wss://srv800316.hstgr.cloud/relayer/socket.io/?EIO=4&transport=websocket
```

## 7. Erros Comuns
| Erro | Causa | Solução |
|------|-------|---------|
| 400 Bad Request | Path incorreto | Verifique `path` configurado no cliente |
| 404 /socket.io/ | Nginx não encaminha | Ajustar bloco `location` |
| CORS bloqueado | Origem ausente | Adicionar em `EXTRA_SOCKET_ORIGINS` |
| Timeout | Porta errada ou firewall | Validar `ss -tlnp` e security group |
| Conecta só em `ws://` | Tentando diretamente porta 8081 | Use domínio HTTPS + proxy Nginx |

## 8. Boas Práticas
- Mantenha `SOCKET_IO_PATH` explícito em produção.
- Evite múltiplos subpaths (ex.: `/relayer/api` + `/relayer/socket.io`) sem mapear tudo no Nginx.
- Padronize variáveis entre backend e frontend.

## 9. Variáveis Recomendadas (.env backend)
```
SOCKET_IO_PATH=/socket.io
# ou
# SOCKET_IO_PATH=/relayer/socket.io
EXTRA_SOCKET_ORIGINS=https://mindgains-launch-pad-rust.vercel.app,https://srv800316.hstgr.cloud
```

## 10. Próximos Passos
- [ ] Validar handshake via logs `[Socket.IO][CORS]`
- [ ] Confirmar path correto com `wscat`
- [ ] Atualizar coleção Postman WebSocket se usar subpath

---
**Pronto! Agora você pode operar com ou sem subpath usando WSS.**
