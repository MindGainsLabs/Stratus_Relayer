/**
 * Utilitário para formatação moderna de mensagens do Telegram
 */

/**
 * Formata uma mensagem do Discord para um formato moderno no Telegram
 * @param {Object} params - Parâmetros da mensagem
 * @param {string} params.username - Nome do usuário
 * @param {string} params.content - Conteúdo da mensagem
 * @param {Object} params.tokenInfo - Informações do token (opcional)
 * @param {Object} params.riskReport - Relatório de risco (opcional)
 * @returns {string} Mensagem formatada
 */
export const formatTelegramMessage = ({ username, content, tokenInfo, riskReport }) => {
    let formattedMessage = '';

    // Header moderno com separador
    formattedMessage += `━━━ 📊 **STRATUS** ━━━\n`;
    formattedMessage += `👤 **${username}**\n\n`;

    // Processa o conteúdo da mensagem
    const processedContent = processMessageContent(content);
    formattedMessage += processedContent;

    // Adiciona informações do token se disponível
    if (tokenInfo) {
        formattedMessage += formatTokenInfo(tokenInfo);
    }

    // Adiciona relatório de risco se disponível
    if (riskReport) {
        formattedMessage += formatRiskReport(riskReport);
    }

    formattedMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return formattedMessage;
};

/**
 * Processa o conteúdo da mensagem para melhor formatação
 */
const processMessageContent = (content) => {
    if (!content) return '';

    let processed = content;

    // Remove tags HTML residuais
    processed = processed.replace(/<[^>]*>/g, '');

    // Remove referências ao RayBot que aparecem ao final das mensagens
    processed = processed.replace(/\s*\|\s*\[🤖 RayBot\]\([^)]+\)/g, '');
    
    // Detecta e formata mensagens MULTI BUY primeiro (antes de outros processamentos)
    if (processed.includes('MULTI BUY')) {
        processed = formatMultiBuyMessage(processed);
    }

    // Melhora a formatação de emojis e símbolos
    processed = processed.replace(/🟢/g, '🟢');
    processed = processed.replace(/🔹/g, '•');
    processed = processed.replace(/🟧/g, '🟠');
    processed = processed.replace(/✊/g, '💪');
    processed = processed.replace(/📉/g, '📉');
    processed = processed.replace(/🔺/g, '▸');

    // Formata valores monetários (apenas se não foram processados no MULTI BUY)
    if (!processed.includes('MULTI BUY ALERT')) {
        processed = processed.replace(/\$([0-9,]+\.?\d*)/g, '💰 **$$$1**');
    }
    
    // Formata percentuais
    processed = processed.replace(/\(([0-9.]+%)\)/g, '📊 ($1)');

    // Melhora a formatação de links
    processed = formatLinks(processed);

    return processed + '\n';
};

/**
 * Formata especificamente mensagens do tipo MULTI BUY
 */
const formatMultiBuyMessage = (content) => {
    let formatted = content;

    // Melhora o header do MULTI BUY
    formatted = formatted.replace(/‼️ 🆕🟢 MULTI BUY \*\*([^*]+)\*\*/, '🚀 **MULTI BUY ALERT** 🚀\n🪙 **Token: $1**');
    
    // Formata informações das wallets
    formatted = formatted.replace(/\*\*(\d+) wallets\*\* bought/, '👥 **$1 Wallets** executed buys');
    formatted = formatted.replace(/\*\*Total: ([^*]+)\*\*/, '💰 **Total Volume: $1**');
    
    // Melhora formatação de wallets individuais
    formatted = formatted.replace(/🔹\*\*\(([^)]+)\)\*\*\s*\(([^)]+)\)/g, '• **Wallet: $1** ⏱️ ($2)');
    formatted = formatted.replace(/🔺\*\*\(([^)]+)\)\*\*\s*\(([^)]+)\)/g, '▸ **Wallet: $1** ⏱️ ($2)');
    
    // Formata linhas de informação das wallets (sem duplicar $ signs)
    formatted = formatted.replace(/├\*\*([0-9.]+)\s*SOL\s*\|\s*MC\s*\$([^*]+)\*\*/g, '  • 💵 **$1 SOL** | 📊 **MC $2**');
    formatted = formatted.replace(/└Total buy:\s*([0-9.]+\s*SOL)\s*\|\s*✊([0-9]+%)/g, '  ↳ 📈 **Total: $1** | 💪 **Hold: $2**');

    return formatted;
};

/**
 * Formata links para ficarem mais organizados
 */
const formatLinks = (content) => {
    const linkPatterns = [
        { name: 'DexScreener', pattern: /\[DS\]\(<([^>]+)>\)/, emoji: '📈' },
        { name: 'GMGN', pattern: /\[GMGN\]\(<([^>]+)>\)/, emoji: '🦎' },
        { name: 'Axiom', pattern: /\[AXI\]\(<([^>]+)>\)/, emoji: '⚡' },
        { name: 'BullX NEO', pattern: /\[⭐ BullX NEO\]\(<([^>]+)>\)/, emoji: '⭐' },
        { name: 'Photon', pattern: /\[Photon\]\(<([^>]+)>\)/, emoji: '⚛️' },
        { name: 'Trojan', pattern: /\[Trojan\]\(<([^>]+)>\)/, emoji: '🗡️' }
    ];

    let processed = content;
    let linksSection = '\n\n🔗 **Quick Links:**\n';
    let hasLinks = false;

    linkPatterns.forEach(({ name, pattern, emoji }) => {
        const matches = processed.match(pattern);
        if (matches && matches[1]) {
            linksSection += `${emoji} [${name}](${matches[1]})\n`;
            hasLinks = true;
            processed = processed.replace(pattern, '');
        }
    });

    if (hasLinks) {
        processed += linksSection;
    }

    return processed;
};

