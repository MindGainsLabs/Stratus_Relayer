# 🧪 Guia de Testes - Formatação Telegram

Este documento complementa o README principal com instruções específicas para testar a formatação moderna de mensagens do Telegram.

## 📁 Novos Arquivos de Teste

### `telegramFormatter.test.js`
Testa a formatação básica das mensagens com diferentes cenários:
- Mensagens simples
- Mensagens com tokens
- Relatórios de risco
- Tokens seguros vs. arriscados
- Tokens novos sem dados

### `messageService.test.js`
Simula o processamento completo do messageService com dados reais:
- Processamento de mensagens do Discord
- Extração de informações de tokens
- Integração com RugCheck (mock)
- Formatação final para Telegram

## 🚀 Como Executar os Testes

### Método 1: Script Automatizado
```bash
./test-telegram-format.sh
```

### Método 2: Executar Individualmente
```bash
# Teste de formatação básica
node tests/telegramFormatter.test.js

# Teste do messageService completo
node tests/messageService.test.js
```

## 📋 Exemplos de Saída

### Mensagem Simples
```
╭─── 📊 **STRATUS RELAYER** ───╮
👤 **TestUser**

Esta é uma mensagem de teste simples

╰─────────────────────────────╯
```

### Mensagem com Token e Risco Alto
```
╭─── 📊 **STRATUS RELAYER** ───╮
👤 **Stratus OGs**

🟢 BUY RiskyToken on RAYDIUM
▫️ **Risk Trader**

🪙 **Token Info:**
📍 **Contract:** `riskytokenaddress987654321`
💎 **Market Cap:** $2.5M
💰 **Price:** $0.05

🛡️ **RISK ANALYSIS**
┌─────────────────────────┐
│ 🔧 **Program:** Token-2022
│ 📋 **Type:** SPL Token
│ 🟠 **Risk Score:** 85/100
└─────────────────────────┘

⚠️ **Risk Factors:**
🟠 **High Liquidity Risk**
   └ Low liquidity pool detected (15.2 SOL)
   └ Score: 75

╰─────────────────────────────╯
```

### Token Novo (Sem Dados)
```
╭─── 📊 **STRATUS RELAYER** ───╮
👤 **Stratus OGs**

⚠️ **TOKEN WARNING**
┌─────────────────────────┐
│ 🟡 **Status:** New Token
│ 📊 **Data:** Not Available
│ ⚠️ **Caution:** High Risk
└─────────────────────────┘

🚨 **No risk analysis available for this token!**
💡 **Recommendation:** Wait for data or proceed with extreme caution

╰─────────────────────────────╯
```

## 🎨 Características da Formatação

### ✨ Melhorias Visuais
- **Header moderno** com separadores visuais
- **Emojis consistentes** para diferentes tipos de informação
- **Formatação em caixas** para dados estruturados
- **Cores baseadas em risco** (🟢 🟡 🟠 🔴)

### 📊 Informações Organizadas
- **Dados do token** separados em seção própria
- **Análise de risco** estruturada com scores visuais
- **Links organizados** por categoria
- **Valores monetários** destacados

### ⚠️ Alertas Inteligentes
- **Tokens novos** recebem avisos especiais
- **Scores de risco** com cores correspondentes
- **Fatores de risco** detalhados e categorizados

## 🔧 Personalização

Para modificar a formatação, edite o arquivo:
```
src/utils/telegramFormatter.js
```

### Principais funções:
- `formatTelegramMessage()` - Formatação principal
- `formatRiskReport()` - Relatórios de risco
- `formatTokenInfo()` - Informações do token
- `extractTokenInfo()` - Extração de dados

## 📝 Notas Importantes

1. **Testes não enviam mensagens reais** - Apenas simulam a formatação
2. **Dados de RugCheck são mockados** - Para testes seguros
3. **Links são preservados** - Funcionalidade completa mantida
4. **Formatação Markdown** - Compatível com Telegram

## 🚀 Deploy

Após os testes, as alterações já estão aplicadas no `messageService.js` principal. 
Para usar em produção, certifique-se de que:

1. ✅ Todos os testes passaram
2. ✅ A formatação está adequada
3. ✅ Os links funcionam corretamente
4. ✅ O RugCheck service está configurado
