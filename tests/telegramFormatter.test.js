/**
 * Teste para formatação de mensagens do Telegram
 * Execute este arquivo para testar a formatação sem enviar para o Telegram real
 */

import { formatTelegramMessage, extractTokenInfo } from '../src/utils/telegramFormatter.js';

// Mock data baseado no exemplo fornecido
const mockDiscordMessage = {
    type: 0,
    content: '',
    embeds: [
        {
            type: 'rich',
            description: '🟢 BUY Ani on RAYDIUM\n' +
                '🔹 **Stratus OG 4**\n' +
                '\n' +
                '🔹**Stratus OG 4** swapped **40** **SOL** for **104,699.28** ($6,943.56) **Ani** @$0.0663\n' +
                '✊Holds: 1.89M (0.19%) 📉uPnL: **-55.66** SOL\n' +
                '\n' +
                '🟧 **#Ani** | **MC**: $66.32M | **Seen**: 2d 21h: [DS](<https://dexscreener.com/solana/9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk?maker=8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6>) | [GMGN](<https://gmgn.ai/sol/token/qOlUmSn7_9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [AXI](<https://axiom.trade/t/9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk/@raybot>)\n' +
                '`9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk`\n' +
                '\n' +
                ' | [🤖 RayBot](https://t.me/ray_cyan_bot)\n' +
                '\n' +
                'Ani: [⭐ BullX NEO](<https://neo.bullx.io/terminal?chainId=1399811149&address=9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk&r=IXFHAMJ1FN9>) | [🦖GMGN](<https://t.me/GMGN_sol03_bot?start=i_qOlUmSn7_c_9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [AXIOM](<https://axiom.trade/t/9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk/@raybot>)\n' +
                'Ani: [Trojan](<https://t.me/diomedes_trojanbot?start=d-raybot-9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [Trojan](<https://t.me/hector_trojanbot?start=d-raybot-9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [Trojan](<https://t.me/helenus_trojanbot?start=d-raybot-9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>)\n' +
                'Ani: [Photon](<https://photon-sol.tinyastro.io/en/lp/9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [GMGN.ai](<https://gmgn.ai/sol/token/qOlUmSn7_9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [APEPRO](<https://t.me/ape_pro_solana_bot?start=ape_ray_9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>)\n' +
                'Ani: [Bloom](<https://t.me/BloomSolana_bot?start=ref_RAYBOT_ca_9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [Nova](<https://t.me/TradeonNovaBot?start=r-raybot-9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>) | [RAY](<https://t.me/ray_purple_bot?start=buy__9tqjeRS1swj36Ee5C1iGiwAxjQJNGAVCzaTLwFY8bonk>)',
            color: 5793266
        }
    ],
    author: {
        username: 'Stratus OGs'
    }
};

// Mock do relatório de risco
const mockRiskReport = {
    tokenProgram: "Token-2022",
    tokenType: "SPL Token",
    risks: [
        {
            name: "High Liquidity Risk",
            description: "Low liquidity pool detected",
            value: "15.2 SOL",
            score: 75,
            level: "high"
        },
        {
            name: "Mint Authority",
            description: "Mint authority not revoked",
            score: 60,
            level: "medium"
        }
    ],
    score: 135,
    score_normalised: 67
};

// Mock sem riscos
const mockSafeReport = {
    tokenProgram: "Token Program",
    tokenType: "Standard SPL Token",
    risks: [],
    score: 10,
    score_normalised: 5
};

// Função para simular envio para Telegram (apenas log)
const mockSendToTelegramClient = (message) => {
    console.log('\n' + '='.repeat(80));
    console.log('📤 MENSAGEM PARA TELEGRAM:');
    console.log('='.repeat(80));
    console.log(message);
    console.log('='.repeat(80) + '\n');
};

// Testes
const runTests = () => {
    console.log('🧪 INICIANDO TESTES DE FORMATAÇÃO\n');

    // Teste 1: Mensagem simples de conteúdo
    console.log('📋 TESTE 1: Mensagem simples');
    const simpleMsg = formatTelegramMessage({
        username: 'TestUser',
        content: 'Esta é uma mensagem de teste simples'
    });
    mockSendToTelegramClient(simpleMsg);

    // Teste 2: Mensagem com embed (sem token)
    console.log('📋 TESTE 2: Mensagem de embed sem token');
    const embedMsg = formatTelegramMessage({
        username: mockDiscordMessage.author.username,
        content: 'Mensagem de exemplo sem informações de token'
    });
    mockSendToTelegramClient(embedMsg);

    // Teste 3: Mensagem completa com token e relatório de risco
    console.log('📋 TESTE 3: Mensagem completa com token e riscos');
    const description = mockDiscordMessage.embeds[0].description;
    const tokenInfo = extractTokenInfo(description);
    
    const completeMsg = formatTelegramMessage({
        username: mockDiscordMessage.author.username,
        content: description,
        tokenInfo,
        riskReport: mockRiskReport
    });
    mockSendToTelegramClient(completeMsg);

    // Teste 4: Mensagem com token seguro
    console.log('📋 TESTE 4: Mensagem com token seguro (sem riscos)');
    const safeMsg = formatTelegramMessage({
        username: mockDiscordMessage.author.username,
        content: description,
        tokenInfo,
        riskReport: mockSafeReport
    });
    mockSendToTelegramClient(safeMsg);

    // Teste 5: Token novo sem dados
    console.log('📋 TESTE 5: Token novo sem dados');
    const warningMsg = formatTelegramMessage({
        username: mockDiscordMessage.author.username,
        content: description,
        tokenInfo,
        riskReport: { 
            warning: true, 
            message: "⚠️ New token, no data available!" 
        }
    });
    mockSendToTelegramClient(warningMsg);

    // Teste 6: Extração de informações do token
    console.log('📋 TESTE 6: Extração de informações do token');
    console.log('Token Info extraído:', JSON.stringify(tokenInfo, null, 2));

    console.log('✅ TODOS OS TESTES CONCLUÍDOS!\n');
    console.log('💡 Para usar em produção, substitua mockSendToTelegramClient por sendToTelegramClient');
};

// Executar testes se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { runTests, mockSendToTelegramClient };
