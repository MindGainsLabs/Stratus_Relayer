/**
 * Parses Discord messages to extract structured data
 * while preserving the original content
 */

/**
 * Determines if a message is a MULTI BUY alert
 */
export const isMultiBuyMessage = (content) => {
    return content.includes('MULTI BUY') || 
           content.match(/\d+\s+wallets\s+bought/i) ||
           (content.includes('buy') && content.match(/Total:\s*([\d\.]+)\s*SOL/i));
};

/**
 * Extracts wallet transaction data from a message
 */
export const extractWalletTransactions = (content) => {
    const transactions = [];
    
    // Match wallet lines with pattern like: 
    // "🔹pinyo.sol (0s tx)
    // ├9.90 SOL | MC $787.40K
    // └Total buy: 9.90 SOL | ✊100%"
    const walletBlocks = content.split(/(?:🔹|🔺)/).slice(1);
    
    walletBlocks.forEach(block => {
        const walletNameMatch = block.match(/^([\w\.]+)\s*\((\w+)\s+tx\)/);
        if (!walletNameMatch) return;
        
        const walletName = walletNameMatch[1];
        const txTime = walletNameMatch[2];
        
        // Extract amount
        const amountMatch = block.match(/├([\d\.]+)\s+SOL/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        
        // Extract market cap
        const mcMatch = block.match(/MC\s*\$([\d\.]+[KMB])/);
        const marketCap = mcMatch ? mcMatch[1] : '';
        
        // Extract total buy
        const totalBuyMatch = block.match(/Total buy:\s*([\d\.]+)\s+SOL/);
        const totalBuy = totalBuyMatch ? parseFloat(totalBuyMatch[1]) : 0;
        
        // Extract holding percentage
        const holdingMatch = block.match(/✊(\d+)%/);
        const holdingPercentage = holdingMatch ? parseInt(holdingMatch[1]) : 0;
        
        transactions.push({
            walletName,
            transactionTime: txTime,
            amount,
            marketCap,
            totalBuy,
            holdingPercentage
        });
    });
    
    return transactions;
};

/**
 * Extracts token information from a message
 */
export const extractTokenInfo = (content) => {
    const result = {
        tokenId: null,
        tokenSymbol: null,
        totalSol: null,
        walletsCount: null,
        timeframe: null,
        marketCap: null
    };
    
    // Extract token ID
    const tokenIdRegexes = [
        /`(\w+)` | [🤖 RayBot]/,
        /`(\w+)pump` | [🤖 RayBot]/,
        /https:\/\/gmgn\.ai\/sol\/token\/(\w+)/,
        /https:\/\/axiom\.trade\/t\/(\w+)/,
        /https:\/\/neo\.bullx\.io\/terminal\?chainId=\d+&address=(\w+)/,
        /https:\/\/t\.me\/ray_cyan_bot\?start=buy__(\w+)/,
        /https:\/\/photon-sol\.tinyastro\.io\/en\/lp\/(\w+)/,
        /https:\/\/gmgn\.ai\/sol\/token\/(\w+)/,
        /https:\/\/t\.me\/ape_pro_solana_bot\?start=ape_ray_(\w+)/,
        /https:\/\/t\.me\/BloomSolana_bot\?start=ref_RAYBOT_ca_(\w+)/,
        /https:\/\/t\.me\/TradeonNovaBot\?start=r-raybot-(\w+)/,
        /https:\/\/axiom\.trade\/t\/(\w+)\/@raybot/,
        /https:\/\/dexscreener\.com\/solana\/(\w+)/
    ];
    
    for (const regex of tokenIdRegexes) {
        const match = content.match(regex);
        if (match) {
            result.tokenId = match[1];
            break;
        }
    }
    
    // Extract token symbol
    const symbolRegexes = [
        /MULTI BUY\s+(\w+)/i,
        /#(\w+)\s+\|/i,
        /wallets\s+bought\s+(\w+)/i
    ];
    
    for (const regex of symbolRegexes) {
        const match = content.match(regex);
        if (match) {
            result.tokenSymbol = match[1];
            break;
        }
    }
    
    // Extract total SOL
    const totalSolMatch = content.match(/Total:\s*([\d\.]+)\s*SOL/i);
    if (totalSolMatch) {
        result.totalSol = parseFloat(totalSolMatch[1]);
    }
    
    // Extract wallets count
    const walletsMatch = content.match(/(\d+)\s+wallets\s+bought/i);
    if (walletsMatch) {
        result.walletsCount = parseInt(walletsMatch[1]);
    }
    
    // Extract timeframe
    const timeframeMatch = content.match(/in\s+the\s+last\s+([\d\.]+\s+\w+)/i);
    if (timeframeMatch) {
        result.timeframe = timeframeMatch[1];
    }
    
    // Extract market cap
    const mcMatch = content.match(/MC:\s*\$([\d\.]+[KMB])/i);
    if (mcMatch) {
        result.marketCap = mcMatch[1];
    }
    
    return result;
};

/**
 * Main function to enrich a message with structured data
 * Returns the original message with added structured data fields
 */
export const enrichMessageWithStructuredData = (message, content, riskReport = null) => {
    // Start with basic fields
    const enrichedData = {
        id: message.id,
        username: message.author?.username || 'Unknown',
        description: content
    };
    
    // Check if it's a MULTI BUY message
    if (isMultiBuyMessage(content)) {
        enrichedData.messageType = 'MULTI_BUY';
        
        // Extract token info
        const tokenInfo = extractTokenInfo(content);
        Object.assign(enrichedData, tokenInfo);
        
        // Extract wallet transactions
        enrichedData.transactions = extractWalletTransactions(content);
    } else if (content.includes('Token Risk Report') || content.includes('🤖 RayBot')) {
        enrichedData.messageType = 'TOKEN_ALERT';
        // Extract token info specifically for token alerts
        const tokenInfo = extractTokenInfo(content);
        Object.assign(enrichedData, tokenInfo);
    } else {
        enrichedData.messageType = 'OTHER';
    }
    
    // Add risk report data if available
    if (riskReport) {
        enrichedData.riskReport = {
            tokenProgram: riskReport.tokenProgram || "Unknown",
            tokenType: (riskReport.tokenType || "").trim(),
            risks: (riskReport.risks || []).map(risk => ({
                name: risk.name,
                description: risk.description,
                value: risk.value || "",
                score: risk.score,
                level: risk.level
            })),
            score: riskReport.score || 0,
            scoreNormalised: riskReport.score_normalised || 0
        };
    }
    
    return enrichedData;
};