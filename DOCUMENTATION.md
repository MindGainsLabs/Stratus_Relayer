# 📚 Documentação Detalhada do Stratus Relayer

Este documento fornece uma explicação detalhada das funcionalidades do Stratus Relayer, um sistema de extração e análise de mensagens do Discord com integração ao Telegram e análise de tokens criptográficos.

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Componentes Principais](#componentes-principais)
4. [API Endpoints](#api-endpoints)
   - [Endpoints de Mensagens](#endpoints-de-mensagens)
   - [Endpoints de Crypto Tracking](#endpoints-de-crypto-tracking)
   - [Endpoints SSE](#endpoints-sse)
5. [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
   - [Extração de Mensagens do Discord](#extração-de-mensagens-do-discord)
   - [Análise de Tokens Crypto](#análise-de-tokens-crypto)
   - [Integração com Rugcheck](#integração-com-rugcheck)
   - [Envio para Telegram](#envio-para-telegram)
   - [SSE (Server-Sent Events)](#sse-server-sent-events)
6. [Guia de Uso](#guia-de-uso)
   - [Interface Web](#interface-web)
   - [Consulta via API](#consulta-via-api)
   - [Real-Time com SSE](#real-time-com-sse)
7. [Estrutura de Dados](#estrutura-de-dados)
   - [Modelo de Mensagem](#modelo-de-mensagem)
   - [Dados de Token](#dados-de-token)
   - [Relatório de Risco](#relatório-de-risco)
8. [Fluxos de Trabalho](#fluxos-de-trabalho)
   - [Processamento de Mensagem MULTI BUY](#processamento-de-mensagem-multi-buy)
   - [Análise de Risco de Token](#análise-de-risco-de-token)
9. [Solução de Problemas](#solução-de-problemas)
10. [Melhores Práticas](#melhores-práticas)
11. [Extensão do Sistema](#extensão-do-sistema)

---

## Visão Geral do Sistema

O Stratus Relayer é uma aplicação Node.js projetada para:

1. **Extrair mensagens** de canais específicos do Discord
2. **Analisar tokens criptográficos** mencionados nas mensagens
3. **Avaliar riscos** de tokens utilizando a API Rugcheck
4. **Encaminhar mensagens** para grupos do Telegram
5. **Armazenar e indexar** dados estruturados para consulta posterior
6. **Fornecer análise estatística** de atividades de tokens e carteiras
7. **Distribuir notificações em tempo real** via SSE (Server-Sent Events)

O sistema é particularmente focado em mensagens de "MULTI BUY", que mostram múltiplas carteiras comprando um determinado token criptográfico.

---

## Arquitetura do Sistema

O Stratus Relayer segue uma arquitetura modular baseada em:

- **Camada de API**: Express.js para endpoints RESTful
- **Camada de Persistência**: MongoDB para armazenamento de dados
- **Camada de Serviço**: Módulos para lógica de negócio específica
- **Integrações Externas**: Discord API, Rugcheck API e Telegram API
- **Comunicação em Tempo Real**: SSE para atualizações push

```
[Discord API] <-- Extração --> [Stratus Relayer] <-- Envio --> [Telegram]
                                     |
                                     | Análise
                                     v
                              [Rugcheck API]
```

---

## Componentes Principais

1. **messageService.js**: Extrai mensagens do Discord e processa seu conteúdo
2. **rugcheckService.js**: Se comunica com a API Rugcheck para análise de tokens
3. **telegramService.js**: Envia mensagens formatadas para o Telegram
4. **tokenParser.js**: Analisa e estrutura dados de tokens a partir do texto das mensagens
5. **cryptoTrackingService.js**: Gerencia estatísticas e análises de dados de criptomoedas
6. **sseRoutes.js**: Fornece atualizações em tempo real via SSE

---

## API Endpoints

### Endpoints de Mensagens

#### `POST /api/retrieve-messages`
Extrai mensagens do Discord e retorna os dados estruturados.

**Parâmetros do corpo:**
- `channelId` (string): ID do canal Discord para extrair mensagens
- `hours` (number): Quantas horas atrás deve buscar mensagens

**Resposta:**
```json
{
  "message": "Mensagens coletadas com sucesso.",
  "data": {
    "multiBuyAlerts": [...],
    "tokenAlerts": [...],
    "otherMessages": [...],
    "totalMessages": 42,
    "tokenStats": {...}
  }
}
```

#### `GET /api/download-messages`
Gera um arquivo de texto formatado com todas as mensagens armazenadas.

**Resposta:** Arquivo texto para download

#### `GET /api/total-messages`
Retorna o número total de mensagens armazenadas.

**Resposta:**
```json
{
  "total": 1337
}
```

#### `GET /api/message-stats`
Retorna estatísticas agregadas sobre as mensagens armazenadas.

**Resposta:**
```json
{
  "messageCounts": {
    "MULTI_BUY": 42,
    "TOKEN_ALERT": 15,
    "OTHER": 7
  },
  "totalSolVolume": 1542.75,
  "uniqueTokensCount": 18,
  "topWallets": [...],
  "topTokens": [...]
}
```

#### `GET /api/search-tokens`
Busca tokens por símbolo ou ID.

**Parâmetros de query:**
- `query` (string): Termo de busca
- `limit` (number, opcional): Quantidade máxima de resultados (padrão: 10)

**Resposta:**
```json
{
  "tokens": [...],
  "count": 5
}
```

### Endpoints de Crypto Tracking

#### `POST /api/crypto/structured-data`
Obtém dados estruturados de tracking de criptomoedas.

**Parâmetros do corpo:**
- `hours` (number): Quantas horas atrás deve analisar
- `tokenSymbol` (string, opcional): Filtrar por símbolo específico
- `walletName` (string, opcional): Filtrar por carteira específica
- `channelId` (string, opcional): ID do canal para atualizar dados antes da análise

**Resposta:**
```json
{
  "message": "Crypto tracking data retrieved successfully",
  "data": {
    "trackedMessages": [...],
    "stats": {
      "tokens": [...],
      "wallets": [...],
      "totalSol": 1542.75
    },
    "filters": {
      "hours": 24,
      "tokenSymbol": "All",
      "walletName": "All"
    }
  }
}
```

#### `GET /api/crypto/token-stats`
Obtém estatísticas gerais sobre tokens.

**Parâmetros de query:**
- `hours` (number, opcional): Período de análise em horas (padrão: 24)

**Resposta:**
```json
{
  "message": "Token statistics generated successfully",
  "data": {
    "tokens": [...],
    "wallets": [...],
    "totalSol": 1542.75,
    "generatedAt": "2023-08-15T14:30:00.000Z",
    "timeframe": "24 hours"
  }
}
```

#### `GET /api/crypto/search`
Busca tokens por símbolo ou ID parcial.

**Parâmetros de query:**
- `query` (string): Termo de busca
- `hours` (number, opcional): Período de análise em horas (padrão: 24)

**Resposta:**
```json
{
  "message": "Token search results",
  "results": 3,
  "data": {
    "tokens": [...],
    "matchingMessages": [...]
  }
}
```

#### `GET /api/crypto/top-tokens`
Retorna os principais tokens por diferentes métricas.

**Parâmetros de query:**
- `metric` (string): Métrica para ordenação ('totalSol', 'mentions', 'uniqueWallets', 'riskScore')
- `hours` (number, opcional): Período de análise em horas (padrão: 24)
- `limit` (number, opcional): Quantidade máxima de resultados (padrão: 10)

**Resposta:**
```json
{
  "message": "Top 10 tokens by totalSol",
  "data": {
    "tokens": [...],
    "metric": "totalSol",
    "timeframe": "24 hours"
  }
}
```

### Endpoints SSE

#### `GET /sse/stream`
Estabelece uma conexão SSE para receber atualizações em tempo real.

**Resposta:** Stream de eventos SSE

---

## Funcionalidades Detalhadas

### Extração de Mensagens do Discord

O sistema extrai mensagens de canais específicos do Discord usando as seguintes estratégias:

1. **Extração agendada**: O sistema executa regularmente um job CRON que busca novas mensagens
2. **Extração sob demanda**: API endpoints permitem solicitar extração para períodos específicos
3. **Bot Discord**: Um bot Discord pode ser configurado para capturar mensagens em tempo real

**Como usar:**

1. **Via Interface Web**:
   - Acesse a página principal do sistema
   - Preencha o ID do canal Discord e o período de horas
   - Clique em "Extract Messages"

2. **Via API**:
   ```bash
   curl -X POST http://seu-servidor/api/retrieve-messages \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer seu_token_jwt" \
     -d '{"channelId": "123456789012345678", "hours": 24}'
   ```

### Análise de Tokens Crypto

O sistema analisa mensagens de "MULTI BUY" para extrair:

1. **Identificação do Token**: Símbolo e ID do token
2. **Volume de Transações**: Total de SOL utilizado nas compras
3. **Atividade de Carteiras**: Quais carteiras compraram, quanto e quando
4. **Estatísticas de Retenção**: Quanto cada carteira está retendo (%)
5. **Plataformas**: Em quais plataformas o token está sendo negociado

**Como usar:**

```bash
curl -X POST http://seu-servidor/api/crypto/structured-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{"hours": 24}'
```

### Integração com Rugcheck

Para cada token identificado, o sistema pode:

1. Consultar a API Rugcheck para avaliação de risco
2. Analisar fatores específicos de risco (liquidez, código, histórico)
3. Calcular uma pontuação normalizada de risco (0-100)
4. Anexar o relatório completo à mensagem

**Exemplo de relatório:**

```
✅ Token Risk Report Summary:
🔹 Token Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
🔹 Token Type: Unknown

⚠️ Risk Factors:
 - Copycat token: This token is using a verified tokens symbol
 (Score: 2000, Level: warn)

 - Low amount of LP Providers: Only a few users are providing liquidity
 (Score: 400, Level: warn)

🔹 Final Risk Score: 2401
🟩 Score Normalised: 31
```

### Envio para Telegram

O sistema pode enviar mensagens formatadas para grupos do Telegram:

1. Preserva a formatação original da mensagem do Discord
2. Adiciona contexto adicional (como relatórios de risco)
3. Oferece links diretos para ferramentas de análise

**Configuração:**
- Defina `TELEGRAM_TOKEN` e `TELEGRAM_CHAT_ID` no arquivo `.env`

### SSE (Server-Sent Events)

O sistema oferece atualizações em tempo real via SSE:

1. Notificações instantâneas quando novas mensagens são detectadas
2. Dados estruturados prontos para exibição
3. Conexão persistente para atualizações em tempo real

**Como conectar:**

**HTML/JavaScript**:
```javascript
const eventSource = new EventSource('/sse/stream');
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Nova mensagem recebida:', data);
  // Processo para atualizar a UI
};
```

**cURL**:
```bash
curl -N -H "Accept: text/event-stream" -H "Authorization: Bearer seu_token_jwt" http://seu-servidor/sse/stream
```

---

## Guia de Uso

### Interface Web

A aplicação inclui uma interface web simples para interagir com o sistema:

1. **Página Principal**: Extração manual de mensagens
   - URL: `http://seu-servidor/`
   - Funcionalidades:
     - Extração de mensagens por ID de canal e período
     - Download dos resultados em formato texto
     - Autenticação via token

2. **Página SSE**: Visualização em tempo real
   - URL: `http://seu-servidor/SSE.html`
   - Funcionalidades:
     - Stream em tempo real de novas mensagens
     - Formatação automática de mensagens MULTI BUY

### Consulta via API

Para integrar com outras aplicações, use os endpoints API:

1. **Autenticação**: Todos os endpoints requerem autenticação via token JWT
   - Adicione o header `Authorization: Bearer seu_token_jwt`

2. **Exemplos de consultas comuns**:

   - **Buscar as mensagens das últimas 24 horas**:
     ```bash
     curl -X POST http://seu-servidor/api/retrieve-messages \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer seu_token_jwt" \
       -d '{"hours": 24}'
     ```

   - **Buscar estatísticas de tokens**:
     ```bash
     curl -X GET http://seu-servidor/api/crypto/token-stats?hours=24 \
       -H "Authorization: Bearer seu_token_jwt"
     ```

   - **Buscar tokens com maior volume**:
     ```bash
     curl -X GET "http://seu-servidor/api/crypto/top-tokens?metric=totalSol&hours=24&limit=10" \
       -H "Authorization: Bearer seu_token_jwt"
     ```

   - **Buscar token específico**:
     ```bash
     curl -X GET "http://seu-servidor/api/crypto/search?query=COIN1&hours=24" \
       -H "Authorization: Bearer seu_token_jwt"
     ```

### Real-Time com SSE

Para receber atualizações em tempo real:

1. **Conectar ao endpoint SSE**:
   ```javascript
   // Em JavaScript
   const eventSource = new EventSource('/sse/stream');
   eventSource.onmessage = function(event) {
     const messages = JSON.parse(event.data);
     messages.forEach(message => {
       // Processar cada mensagem
       console.log(`Nova mensagem de ${message.author.username}`);
     });
   };
   ```

2. **Tratar desconexões**:
   ```javascript
   eventSource.onerror = function(error) {
     console.error('Erro na conexão SSE:', error);
     eventSource.close();
     // Reconectar após um tempo
     setTimeout(() => {
       // Lógica de reconexão
     }, 5000);
   };
   ```

---

## Estrutura de Dados

### Modelo de Mensagem

As mensagens são armazenadas no MongoDB com a seguinte estrutura:

```javascript
{
  id: "message_id",              // ID único da mensagem
  username: "Author Name",       // Nome do autor da mensagem
  channelId: "channel_id",       // Canal de origem
  description: "Raw content",    // Conteúdo original da mensagem
  createdAt: Date,               // Data de criação
  messageType: "MULTI_BUY",      // Tipo da mensagem (MULTI_BUY, TOKEN_ALERT, OTHER)
  
  // Dados estruturados (para mensagens MULTI_BUY)
  tokenSymbol: "COIN1",          // Símbolo do token
  tokenId: "token_address",      // Endereço/ID do token
  totalSol: 53.23,               // Volume total em SOL
  walletsCount: 5,               // Número de carteiras
  timeframe: "0.5 hours",        // Período de tempo mencionado
  marketCap: "$787.40K",         // Market cap mencionado
  
  // Transações detalhadas
  transactions: [
    {
      walletName: "pinyo.sol",   // Nome da carteira
      txTime: "0s",              // Tempo da transação
      amount: 9.90,              // Valor em SOL
      marketCap: "$787.40K",     // Market cap no momento
      totalBuy: 9.90,            // Compra total da carteira
      holdingPercentage: 100     // Percentual retido
    },
    // Mais transações...
  ],
  
  // Links relacionados
  links: {
    dexScreener: "https://...",
    // Mais links...
  },
  
  // Relatório de risco (quando disponível)
  riskReport: {
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    tokenType: "Unknown",
    risks: [
      {
        name: "Copycat token",
        description: "This token is using a verified tokens symbol",
        score: 2000,
        level: "warn"
      }
      // Mais riscos...
    ],
    finalScore: 2401,
    normalizedScore: 31
  }
}
```

### Dados de Token

As estatísticas de tokens são geradas com a seguinte estrutura:

```javascript
{
  symbol: "COIN1",
  id: "token_address",
  marketCap: "$787.40K",
  totalSol: 53.23,
  mentions: 1,
  uniqueWallets: 5,
  riskScore: 31,
  platforms: ["BullX", "NEO", "AXIOM", "Trojan", "Nova"]
}
```

### Relatório de Risco

Os relatórios de risco seguem esta estrutura:

```javascript
{
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  tokenType: "Unknown",
  risks: [
    {
      name: "Copycat token",
      description: "This token is using a verified tokens symbol",
      score: 2000,
      level: "warn"
    }
    // Mais riscos...
  ],
  finalScore: 2401,
  normalizedScore: 31
}
```

---

## Fluxos de Trabalho

### Processamento de Mensagem MULTI BUY

Quando uma mensagem MULTI BUY é detectada:

1. **Extração e Parsing**:
   - O sistema identifica o padrão "MULTI BUY" no texto
   - O `tokenParser.js` extrai dados estruturados do texto
   - Informações como token, carteiras e volumes são extraídas

2. **Enriquecimento**:
   - O sistema verifica se o token já é conhecido
   - Se não existir informação de risco, consulta o Rugcheck
   - Anexa o relatório de risco aos dados

3. **Armazenamento**:
   - A mensagem original e os dados estruturados são salvos no MongoDB
   - Estatísticas agregadas são atualizadas

4. **Distribuição**:
   - A mensagem formatada é enviada ao Telegram
   - Notificações SSE são enviadas para clientes conectados
   - A mensagem é disponibilizada via API

### Análise de Risco de Token

Quando um novo token é identificado:

1. **Detecção**: O sistema extrai o ID do token da mensagem
2. **Consulta**: O sistema consulta a API Rugcheck para obter informações
3. **Análise**: Fatores de risco são analisados e pontuados
4. **Classificação**: Uma pontuação normalizada é calculada (0-100)
5. **Armazenamento**: O relatório é armazenado com a mensagem

---

## Solução de Problemas

### Problemas Comuns e Soluções

1. **Mensagens não estão sendo extraídas**:
   - Verifique se o ID do canal está correto
   - Confirme se o token Discord tem permissões suficientes
   - Verifique os logs do servidor para erros de API

2. **Relatórios de risco não estão sendo obtidos**:
   - Verifique a conexão com a API Rugcheck
   - Confirme se `RUGCHECK_API_URL` e `RUGCHECK_TOKEN_ID` estão configurados corretamente
   - Verifique se o token sendo analisado é válido

3. **Mensagens não estão sendo enviadas ao Telegram**:
   - Confirme se `TELEGRAM_TOKEN` e `TELEGRAM_CHAT_ID` estão corretos
   - Verifique se o bot tem permissão para enviar mensagens no grupo
   - Consulte os logs para erros específicos da API Telegram

4. **SSE não está enviando atualizações**:
   - Verifique se o cliente está conectado corretamente
   - Confirme se a autenticação está sendo feita
   - Verifique se há mensagens sendo processadas

---

## Melhores Práticas

1. **Monitoramento**:
   - Configure alertas para falhas na extração de mensagens
   - Monitore o uso da API (rate limits)
   - Acompanhe o crescimento do banco de dados

2. **Backup**:
   - Faça backup regular do banco MongoDB
   - Exporte dados processados periodicamente

3. **Segurança**:
   - Mantenha as chaves de API seguras
   - Use HTTPS para todas as conexões
   - Implemente rate limiting para os endpoints da API

4. **Performance**:
   - Use caching para consultas frequentes
   - Considere índices MongoDB para consultas comuns
   - Implemente paginação para grandes conjuntos de resultados

---

## Extensão do Sistema

O Stratus Relayer pode ser estendido das seguintes formas:

1. **Suporte a mais tipos de mensagem**:
   - Implemente parsers para outros formatos de mensagem
   - Adicione novos tipos de dados estruturados

2. **Integrações adicionais**:
   - Conecte a outras fontes de dados (Twitter, Reddit)
   - Integre com outras ferramentas de análise de tokens

3. **Funcionalidades avançadas**:
   - Implemente análise de sentimento
   - Adicione aprendizado de máquina para detecção de padrões
   - Desenvolva visualizações e dashboards

4. **Alertas personalizados**:
   - Adicione sistema de alertas baseados em regras
   - Implemente notificações push para eventos específicos

---

Este documento será atualizado conforme o sistema evolui. Para informações adicionais, consulte o código-fonte e os comentários no repositório.