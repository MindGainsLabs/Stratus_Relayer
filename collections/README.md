# 📚 Stratus Relayer API Collections

Este diretório contém as collections completas do Postman para testar todas as funcionalidades do Stratus Relayer.

## 📋 Collections Disponíveis

### 1. 🔗 **Stratus Relayer API Collection - Complete**
> `stratus_relayer_api_collection.json`

**Collection principal para API REST com todos os endpoints HTTP.**

#### 🔥 Funcionalidades:
- ✅ **Autenticação:** Verificação de tokens e status da API
- ✅ **Mensagens Discord:** Extração e processamento de mensagens
- ✅ **Análise de Criptomoedas:** Dados estruturados, estatísticas e busca de tokens
- ✅ **Server-Sent Events (SSE):** Stream de dados em tempo real
- ✅ **Documentação:** Acesso a AsyncAPI e Swagger
- ✅ **Sistema:** Monitoramento e dashboards

#### 📊 Endpoints Principais:
```
POST /api/retrieve-messages      # Extrair mensagens do Discord
GET  /api/download-messages      # Baixar mensagens coletadas
POST /api/crypto/structured-data # Dados estruturados de crypto
GET  /api/crypto/token-stats     # Estatísticas de tokens
GET  /api/crypto/search          # Buscar tokens
GET  /api/crypto/top-tokens      # Top tokens por métrica
GET  /sse/stream                 # Stream SSE em tempo real
```

---

### 2. 🔌 **Stratus Relayer WebSocket Collection**
> `stratus_relayer_websocket_collection.json`

**Collection especializada para WebSockets e comunicação em tempo real.**

#### 🚀 Funcionalidades:
- ✅ **Conexão WebSocket:** Configuração e teste de conexão Socket.IO
- ✅ **Autenticação WebSocket:** Sistema de auth específico para WS
- ✅ **Crypto Tracking:** Atualizações em tempo real de tokens
- ✅ **Mensagens Live:** Stream de mensagens do Discord
- ✅ **Análise de Risco:** Atualizações de relatórios de risco
- ✅ **Consultas Personalizadas:** Filtros avançados e queries customizadas
- ✅ **Utilitários:** Ping/Pong e diagnósticos

#### 🎯 Eventos WebSocket Principais:
```javascript
authenticate                    # Autenticação com token
subscribe-crypto-tracking       # Inscrever em crypto tracking
request-structured-crypto-data  # Solicitar dados estruturados
request-token-stats            # Solicitar estatísticas
search-tokens                  # Buscar tokens via WS
subscribe-live-messages        # Mensagens ao vivo do Discord
custom-crypto-query           # Consultas personalizadas
```

---

## 🚀 Como Usar

### 1. **Importar Collections no Postman**

1. Abra o Postman
2. Clique em **Import** (canto superior esquerdo)
3. Selecione **File** ou arraste os arquivos JSON
4. Importe ambas as collections:
   - `stratus_relayer_api_collection.json`
   - `stratus_relayer_websocket_collection.json`

### 2. **Configurar Variáveis de Ambiente**

Crie um Environment no Postman com as seguintes variáveis:

```json
{
  "baseUrl": "http://srv800316.hstgr.cloud:8081",
  "wsBaseUrl": "ws://srv800316.hstgr.cloud:8081",
  "apiToken": "seu-token-da-api-aqui",
  "channelId": "123456789012345678",
  "channelId1": "123456789012345678",
  "channelId2": "123456789012345679",
  "channelId3": "123456789012345680"
}
```

### 3. **Para Desenvolvimento Local**

Use estas variáveis para testes locais:

```json
{
  "baseUrl": "http://localhost:8081",
  "wsBaseUrl": "ws://localhost:8081",
  "localUrl": "http://localhost:8081",
  "localWsBaseUrl": "ws://localhost:8081"
}
```

---

## 🔧 Guia Rápido de Uso

### **API REST Collection**

