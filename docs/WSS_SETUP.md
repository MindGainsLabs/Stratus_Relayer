# Habilitando WSS (WebSocket Seguro) no Stratus Relayer

Este guia descreve duas abordagens para habilitar `wss://`:

1. HTTPS direto no Node (integração já adicionada em `server.js`)
2. Proxy reverso (Nginx + Certbot) recomendada para produção

---
## 1. Variáveis de Ambiente (Modo Node HTTPS Direto)

Edite seu `.env` e adicione:
```
ENABLE_HTTPS=true
PORT=443
HTTPS_KEY_PATH=/etc/letsencrypt/live/seu-dominio/privkey.pem
HTTPS_CERT_PATH=/etc/letsencrypt/live/seu-dominio/fullchain.pem
# Opcional se cadeia separada
# HTTPS_CA_PATH=/etc/letsencrypt/live/seu-dominio/chain.pem
```

Reinicie a aplicação:
```
pm2 restart Stratus_Relayer
```

Verifique logs:
```
pm2 logs Stratus_Relayer --lines 100
```
Deve aparecer: `HTTPS habilitado: servindo sobre TLS (WSS disponível).`

### Vantagens
- Simples, sem dependência externa.

### Desvantagens
- Renovação de certificado manual se não integrar cron.
- Menos flexível para balanceamento/escala.
- Terminação TLS dentro do Node (maior carga no processo).

---
## 2. (Recomendado) Nginx como Proxy Reverso + Certbot

### 2.1. Instalar Nginx e Certbot
```
apt update
apt install -y nginx certbot python3-certbot-nginx
```

### 2.2. Criar config básica `/etc/nginx/sites-available/stratus_relayer.conf`
```
server {
    listen 80;
    server_name seu-dominio.com;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # WebSocket upgrade
    map $http_upgrade $connection_upgrade { default upgrade; '' close; }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:8081/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:8081/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Ativar:
```
ln -s /etc/nginx/sites-available/stratus_relayer.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 2.3. Emitir Certificado Let's Encrypt
```
certbot --nginx -d seu-dominio.com --redirect --email seu@email.com --agree-tos
```
Renovação automática já instalada (`/etc/cron.d`). Testar:
```
certbot renew --dry-run
```

### 2.4. Executar Node só em HTTP interno
Deixe seu `.env` assim:
```
ENABLE_HTTPS=false
PORT=8081
```
Nginx fará a terminação TLS e encaminhará para o Node.

---
## 3. Testando WSS

### 3.1. Via `wscat`
Instalar:
```
npm install -g wscat
```
Testar:
```
wscat -c wss://seu-dominio.com/socket.io/?EIO=4&transport=websocket
```
Se usar autenticação após conectar:
```
> 42["authenticate", {"token":"SEU_TOKEN"}]
```
`42` = frame Socket.IO para eventos (Engine.IO v4).

### 3.2. Via `openssl`
```
openssl s_client -connect seu-dominio.com:443 -servername seu-dominio.com
```
Pressione Ctrl+C ao ver certificado válido.

### 3.3. Via Browser Console
```
const s = io('wss://seu-dominio.com', { path: '/socket.io' });
s.on('connect',()=>{ console.log('OK', s.id); s.emit('authenticate',{token:'SEU_TOKEN'}); });
```

---
## 4. Variáveis de Ambiente Relacionadas
| Variável | Função | Exemplo |
|----------|--------|---------|
| ENABLE_HTTPS | Ativa HTTPS interno | true / false |
| PORT | Porta do servidor Node | 443 (TLS) ou 8081 (HTTP interno) |
| HTTPS_KEY_PATH | Caminho da chave privada | /etc/letsencrypt/live/dominio/privkey.pem |
| HTTPS_CERT_PATH | Cert completo | /etc/letsencrypt/live/dominio/fullchain.pem |
| HTTPS_CA_PATH | Cadeia (opcional) | /etc/letsencrypt/live/dominio/chain.pem |
| EXTRA_SOCKET_ORIGINS | Origens extras CORS WS | https://app1.com,https://app2.com |
| SOCKET_ALLOWED_ORIGINS | Alias alternativo para origens (mesma função) | https://frontend1.com,https://frontend2.com |

---
## 5. Checklist de Produção
- [ ] DNS apontando para o servidor
- [ ] Porta 80 e 443 liberadas (firewall)
- [ ] Certificado emitido e válido
- [ ] Renovação testada (`certbot renew --dry-run`)
- [ ] Logs monitorados (`pm2 logs` e `journalctl -u nginx`)
- [ ] Health-check configurado
- [ ] Alertas de expiração de certificado (opcional)

---
## 6. Migração Segura
1. Subir Nginx em paralelo (porta 80/443)
2. Deixar Node em 8081
3. Testar `curl -I https://seu-dominio.com`
4. Validar `wss://` com `wscat`
5. Atualizar front-end para usar `wss://`
6. Monitorar erros 24h iniciais

---
## 7. Solução de Problemas
| Sintoma | Causa Provável | Ação |
|---------|----------------|------|
| `400 Bad Request` no upgrade | Cabeçalhos Upgrade ausentes | Revisar bloco `location /socket.io/` |
| `Not allowed by CORS` | Origem não listada | Adicionar em EXTRA_SOCKET_ORIGINS |
| Handshake sem origin | Cliente CLI / wscat | Ignorar ou restringir manualmente |
| Bloqueio intermitente CORS | Trailing slash na origem | Adicionar versões com e sem `/` |
| WebSocket cai após 1 min | Timeout proxy | Ajustar `proxy_read_timeout` |
| `self signed certificate` | Cert inválido | Verificar cadeia / fullchain |
| `ECONNREFUSED` | Porta errada | Confirmar Nginx -> Node 8081 |

---
## 8. Exemplo de Cliente Consolidado (Produção)
```javascript
import { io } from 'socket.io-client';
const socket = io('wss://seu-dominio.com', {
  path: '/socket.io',
  transports: ['websocket'],
  reconnectionAttempts: 10,
  timeout: 10000
});

socket.on('connect', () => {
  console.log('Connected', socket.id);
  socket.emit('authenticate', { token: 'SEU_TOKEN' });
});

socket.on('authenticated', () => {
  socket.emit('subscribe-crypto-tracking', { hours: 24 });
});
```

---
## 9. Próximos Passos Recomendados
- Implementar rate limiting por IP
- Assinar logs de falha de autenticação
- Adicionar monitoramento (Prometheus / Grafana)
- Revisar rotação automática de tokens

---
**Pronto! WSS habilitado com suporte para produção.**
