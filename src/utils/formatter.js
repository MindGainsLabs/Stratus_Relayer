const formattedMessage = (message) => {
    const username = message.author?.username || 'Unknown';
    const discriminator = message.author?.discriminator || '0000';
    const channelId = message.channel_id || 'Unknown';
    const content = message.content || '';
    const timestamp = new Date(message.timestamp).toLocaleString();
    const editedTimestamp = message.edited_timestamp ? new Date(message.edited_timestamp).toLocaleString() : 'Nunca';

    let formatted = `**${username}#${discriminator}**\n`;
    formatted += `📍 **Canal:** ${channelId}\n`;
    formatted += `🕒 **Enviado em:** ${new Date(timestamp).toLocaleDateString('pt-BR')} às ${new Date(timestamp).toLocaleTimeString('pt-BR')}\n`;
    formatted += `✏️ **Editado em:** ${editedTimestamp}\n`;
    formatted += `💬 ${content}\n`;

    if (message.attachments && message.attachments.length > 0) {
        formatted += `📎 **Attachments:**\n`;
        message.attachments.forEach((attachment, index) => {
            if (attachment.content_type && attachment.content_type.startsWith('image/')) {
                formatted += `   ${index + 1}. [Image](${attachment.url})\n`;
            } else {
                formatted += `   ${index + 1}. [${attachment.filename}](${attachment.url})\n`;
            }
        });
    }

    if (message.embeds && message.embeds.length > 0) {
        formatted += `🖼️ **Embeds:**\n`;
        message.embeds.forEach((embed) => {
            formatted += `   **${embed.author?.name || 'No Title'}**\n`;
            if (embed.description) {
                formatted += `📄 ${embed.description}\n`;
            }
            if (embed.url) {
                formatted += `[${embed.url}](${embed.url})\n`;
            }
            if (embed.image?.url) {
                formatted += `[${embed.image.url}](${embed.image.url})\n`;
            }
            if (embed.video?.url) {
                formatted += `[${embed.video.url}](${embed.video.url})\n\n`;
            }
            if (embed.footer?.text) {
                formatted += `📝 ${embed.footer.text}  •  ${new Date(embed.timestamp).toLocaleDateString('pt-BR')} às ${new Date(embed.timestamp).toLocaleTimeString('pt-BR')}\n`;
            }
        });
    }

    return formatted;
};

function formatMultiBuyMessage(message) {
    let formatted = message;
    // Exemplo: aplicar formatação na primeira linha: adicionar bold na bannière
    formatted = formatted.replace(/(‼️\s*🟢\s*MULTI BUY)\s*(⬜️)/i, "$1 **$2**");

    // Formatar wallet count: deixa em negrito o trecho que contenha "wallets"
    formatted = formatted.replace(/(\d+\s*wallets)/i, "**$1**");
    // Formatar total: deixa em negrito o valor SOL
    formatted = formatted.replace(/Total:\s*([0-9\.]+\s*SOL)/i, "Total: **$1**");

    // Para cada bloco iniciado com "🔹", coloca o número em negrito
    formatted = formatted.replace(/(🔹)\s*(\d+)/g, "🔹**$2**");
    // Formata linhas que começam com "├" para deixar o conteúdo em negrito
    formatted = formatted.replace(/(├)([^└\n]+)/g, "├**$2**");
    // Você pode adicionar outros replaces conforme o padrão desejado.
    // Por exemplo, formatar links e outros elementos:
    // Converter "DS" para link (exemplo simples):
    formatted = formatted.replace(/DS\s*\:\s*([^\s]+)/, "DS: [$1](https://dexscreener.com/solana/$1)");
    // Ajuste de acordo com as regras que você precisar.

    return formatted;
}

export { formattedMessage, formatMultiBuyMessage };