1. **Primeiro Teste:**
   ```
   GET /ping
   ```
   - Verifica se a API está online
   - Valida seu token de autenticação

2. **Extrair Mensagens:**
   ```
   POST /api/retrieve-messages
   ```
   - Configure `hours: 24` para últimas 24 horas
   - Adicione `channelId` do Discord

3. **Análise de Crypto:**
   ```
   POST /api/crypto/structured-data
   ```
   - Obtém dados estruturados de tokens
   - Aplique filtros por `tokenSymbol` ou `walletName`

4. **Stream SSE:**
   ```
   GET /sse/stream
   ```
   - Recebe atualizações em tempo real
   - Mantém conexão persistente

### **WebSocket Collection**

**Nota:** A collection WebSocket documenta eventos Socket.IO, não endpoints HTTP.

1. **Conectar via Socket.IO:**
   ```javascript
   const io = require('socket.io-client');
   const socket = io('ws://srv800316.hstgr.cloud:8081');
   ```

2. **Autenticar:**
   ```javascript
   socket.emit('authenticate', {
     token: 'seu-token-aqui'
   });
   ```

3. **Inscrever em Crypto Tracking:**
   ```javascript
   socket.emit('subscribe-crypto-tracking', {
     hours: 24
   });
   ```

4. **Receber Dados:**
   ```javascript
   socket.on('structured-crypto-data', (data) => {
     console.log('Dados crypto:', data);
   });
   ```

---

## 🎯 Recursos Especiais

### **Scripts Automáticos**
Ambas as collections incluem scripts automáticos que:
- ✅ Validam tokens de API
- ✅ Testam tempos de resposta
- ✅ Verificam formato JSON
- ✅ Logam informações úteis

### **Exemplos de Response**
Todas as requests importantes incluem exemplos de resposta para facilitar o entendimento.

### **Documentação Integrada**
Cada endpoint inclui:
- 📖 Descrição detalhada
- 🔧 Parâmetros explicados
- 💻 Código de exemplo
- ⚡ Casos de uso práticos

---

## 🌐 URLs e Endpoints

### **Produção**
- **API HTTP:** `http://srv800316.hstgr.cloud:8081`
- **WebSocket:** `ws://srv800316.hstgr.cloud:8081`
- **Dashboard:** `http://srv800316.hstgr.cloud:8081/websocket-dashboard.html`
- **Swagger:** `http://srv800316.hstgr.cloud:8081/api-docs`

### **Desenvolvimento Local**
- **API HTTP:** `http://localhost:8081`
- **WebSocket:** `ws://localhost:8081`
- **Dashboard:** `http://localhost:8081/websocket-dashboard.html`

---

## 📝 Arquivos Relacionados

```
collections/
├── stratus_relayer_api_collection.json      # Collection API REST
├── stratus_relayer_websocket_collection.json # Collection WebSocket
└── README.md                                 # Este arquivo

docs/
├── asyncapi.yaml                            # Especificação AsyncAPI
└── websocket-api-md/                        # Documentação gerada

public/
├── websocket-dashboard.html                 # Dashboard WebSocket interativo
├── SSE.html                                # Dashboard SSE
└── index.html                              # Dashboard principal
```

---

## 🚀 Próximos Passos

1. **Importe as collections** no Postman
2. **Configure suas variáveis** de ambiente
3. **Teste a conectividade** com `/ping`
4. **Extraia mensagens** do Discord
5. **Explore os WebSockets** para dados em tempo real
6. **Acesse os dashboards** para interface visual

## 🆘 Suporte

- **Swagger UI:** `{{baseUrl}}/api-docs`
- **AsyncAPI Docs:** `{{baseUrl}}/docs/websocket`
- **Dashboard WebSocket:** `{{baseUrl}}/websocket-dashboard.html`
- **Dashboard SSE:** `{{baseUrl}}/SSE.html`

---

**📊 Stratus Relayer v1.0.0** - Sistema completo de análise de tokens e rastreamento de criptomoedas em tempo real.
