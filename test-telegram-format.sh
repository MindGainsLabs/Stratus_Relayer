#!/bin/bash

# echo "🔍 2. Testando extração de token ID..."
node tests/tokenExtraction.test.js

echo ""
echo "🤖 3. Testando remoção do RayBot..."
node tests/rayBotRemoval.test.js

echo ""
echo "🚀 4. Testando formatação MULTI BUY..."
node tests/multiBuy.test.js

echo ""
echo "🔄 5. Testando messageService completo..."ra testar a formatação de mensagens do Telegram
# Execute com: ./test-telegram-format.sh

echo "🧪 Executando testes de formatação do Telegram..."
echo "================================================"

# Navegar para o diretório do projeto
cd "$(dirname "$0")"

echo "📋 1. Testando formatação básica..."
node tests/telegramFormatter.test.js

echo ""
echo "🔍 2. Testando extração de token ID..."
node tests/tokenExtraction.test.js

echo ""
echo "� 3. Testando formatação MULTI BUY..."
node tests/multiBuy.test.js

echo ""
echo "�🔄 4. Testando messageService completo..."
node tests/messageService.test.js

echo ""
echo "✅ Todos os testes concluídos!"
echo "💡 Para modificar os testes, edite os arquivos em: tests/"
echo "💡 Para modificar a formatação, edite: src/utils/telegramFormatter.js"
