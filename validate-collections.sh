#!/bin/bash

# 🔍 Validador de Collections do Stratus Relayer
# Verifica se as collections estão corretamente formatadas e completas

#    if grep -q "Crypto Tracking WebSocket" collections/stratus_relayer_websocket_collection.json; then
        test_result 0 "WebSocket Collection contém seção de Crypto Tracking"
    else
        test_result 1 "WebSocket Collection sem seção de Crypto Tracking"
    fiara o diretório do projeto
cd "$(dirname "$0")"

echo "🔍 VALIDANDO COLLECTIONS DO STRATUS RELAYER"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0

# Função para testar
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "✅ ${GREEN}PASSOU${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "❌ ${RED}FALHOU${NC}: $2"
    fi
}

echo ""
echo "📋 1. Verificando existência dos arquivos..."
echo "--------------------------------------------"

# Verificar se arquivos existem
if [ -f "collections/stratus_relayer_api_collection.json" ]; then
    test_result 0 "API Collection existe"
else
    test_result 1 "API Collection não encontrada"
fi

if [ -f "collections/stratus_relayer_websocket_collection.json" ]; then
    test_result 0 "WebSocket Collection existe"
else
    test_result 1 "WebSocket Collection não encontrada"
fi

if [ -f "collections/README.md" ]; then
    test_result 0 "README.md existe"
else
    test_result 1 "README.md não encontrado"
fi

echo ""
echo "🔧 2. Validando formato JSON..."
echo "------------------------------"

# Validar JSON da API Collection
if command -v jq &> /dev/null; then
    if jq empty collections/stratus_relayer_api_collection.json 2>/dev/null; then
        test_result 0 "API Collection tem JSON válido"
    else
        test_result 1 "API Collection tem JSON inválido"
    fi

    if jq empty collections/stratus_relayer_websocket_collection.json 2>/dev/null; then
        test_result 0 "WebSocket Collection tem JSON válido"
    else
        test_result 1 "WebSocket Collection tem JSON inválido"
    fi
else
    echo -e "${YELLOW}⚠️  jq não instalado - pulando validação JSON${NC}"
fi

echo ""
echo "📊 3. Verificando estrutura das collections..."
echo "----------------------------------------------"

# Verificar estrutura da API Collection
if [ -f "collections/stratus_relayer_api_collection.json" ]; then
    # Verificar se contém campos obrigatórios
    if grep -q "Stratus Relayer API Collection" collections/stratus_relayer_api_collection.json; then
        test_result 0 "API Collection tem nome correto"
    else
        test_result 1 "API Collection nome incorreto"
    fi

    if grep -q "🔐 Autenticação" collections/stratus_relayer_api_collection.json; then
        test_result 0 "API Collection contém seção de Autenticação"
    else
        test_result 1 "API Collection sem seção de Autenticação"
    fi

    if grep -q "📨 Mensagens Discord" collections/stratus_relayer_api_collection.json; then
        test_result 0 "API Collection contém seção de Mensagens"
    else
        test_result 1 "API Collection sem seção de Mensagens"
    fi

    if grep -q "🪙 Análise de Criptomoedas" collections/stratus_relayer_api_collection.json; then
        test_result 0 "API Collection contém seção de Crypto"
    else
        test_result 1 "API Collection sem seção de Crypto"
    fi

    if grep -q "📡 Server-Sent Events" collections/stratus_relayer_api_collection.json; then
        test_result 0 "API Collection contém seção de SSE"
    else
        test_result 1 "API Collection sem seção de SSE"
    fi
fi

# Verificar estrutura da WebSocket Collection
if [ -f "collections/stratus_relayer_websocket_collection.json" ]; then
    if grep -q "Stratus Relayer WebSocket Collection" collections/stratus_relayer_websocket_collection.json; then
        test_result 0 "WebSocket Collection tem nome correto"
    else
        test_result 1 "WebSocket Collection nome incorreto"
    fi

    if grep -q "🔌 Conexão WebSocket" collections/stratus_relayer_websocket_collection.json; then
        test_result 0 "WebSocket Collection contém seção de Conexão"
    else
        test_result 1 "WebSocket Collection sem seção de Conexão"
    fi

    if grep -q "🔐 Autenticação WebSocket" collections/stratus_relayer_websocket_collection.json; then
        test_result 0 "WebSocket Collection contém seção de Auth"
    else
        test_result 1 "WebSocket Collection sem seção de Auth"
    fi

    if grep -q "� Crypto Tracking WebSocket" collections/stratus_relayer_websocket_collection.json; then
        test_result 0 "WebSocket Collection contém seção de Crypto Tracking"
    else
        test_result 1 "WebSocket Collection sem seção de Crypto Tracking"
    fi