/**
 * Formata informações do token
 */
const formatTokenInfo = (tokenInfo) => {
    const { tokenId, marketCap, price } = tokenInfo;
    
    let tokenSection = '\n\n🪙 **Token Info:**\n';
    tokenSection += `📍 **Contract:** \`${tokenId}\`\n`;
    
    if (marketCap) {
        tokenSection += `💎 **Market Cap:** ${marketCap}\n`;
    }
    
    if (price) {
        tokenSection += `💰 **Price:** ${price}\n`;
    }

    return tokenSection;
};

/**
 * Formata o relatório de risco de forma moderna
 */
const formatRiskReport = (report) => {
    if (!report) return '';

    // Verifica se é um warning para token novo
    if (report.warning) {
        let warningSection = '\n\n⚠️ **TOKEN WARNING**\n';
        warningSection += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        warningSection += `🟡 **Status:** New Token\n`;
        warningSection += '📊 **Data:** Not Available\n';
        warningSection += '⚠️ **Caution:** High Risk\n';
        warningSection += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        warningSection += '\n🚨 **No risk analysis available for this token!**\n';
        warningSection += '💡 **Recommendation:** Wait for data or proceed with extreme caution\n';
        return warningSection;
    }

    const { token_program, token_type, risks, score, score_normalised } = report;

    let riskSection = '\n\n🛡️ **RISK ANALYSIS**\n';
    riskSection += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    
    if (token_program) {
        riskSection += `🔧 **Program:** ${token_program}\n`;
    }
    
    if (token_type) {
        riskSection += `📋 **Type:** ${token_type}\n`;
    }

    // Score com cores baseadas no risco
    const scoreEmoji = getScoreEmoji(score_normalised);
    riskSection += `${scoreEmoji} **Risk Score:** ${score_normalised || 0}/100\n`;
    riskSection += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    // Fatores de risco
    if (risks && risks.length > 0) {
        riskSection += '\n⚠️ **Risk Factors:**\n';
        risks.forEach(risk => {
            const levelEmoji = getRiskLevelEmoji(risk.level);
            riskSection += `${levelEmoji} **${risk.name}**\n`;
            riskSection += `  ↳ ${risk.description}`;
            if (risk.value) {
                riskSection += ` (${risk.value})`;
            }
            riskSection += `\n  ↳ Score: ${risk.score}\n\n`;
        });
    } else {
        riskSection += '\n✅ **No significant risks detected**\n';
    }

    return riskSection;
};

/**
 * Retorna emoji baseado no score de risco
 */
const getScoreEmoji = (score) => {
    if (score <= 30) return '🟢';
    if (score <= 60) return '🟡';
    if (score <= 80) return '🟠';
    return '🔴';
};

/**
 * Retorna emoji baseado no nível de risco
 */
const getRiskLevelEmoji = (level) => {
    switch (level?.toLowerCase()) {
        case 'low': return '🟢';
        case 'medium': return '🟡';
        case 'high': return '🟠';
        case 'critical': return '🔴';
        default: return '⚪';
    }
};

/**
 * Extrai informações do token de uma mensagem
 */
export const extractTokenInfo = (description) => {
    if (!description) return null;

    // Extrai token ID - ordem de prioridade para capturar o token correto
    const tokenIdMatch = 
        // Primeiro tenta capturar token entre backticks (mais confiável)
        description.match(/`([A-Za-z0-9]{32,})`/)?.[1] ||
        // Depois tenta URLs específicas
        description.match(/https:\/\/gmgn\.ai\/sol\/token\/([A-Za-z0-9_-]+)/)?.[1] ||
        description.match(/https:\/\/dexscreener\.com\/solana\/([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/axiom\.trade\/t\/([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/neo\.bullx\.io\/terminal\?chainId=\d+&address=([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/t\.me\/ray_cyan_bot\?start=buy__([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/photon-sol\.tinyastro\.io\/en\/lp\/([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/t\.me\/ape_pro_solana_bot\?start=ape_ray_([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/t\.me\/BloomSolana_bot\?start=ref_RAYBOT_ca_([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/t\.me\/TradeonNovaBot\?start=r-raybot-([A-Za-z0-9]{32,})/)?.[1] ||
        description.match(/https:\/\/axiom\.trade\/t\/([A-Za-z0-9]{32,})\/@raybot/)?.[1];

    if (!tokenIdMatch) return null;

    // Extrai market cap - melhorada para capturar diferentes formatos
    const marketCapMatch = description.match(/MC[:\s]*\$?([0-9,]+\.?\d*[MKB]?)/i);
    const marketCap = marketCapMatch ? `$${marketCapMatch[1]}` : null;

    // Extrai preço
    const priceMatch = description.match(/@\$([0-9.]+)/);
    const price = priceMatch ? `$${priceMatch[1]}` : null;

    return {
        tokenId: tokenIdMatch,
        marketCap,
        price
    };
};
