import axios from 'axios';
import Message from '../models/Message.js';
import { sendToTelegram, sendToTelegramClient } from './telegramService.js';
import { formattedMessage } from '../utils/formatter.js';
import { configDotenv } from 'dotenv';
import { getTokenReportSummary, loginToRugcheck } from './rugcheckService.js';

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
                        sendToTelegramClient(`${username}: ${content}`);
                    }

                    let responseMessage = '';

                    // Enviar descrições dos embeds para o Telegram
                    message.embeds.forEach(async embed => {
                        if (embed.description || embed.content) {
                            const updatedDescription = embed.description.replace(/</g, '').replace(/>/g, '') || embed.content.replace(/</g, '').replace(/>/g, '');
                            const username = message.author.username || embed.author?.name || 'Unknown';
                            console.log(updatedDescription);
                            const tokenIdMatch = updatedDescription.match(/`(\w+)` | [🤖 RayBot]/)?.[1] ||
                            updatedDescription.match(/`(\w+)pump` | [🤖 RayBot]/)?.[1] ||
                            updatedDescription.match(/https:\/\/gmgn\.ai\/sol\/token\/(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/axiom\.trade\/t\/(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/neo\.bullx\.io\/terminal\?chainId=\d+&address=(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/t\.me\/ray_cyan_bot\?start=buy__(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/photon-sol\.tinyastro\.io\/en\/lp\/(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/gmgn\.ai\/sol\/token\/(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/t\.me\/ape_pro_solana_bot\?start=ape_ray_(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/t\.me\/BloomSolana_bot\?start=ref_RAYBOT_ca_(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/t\.me\/TradeonNovaBot\?start=r-raybot-(\w+)/)?.[1] ||
                            updatedDescription.match(/https:\/\/axiom\.trade\/t\/(\w+)\/@raybot/)?.[1] ||
                            updatedDescription.match(/https:\/\/dexscreener\.com\/solana\/(\w+)/)?.[1] ||
                            updatedDescription.includes('[🤖 RayBot]');
                            if (tokenIdMatch) {
                                // Autenticar e buscar relatório do Rugcheck
                                const report = await getTokenReportSummary(tokenIdMatch);
                                console.log('Relatório do Rugcheck:', report);
    
                                if (!report) {
                                    sendToTelegramClient(`${username}: ${updatedDescription} \n\n ────────────────── \n\n ⚠️ New token, no data, warning!`);
                                    return;
                                }
                                // Extrair detalhes do token com segurança
                                const token_program = report.tokenProgram || "Unknown";
                                const token_type = (report.tokenType || "").trim();
                                const risks = report.risks || [];
                                const score = report.score || 0;
                                const score_normalised = report.score_normalised || 0;
    
                                responseMessage += "\n\n ────────────────── \n\n✅ Token Risk Report Summary:\n";
                                responseMessage += `🔹 Token Program: ${token_program}\n`;
                                responseMessage += `🔹 Token Type: ${token_type ? token_type : 'Unknown'}\n`;
    
                                // Printa os fatores de risco somente se existirem
                                if (risks.length > 0) {
                                    responseMessage += "\n⚠️ Risk Factors:\n";
                                    risks.forEach(risk => {
                                        responseMessage += ` - ${risk.name}: ${risk.description}${risk.value ? "("+risk.value+")" : ""}\n (Score: ${risk.score}, Level: ${risk.level})\n\n`;
                                    });
                                } else {
                                    responseMessage += "\n✅ No significant risks detected for this token.\n";
                                }
                                responseMessage += `\n🔹 Final Risk Score: ${score}`;
                                responseMessage += `\n🟩 Score Normalised: ${score_normalised} \n`;
                                sendToTelegramClient(`${username}: ${updatedDescription}  ${responseMessage}`);
                            }
                            else {
                                sendToTelegramClient(`${username}: ${updatedDescription}`);
                            }
                        }
                    });
                    let description = message.embeds?.map(embed => embed.description).join(' ') || message.content || 'Vazio';
                    const newMessage = new Message({
                        id: message.id,
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
    process.env.CHANNEL_ID_3
].filter(Boolean); // Filtra IDs de canal inválidos
for (const channelId of channelIds) {
    if (!channelId) {
        console.error('ID do canal não fornecido.');
        continue;
    }
    retrieveMessages(channelId, 1);
}

export { retrieveMessages };