fi

echo ""
echo "🌐 4. Verificando URLs e variáveis..."
echo "------------------------------------"

# Verificar URLs nas collections
if grep -q "srv800316.hstgr.cloud:8081" collections/stratus_relayer_api_collection.json; then
    test_result 0 "API Collection contém URL de produção"
else
    test_result 1 "API Collection sem URL de produção"
fi

if grep -q "localhost:8081" collections/stratus_relayer_api_collection.json; then
    test_result 0 "API Collection contém URL local"
else
    test_result 1 "API Collection sem URL local"
fi

if grep -q "ws://srv800316.hstgr.cloud:8081" collections/stratus_relayer_websocket_collection.json; then
    test_result 0 "WebSocket Collection contém URL WebSocket"
else
    test_result 1 "WebSocket Collection sem URL WebSocket"
fi

echo ""
echo "📝 5. Verificando endpoints principais..."
echo "----------------------------------------"

# Verificar endpoints principais na API Collection
if grep -q "retrieve-messages" collections/stratus_relayer_api_collection.json; then
    test_result 0 "Endpoint retrieve-messages presente"
else
    test_result 1 "Endpoint retrieve-messages ausente"
fi

if grep -q "structured-data" collections/stratus_relayer_api_collection.json; then
    test_result 0 "Endpoint structured-data presente"
else
    test_result 1 "Endpoint structured-data ausente"
fi

if grep -q "sse/stream" collections/stratus_relayer_api_collection.json; then
    test_result 0 "Endpoint SSE stream presente"
else
    test_result 1 "Endpoint SSE stream ausente"
fi

# Verificar eventos WebSocket
if grep -q '"authenticate"' collections/stratus_relayer_websocket_collection.json; then
    test_result 0 "Evento WebSocket authenticate presente"
else
    test_result 1 "Evento WebSocket authenticate ausente"
fi

if grep -q '"subscribe-crypto-tracking"' collections/stratus_relayer_websocket_collection.json; then
    test_result 0 "Evento WebSocket subscribe-crypto-tracking presente"
else
    test_result 1 "Evento WebSocket subscribe-crypto-tracking ausente"
fi

echo ""
echo "📄 6. Verificando documentação..."
echo "--------------------------------"

if [ -f "collections/README.md" ]; then
    if grep -q "Stratus Relayer API Collections" collections/README.md; then
        test_result 0 "README contém título correto"
    else
        test_result 1 "README título incorreto"
    fi

    if grep -q "Collections Disponíveis" collections/README.md; then
        test_result 0 "README contém seção de collections"
    else
        test_result 1 "README sem seção de collections"
    fi

    if grep -q "Como Usar" collections/README.md; then
        test_result 0 "README contém guia de uso"
    else
        test_result 1 "README sem guia de uso"
    fi
fi

echo ""
echo "📊 RESUMO DOS TESTES"
echo "===================="
echo -e "✅ Testes aprovados: ${GREEN}$PASSED_TESTS${NC}"
echo -e "❌ Testes falharam: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"
echo -e "📋 Total de testes: ${BLUE}$TOTAL_TESTS${NC}"

# Calcular taxa de sucesso
SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
echo -e "📈 Taxa de sucesso: ${GREEN}$SUCCESS_RATE%${NC}"

echo ""
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "🎉 ${GREEN}TODAS AS COLLECTIONS ESTÃO VÁLIDAS!${NC}"
    echo "✅ Pronto para usar no Postman"
else
    echo -e "⚠️  ${YELLOW}Algumas validações falharam${NC}"
    echo "🔧 Verifique os erros acima"
fi

echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "-------------------"
echo "1. Importe as collections no Postman:"
echo "   • collections/stratus_relayer_api_collection.json"
echo "   • collections/stratus_relayer_websocket_collection.json"
echo ""
echo "2. Configure as variáveis de ambiente:"
echo "   • baseUrl: http://srv800316.hstgr.cloud:8081"
echo "   • wsBaseUrl: ws://srv800316.hstgr.cloud:8081"
echo "   • apiToken: seu-token-da-api"
echo ""
echo "3. Teste a conectividade:"
echo "   • Execute GET /ping"
echo "   • Execute POST /api/retrieve-messages"
echo ""
echo "4. Acesse a documentação:"
echo "   • Leia collections/README.md"
echo "   • Visite http://srv800316.hstgr.cloud:8081/api-docs"

echo ""
echo "📚 Collections do Stratus Relayer v1.0.0 - Validação concluída!"
