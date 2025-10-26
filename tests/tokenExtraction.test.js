/**
 * Teste específico para validar extração de token ID
 */

import { extractTokenInfo } from '../src/utils/telegramFormatter.js';

const testCases = [
    {
        name: "Token entre backticks (formato padrão)",
        description: "`9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk` | [🤖 RayBot]",
        expectedToken: "9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk"
    },
    {
        name: "URL do GMGN",
        description: "Token info: https://gmgn.ai/sol/token/qOlUmSn7_9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk",
        expectedToken: "qOlUmSn7_9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk"
    },
    {
        name: "URL do DexScreener",
        description: "Check it out: https://dexscreener.com/solana/9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk?maker=123",
        expectedToken: "9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk"
    },
    {
        name: "URL do Axiom",
        description: "Trade here: https://axiom.trade/t/9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk",
        expectedToken: "9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk"
    },
    {
        name: "URL do BullX",
        description: "BullX: https://neo.bullx.io/terminal?chainId=1399811149&address=9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk&r=test",
        expectedToken: "9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk"
    },
    {
        name: "Múltiplos tokens (deve pegar o primeiro)",
        description: "`FirstToken123456789012345678901234` and `SecondToken987654321098765432109876` | [🤖 RayBot]",
        expectedToken: "FirstToken123456789012345678901234"
    },
    {
        name: "Token muito curto (deve ser ignorado)",
        description: "`short` | [🤖 RayBot]",
        expectedToken: null
    },
    {
        name: "Sem token",
        description: "Esta é uma mensagem sem token | [🤖 RayBot]",
        expectedToken: null
    }
];

const runTokenExtractionTests = () => {
    console.log('🧪 TESTANDO EXTRAÇÃO DE TOKEN ID\n');
    console.log('=' * 60);

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 TESTE ${index + 1}: ${testCase.name}`);
        console.log(`📝 Input: ${testCase.description}`);
        
        const result = extractTokenInfo(testCase.description);
        const extractedToken = result?.tokenId || null;
        
        console.log(`🎯 Expected: ${testCase.expectedToken}`);
        console.log(`📤 Got: ${extractedToken}`);
        
        if (extractedToken === testCase.expectedToken) {
            console.log('✅ PASSOU');
            passed++;
        } else {
            console.log('❌ FALHOU');
            failed++;
        }
        
        console.log('-'.repeat(40));
    });

    console.log(`\n📊 RESUMO DOS TESTES:`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((passed / testCases.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    } else {
        console.log('\n⚠️ Alguns testes falharam. Verifique a lógica de extração.');
    }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runTokenExtractionTests();
}

export { runTokenExtractionTests };
