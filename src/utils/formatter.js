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
    
    // Format the MULTI BUY header
    formatted = formatted.replace(/(‼️\s*🟢\s*MULTI BUY)\s*(\w+)/i, "$1 **$2**");
    
    // Format wallet count with bold
    formatted = formatted.replace(/(\d+\s*wallets)\s+bought/i, "**$1** bought");
    
    // Format total SOL amount with bold
    formatted = formatted.replace(/Total:\s*([0-9\.]+\s*SOL)/i, "Total: **$1**");
    
    // Format wallet names and transaction info
    formatted = formatted.replace(/🔹|🔺|🔸\s*([\w\s\.]+)\s*\((\w+\s*\w*)\s*tx\)/g, function(match, walletName, txTime) {
        return match.charAt(0) + "**" + (walletName ? walletName.trim() : 'Unknown') + "** (" + (txTime ? txTime.trim() : 'Unknown') + " tx)";
    });

    
    // Format SOL amounts and market cap in transaction lines
    formatted = formatted.replace(/├([\d\.]+\s*SOL\s*\|\s*MC\s*\$[\d\.]+[KMB])/g, "├**$1**");
    
    // Format token name references after links
    formatted = formatted.replace(/🔗\s*#(\w+)/g, "🔗 **#$1**");
    
    // Format market cap values
    formatted = formatted.replace(/MC:\s*(\$[\d\.]+[KMB])/g, "**MC**: $1");
    
    // Format "Seen" time references
    formatted = formatted.replace(/Seen:\s*([\w\s\.]+):/g, "**Seen**: $1:");
    
    // Format links to DEX tools
    formatted = formatted.replace(/DS:/g, "[DS]:");
    formatted = formatted.replace(/GMGN:/g, "[GMGN]:");
    formatted = formatted.replace(/AXI(?:OM)?:/g, "[AXI]:");
    
    // Preserve token addresses wrapped in backticks
    formatted = formatted.replace(/`([A-Za-z0-9]+)`/g, "`$1`");
    
    // Format token trading platform links
    const platforms = ['BullX NEO', 'GMGN', 'AXIOM', 'Trojan', 'Photon', 'GMGN.ai', 'APEPRO', 'Bloom', 'Nova', 'RAY'];
    platforms.forEach(platform => {
        const regex = new RegExp(`(${platform})`, 'g');
        formatted = formatted.replace(regex, "**$1**");
    });
    
    return formatted;
}

/**
 * Extracts structured data from a Multi Buy message for database storage
 * @param {string} message - The raw message content
 * @returns {Object} - Structured data extracted from the message
 */
function extractMultiBuyData(message) {
    const data = {
        messageType: 'MULTI_BUY',
        tokenSymbol: null,
        totalSol: null,
        walletsCount: null,
        timeframe: null,
        transactions: [],
        tokenId: null,
        marketCap: null,
        links: {}
    };
    
    // Extract token symbol
    const symbolMatch = message.match(/MULTI BUY\s+(\w+)/i);
    if (symbolMatch) {
        data.tokenSymbol = symbolMatch[1];
    } else {
        // Try alternative pattern like "#SYMBOL"
        const altSymbolMatch = message.match(/#(\w+)/i);
        if (altSymbolMatch) {
            data.tokenSymbol = altSymbolMatch[1];
        }
    }
    
    // Extract wallets count and timeframe
    const walletsMatch = message.match(/(\d+)\s+wallets\s+bought[^!]*?(\d+(?:\.\d+)?\s+\w+)!/i);
    if (walletsMatch) {
        data.walletsCount = parseInt(walletsMatch[1], 10);
        data.timeframe = walletsMatch[2];
    }
    
    // Extract total SOL
    const totalSolMatch = message.match(/Total:\s*([\d\.]+)\s*SOL/i);
    if (totalSolMatch) {
        data.totalSol = parseFloat(totalSolMatch[1]);
    }
    
    // Extract market cap
    const mcMatch = message.match(/MC:\s*\$([\d\.]+[KMB])/i);
    if (mcMatch) {
        data.marketCap = mcMatch[1];
    }
    
    // Extract token ID (usually a long alphanumeric string)
    const tokenIdMatch = message.match(/`([A-Za-z0-9]{30,})`/) || 
                        message.match(/https:\/\/dexscreener\.com\/solana\/([A-Za-z0-9]{30,})/) ||
                        message.match(/https:\/\/axiom\.trade\/t\/([A-Za-z0-9]{30,})/);
    
    if (tokenIdMatch) {
        data.tokenId = tokenIdMatch[1];
    }
    
    // Extract transactions
    const walletPattern = /(?:🔹|🔺)\s*([\w\s\.]+)\s*\((\w+\s*\w*)\s*tx\)\s*├([\d\.]+)\s+SOL\s*\|\s*MC\s*\$([\d\.]+[KMB])(?:.*?)└Total buy:\s*([\d\.]+)\s+SOL\s*\|\s*✊(\d+)%/g;
    
    let walletMatch;
    while ((walletMatch = walletPattern.exec(message)) !== null) {
        data.transactions.push({
            walletName: walletMatch[1].trim(),
            transactionTime: walletMatch[2].trim(),
            amount: parseFloat(walletMatch[3]),
            marketCap: walletMatch[4],
            totalBuy: parseFloat(walletMatch[5]),
            holdingPercentage: parseInt(walletMatch[6], 10)
        });
    }
    
    // Extract links
    const linkMatches = {
        dexScreener: message.match(/https:\/\/dexscreener\.com\/solana\/([^\s><\)]+)/),
        gmgn: message.match(/https:\/\/gmgn\.ai\/sol\/token\/([^\s><\)]+)/),
        axiom: message.match(/https:\/\/axiom\.trade\/t\/([^\s><\)]+)/),
        bullx: message.match(/https:\/\/neo\.bullx\.io\/terminal\?[^\s><\)]+/),
        photon: message.match(/https:\/\/photon-sol\.tinyastro\.io\/[^\s><\)]+/)
    };
    
    Object.entries(linkMatches).forEach(([key, match]) => {
        if (match) {
            data.links[key] = match[0];
        }
    });
    
    return data;
}

export { formattedMessage, formatMultiBuyMessage, extractMultiBuyData };