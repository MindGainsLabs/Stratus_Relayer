# Channel & Wallet Stats (Stratus Relayer)

Este módulo provê métricas para até 10 canais do Discord contendo calls de compra.

## Critério de WIN
Uma call é considerada WIN se em qualquer momento `highestPrice >= entryPrice * 1.5` (>= +50%).

## Modelos
`ChannelCall`:
- `entryPrice`, `highestPrice`, `lowestPrice`
- `hit50PctGain` (boolean)
- `priceSnapshots[]`

`WalletPerformance`:
- Métricas agregadas por carteira e canal (winRate, averagePeakGainPct, etc.).

## Endpoints REST
`GET /api/channels/:id/calls` -> lista paginada de calls.
`GET /api/channels/:id/stats` -> estatísticas agregadas (winRate, best calls 1D/7D/30D, ranking carteiras).

## Eventos WebSocket
- `subscribe-channel-stats` { channelId }
- `unsubscribe-channel-stats` { channelId }
- `request-channel-stats` { channelId }
- Resposta: `channel-stats` { channelId, stats }

## Estrutura de `stats`
```
{
  channelId,
  winRate,
  totalCalls,
  wins,
  bestCalls: { last1d, last7d, last30d },
  walletRanking: [...],
  top3: [...]
}
```

## Variáveis de Ambiente
`DISCORD_CALL_CHANNEL_IDS` = lista separada por vírgula de IDs de canais monitorados.
`WALLET_RANK_CRON` = expressão cron para recalcular ranking (default cada 5 min).

## Cron Jobs
- Coleta de mensagens (existente) permanece.
- Novo cron `wallet ranking` atualiza `WalletPerformance`.
- Cron `call ETL` extrai calls da collection `Message` para `ChannelCall`.

## ETL de Calls (Message -> ChannelCall)
Origem agora primaria: collection `Message` (mensagens já persistidas do Discord). Processo:
1. Cron `CHANNEL_CALL_ETL_CRON` roda a cada intervalo.
2. Filtra mensagens por janela (default 72h).
3. Aplica regex de identificação de call (MULTI BUY, wallets bought, BUY ... swapped ...).
4. Extrai: tokenSymbol, tokenAddress, entryPrice heurístico.
5. Cria `ChannelCall` se ainda não existir (`messageId` index).

Fallback: ao solicitar stats de um canal sem calls, dispara uma extração on-demand para esse canal.

Variáveis:
```
CHANNEL_CALL_ETL_CRON=30 */2 * * * *  # default a cada 2 min no segundo 30
WALLET_RANK_CRON=0 */5 * * * *
```

## Atualização de Preços (Futuro)
Arquivo `priceUpdateService.js` contém hooks para integrar feed de preços real e atualizar `highestPrice`/`hit50PctGain`.

## Próximos Incrementos Sugeridos
- Indexar carteiras reais das mensagens MULTI BUY.
- Integrar feed externo para atualizar preços.
- Adicionar distribuição de tempo até atingir +50% (se win).
