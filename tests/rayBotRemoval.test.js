/**
 * Teste específico para remoção do link RayBot
 */

import { formatTelegramMessage } from '../src/utils/telegramFormatter.js';

const testCases = [
    {
        name: "RayBot no final da mensagem",
        input: "Esta é uma mensagem de teste | [🤖 RayBot](https://t.me/ray_cyan_bot)",
        shouldNotContain: "🤖 RayBot"
    },
    {
        name: "RayBot no meio da mensagem",
        input: "Início | [🤖 RayBot](https://t.me/ray_cyan_bot) e continuação",
        shouldNotContain: "🤖 RayBot"
    },
    {
        name: "Múltiplas referências RayBot",
        input: "Token A | [🤖 RayBot](https://t.me/ray_cyan_bot) e Token B | [🤖 RayBot](https://t.me/ray_cyan_bot)",
        shouldNotContain: "🤖 RayBot"
    },
    {
        name: "Mensagem sem RayBot",
        input: "Esta mensagem não tem referência ao bot",
        shouldNotContain: "🤖 RayBot"
    },
    {
        name: "MULTI BUY com RayBot",
        input: `‼️ 🆕🟢 MULTI BUY **EMG**
**2 wallets** bought EMG
🔹**(Quant11)** (0s tx)
\`9iJ5HYHDYM95FJiiiyYwgTCqCVpbMA8NG2JEk5f6bonk\`
 | [🤖 RayBot](https://t.me/ray_cyan_bot)`,
        shouldNotContain: "🤖 RayBot"
    }
];

const testRayBotRemoval = () => {
    console.log('🧪 TESTANDO REMOÇÃO DO RAYBOT');
    console.log('=' * 50);

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 TESTE ${index + 1}: ${testCase.name}`);
        console.log(`📝 Input: ${testCase.input}`);
        
        const result = formatTelegramMessage({
            username: 'TestUser',
            content: testCase.input
        });
        
        const containsRayBot = result.includes(testCase.shouldNotContain);
        
        console.log(`🎯 Should NOT contain: "${testCase.shouldNotContain}"`);
        console.log(`📤 Contains: ${containsRayBot ? 'YES ❌' : 'NO ✅'}`);
        
        if (!containsRayBot) {
            console.log('✅ PASSOU - RayBot removido com sucesso');
            passed++;
        } else {
            console.log('❌ FALHOU - RayBot ainda presente');
            failed++;
        }
        
        console.log('-'.repeat(40));
    });

    console.log(`\n📊 RESUMO DOS TESTES:`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((passed / testCases.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! RayBot removido corretamente.');
    } else {
        console.log('\n⚠️ Alguns testes falharam. Verifique a lógica de remoção.');
    }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testRayBotRemoval();
}

export { testRayBotRemoval };
