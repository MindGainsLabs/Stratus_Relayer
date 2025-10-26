/**
 * Teste específico para mensagens MULTI BUY
 */

import { formatTelegramMessage, extractTokenInfo } from '../src/utils/telegramFormatter.js';

// Mock da mensagem MULTI BUY real
const multiBuyMessage = `‼️ 🆕🟢 MULTI BUY **EMG**
Multi preset 1
**2 wallets** bought EMG in the last 2 hours!
**Total: 4.49  SOL**
🔹**(Quant11)** (0s tx)
├**3.37 SOL | MC $245.28K**
└Total buy: 3.37 SOL | ✊100%
🔺**(Quant13)** (53s tx)
├**1.13 SOL | MC $141.71K**
└Total buy: 1.13 SOL | ✊0%
🟧 **#EMG** | **MC**: $245.28K | **Seen**: 59s: 
\`9iJ5HYHDYM95FJiiiyYwgTCqCVpbMA8NG2JEk5f6bonk\`
 | [🤖 RayBot](https://t.me/ray_cyan_bot)`;

const testMultiBuyFormatting = () => {
    console.log('🧪 TESTANDO FORMATAÇÃO MULTI BUY');
    console.log('=' * 50);

    console.log('\n📝 MENSAGEM ORIGINAL:');
    console.log('-'.repeat(40));
    console.log(multiBuyMessage);

    console.log('\n🔍 EXTRAÇÃO DE TOKEN INFO:');
    console.log('-'.repeat(40));
    const tokenInfo = extractTokenInfo(multiBuyMessage);
    console.log('Token extraído:', JSON.stringify(tokenInfo, null, 2));

    console.log('\n✨ MENSAGEM FORMATADA:');
    console.log('-'.repeat(40));
    
    const formattedMsg = formatTelegramMessage({
        username: 'Stratus OGs',
        content: multiBuyMessage,
        tokenInfo: tokenInfo,
        riskReport: {
            tokenProgram: "Token Program",
            tokenType: "Standard SPL Token",
            risks: [
                {
                    name: "Multi Buy Activity",
                    description: "Multiple wallets buying simultaneously",
                    score: 40,
                    level: "medium"
                }
            ],
            score: 40,
            score_normalised: 25
        }
    });

    console.log('\n' + '🟦'.repeat(50));
    console.log('📤 RESULTADO FINAL:');
    console.log('🟦'.repeat(50));
    console.log(formattedMsg);
    console.log('🟦'.repeat(50));
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testMultiBuyFormatting();
}

export { testMultiBuyFormatting };
