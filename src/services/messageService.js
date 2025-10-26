import axios from 'axios';
import Message from '../models/Message.js';
import { sendToTelegram, sendToTelegramClient } from './telegramService.js';
import { formattedMessage } from '../utils/formatter.js';
import { formatTelegramMessage, extractTokenInfo } from '../utils/telegramFormatter.js';
import { configDotenv } from 'dotenv';
import { getTokenReportSummary, loginToRugcheck } from './rugcheckService.js';
import { processTokenCall } from './narrativeService.js';

configDotenv();

const retrieveMessages = async (channelId, hours) => {
    let num = 0;
    const limit = 100;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const allMessages = [];

        let before = null;

        while (true) {
            let url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`;
            if (before) {
                url += `&before=${before}`;
            }

            const TOKEN = process.env.TOKEN_DISCORD || '';
            const headers = {
                'Authorization': `${TOKEN}`,
                'Content-Type': 'application/json'
            };

            try {
                const response = await axios.get(url, { headers });

                const messages = response.data;

                if (messages.length === 0) {
                    break;
                }

                for (const message of messages) {

                    const messageTime = new Date(message.timestamp);

                    if (messageTime < cutoffTime) {
                        break;
                    }

                    const exists = await Message.exists({ id: message.id });
                    if (exists) {
                        continue;
                    }



                    if (message.content) {
                        const content = message.content.replace(/</g, '').replace(/>/g, '');
                        const username = message.author.username || 'Unknown';
                        
                        const formattedMsg = formatTelegramMessage({
                            username,
                            content
                        });
                        
                        sendToTelegramClient(formattedMsg);
                    }

                    let responseMessage = '';

                    // Enviar descrições dos embeds para o Telegram
                    message.embeds.forEach(async embed => {
                        if (embed.description || embed.content) {
                            const updatedDescription = embed.description?.replace(/</g, '').replace(/>/g, '') || embed.content?.replace(/</g, '').replace(/>/g, '');
                            const username = message.author.username || embed.author?.name || 'Unknown';
                            console.log(updatedDescription);
                            
                            // Extrai informações do token
                            const tokenInfo = extractTokenInfo(updatedDescription);
                            
                            if (tokenInfo && tokenInfo.tokenId) {
                                // Trigger análise de narrativa/sentimento (assíncrono)
                                try {
                                    // Extrai símbolo do token da mensagem (múltiplos padrões)
                                    let tokenSymbol = 'UNKNOWN';
                                    
                                    const symbolRegexes = [
                                        /MULTI BUY\s+\*\*([A-Z0-9]+)\*\*/i,      // MULTI BUY **TOKEN**
                                        /MULTI BUY\s+([A-Z0-9]+)/i,              // MULTI BUY TOKEN
                                        /#([A-Z0-9]+)\s+\|/i,                     // #TOKEN |
                                        /wallets\s+bought\s+([A-Z0-9]+)/i,       // wallets bought TOKEN
                                        /\$([A-Z]{2,10})\b/,                      // $TOKEN (padrão original)
                                        /\*\*([A-Z]{2,10})\*\*/,                  // **TOKEN**
                                        /Token:\s+([A-Z0-9]+)/i,                  // Token: TOKEN
                                        /Symbol:\s+([A-Z0-9]+)/i                  // Symbol: TOKEN
                                    ];
                                    
                                    for (const regex of symbolRegexes) {
                                        const match = updatedDescription.match(regex);
                                        if (match && match[1]) {
                                            tokenSymbol = match[1].toUpperCase();
                                            break;
                                        }
                                    }
                                    
                                    console.log(`[MessageService] Triggering narrative analysis for ${tokenSymbol}`);
                                    
                                    // Não aguarda completar para não bloquear o fluxo principal
                                    processTokenCall({
                                        tokenSymbol,
                                        tokenAddress: tokenInfo.tokenId,
                                        messageId: message.id,
                                        channelId: channelId,
                                        timestamp: new Date(message.timestamp)
                                    }).catch(error => {
                                        console.error(`[MessageService] Error triggering narrative for ${tokenSymbol}:`, error.message);
                                    });
                                } catch (error) {
                                    console.error('[MessageService] Error in narrative trigger:', error.message);
                                }
                                
                                // Autenticar e buscar relatório do Rugcheck
                                const report = await getTokenReportSummary(tokenInfo.tokenId);
                                console.log('Relatório do Rugcheck:', report);
    
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
                                    sendToTelegramClient(warningMsg);
                                    return;
                                }
                                
                                // Formata mensagem com relatório de risco
                                const completeMsg = formatTelegramMessage({
                                    username,
                                    content: updatedDescription,
                                    tokenInfo,
                                    riskReport: report
                                });
                                
                                sendToTelegramClient(completeMsg);
                                
                                // Prepara responseMessage para salvar no banco
                                responseMessage = `\n\n──────────────────\n✅ Token Risk Report:\n`;
                                responseMessage += `🔹 Program: ${report.tokenProgram || "Unknown"}\n`;
                                responseMessage += `🔹 Type: ${report.tokenType || "Unknown"}\n`;
                                responseMessage += `🔹 Risk Score: ${report.score_normalised || 0}/100\n`;
                                
                                if (report.risks && report.risks.length > 0) {
                                    responseMessage += `⚠️ Risks Found: ${report.risks.length}\n`;
                                } else {
                                    responseMessage += `✅ No significant risks\n`;
                                }
                            }
                            else {
                                // Mensagem sem token
                                const simpleMsg = formatTelegramMessage({
                                    username,
                                    content: updatedDescription
                                });
                                sendToTelegramClient(simpleMsg);
                            }
                        }
                    });
                    let description = message.embeds?.map(embed => embed.description).join(' ') || message.content || 'Vazio';
                    const newMessage = new Message({
                        id: message.id,
                        channelId: channelId,
                        username: message.author.username || message.embeds?.map(embed => embed.author?.name || 'Unknown').join(' ') || message.content || '',
                        description: description + responseMessage,
                    });

                    await newMessage.save();
                    num += 1;

                    allMessages.push(message);
                }

                before = messages[messages.length - 1].id;

                const lastMessageTime = new Date(messages[messages.length - 1].timestamp);
                if (lastMessageTime < cutoffTime) {
                    break;
                }

            } catch (error) {
                if (error.response) {
                    console.error(`Erro na requisição do canal ${channelId}: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
                } else if (error.request) {
                    console.error('Erro na requisição: Nenhuma resposta recebida.');
                } else {
                    console.error('Erro na requisição:', error.message);
                }
                throw error;
            }
        }
    

    console.log('Número de novas mensagens coletadas:', num);
    return allMessages;
};

const channelIds = [
    process.env.CHANNEL_ID_1,
    process.env.CHANNEL_ID_2,
    process.env.CHANNEL_ID_3,
    process.env.CHANNEL_ID_4
].filter(Boolean); // Filtra IDs de canal inválidos
for (const channelId of channelIds) {
    if (!channelId) {
        console.error('ID do canal não fornecido.');
        continue;
    }
    retrieveMessages(channelId, 1);
}

export { retrieveMessages };
