/**
 * Teste do messageService com formatação moderna
 * Simula o processamento de mensagens sem fazer requisições reais
 */

import { formatTelegramMessage, extractTokenInfo } from '../src/utils/telegramFormatter.js';

// Mock do serviço Telegram para evitar envios reais
const mockTelegramService = {
    sendToTelegramClient: (message) => {
        console.log('\n' + '🟦'.repeat(40));
        console.log('📤 TELEGRAM MESSAGE:');
        console.log('🟦'.repeat(40));
        console.log(message);
        console.log('🟦'.repeat(40) + '\n');
    }
};

// Mock do RugCheck service
const mockRugcheckService = {
    getTokenReportSummary: async (tokenId) => {
        console.log(`🔍 Buscando relatório para token: ${tokenId}`);
        
        // Simula diferentes tipos de resposta baseado no token
        if (tokenId.includes('safe')) {
            return {
                tokenProgram: "Token Program",
                tokenType: "Standard SPL Token",
                risks: [],
                score: 10,
                score_normalised: 5
            };
        } else if (tokenId.includes('risky')) {
            return {
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
                score_normalised: 85
            };
        } else {
            // Token sem dados
            return null;
        }
    }
};

/**
 * Simula o processamento de uma mensagem do Discord
 */
const processDiscordMessage = async (message) => {
    console.log(`\n📥 Processando mensagem: ${message.id}`);
    
    // Processa conteúdo simples
    if (message.content) {
        const content = message.content.replace(/</g, '').replace(/>/g, '');
        const username = message.author.username || 'Unknown';
        
        const formattedMsg = formatTelegramMessage({
            username,
            content
        });
        
        mockTelegramService.sendToTelegramClient(formattedMsg);
    }

    // Processa embeds
    for (const embed of message.embeds || []) {
        if (embed.description || embed.content) {
            const updatedDescription = embed.description?.replace(/</g, '').replace(/>/g, '') || embed.content?.replace(/</g, '').replace(/>/g, '');
            const username = message.author.username || embed.author?.name || 'Unknown';
            
            // Extrai informações do token
            const tokenInfo = extractTokenInfo(updatedDescription);
            
            if (tokenInfo && tokenInfo.tokenId) {
                console.log(`🪙 Token detectado: ${tokenInfo.tokenId}`);
                
                // Busca relatório do RugCheck
                const report = await mockRugcheckService.getTokenReportSummary(tokenInfo.tokenId);
                
                if (!report) {
                    const warningMsg = formatTelegramMessage({
                        username,
                        content: updatedDescription,
                        tokenInfo,
                        riskReport: { 
                            warning: true, 
                            message: "⚠️ New token, no data available!" 
                        }
                    });
                    mockTelegramService.sendToTelegramClient(warningMsg);
                    continue;
                }
                
                // Formata mensagem com relatório de risco
                const completeMsg = formatTelegramMessage({
                    username,
                    content: updatedDescription,
                    tokenInfo,
                    riskReport: report
                });
                
                mockTelegramService.sendToTelegramClient(completeMsg);
            } else {
                // Mensagem sem token
                const simpleMsg = formatTelegramMessage({
                    username,
                    content: updatedDescription
                });
                mockTelegramService.sendToTelegramClient(simpleMsg);
            }
        }
    }
};

// Dados de teste
const testMessages = [
    {
        id: '1',
        content: 'Esta é uma mensagem simples de teste',
        author: { username: 'TestUser' },
        embeds: []
    },
    {
        id: '2',
        content: '',
        author: { username: 'Stratus OGs' },
        embeds: [
            {
                description: '🟢 BUY SafeToken on RAYDIUM\n' +
                    '🔹 **Trader Name**\n' +
                    '\n' +
                    '🔹**Trader** swapped **10** **SOL** for **1,000** ($500) **SafeToken** @$0.50\n' +
                    '✊Holds: 1K (0.1%) 📈uPnL: **+5.5** SOL\n' +
                    '\n' +
                    '`safetokenaddress123456789`\n'
            }
        ]
    },
    {
        id: '3',
        content: '',
        author: { username: 'Stratus OGs' },
        embeds: [
            {
                description: '🟢 BUY RiskyToken on RAYDIUM\n' +
                    '🔹 **Risk Trader**\n' +
                    '\n' +
                    '🔹**Risk Trader** swapped **50** **SOL** for **50,000** ($2,500) **RiskyToken** @$0.05\n' +
                    '✊Holds: 50K (5%) 📉uPnL: **-25** SOL\n' +
                    '\n' +
                    '`riskytokenaddress987654321`\n'
            }
        ]
    },
    {
        id: '4',
        content: '',
        author: { username: 'Stratus OGs' },
        embeds: [
            {
                description: '🟢 BUY NewToken on RAYDIUM\n' +
                    '🔹 **New Trader**\n' +
                    '\n' +
                    '🔹**New Trader** swapped **5** **SOL** for **10,000** ($250) **NewToken** @$0.025\n' +
                    '✊Holds: 10K (1%) 📊uPnL: **0** SOL\n' +
                    '\n' +
                    '`newtokenaddress111111111`\n'
            }
        ]
    }
];

// Executar testes
const runMessageServiceTests = async () => {
    console.log('🧪 TESTANDO MESSAGE SERVICE COM FORMATAÇÃO MODERNA');
    console.log('=' * 60);
    
    for (const message of testMessages) {
        await processDiscordMessage(message);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre mensagens
    }
    
    console.log('\n✅ TODOS OS TESTES DO MESSAGE SERVICE CONCLUÍDOS!');
    console.log('💡 As mensagens acima mostram como ficarão no Telegram');
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMessageServiceTests().catch(console.error);
}

export { runMessageServiceTests };
