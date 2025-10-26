import ApiToken from '../models/ApiToken.js';

const authenticateToken = async (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
        token = req.query.token;
    }
    try {
        const apiToken = await ApiToken.findOne({ token });
        if (!apiToken) {
            return res.status(401).json({ error: 'Token inválido.' });
        }
        // If the token is limited, check and update its usage
        if (apiToken.subscriptionType === 'limited') {
            if (apiToken.usageCount >= apiToken.usageLimit) {
                return res.status(429).json({ error: 'Limite de uso excedido.' });
            }
            apiToken.usageCount += 1;
            await apiToken.save();
        }
        // Attach token info to the request (optional)
        req.apiToken = apiToken;
        next();
    } catch (error) {
        console.error('Erro na autenticação do token:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * WebSocket authentication function
 * @param {string} token - Authentication token
 * @returns {Object|null} User object if authenticated, null if not
 */
const authenticateTokenWS = async (token) => {
    try {
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        const apiToken = await ApiToken.findOne({ token: cleanToken });
        if (!apiToken) {
            return null;
        }
        
        // If the token is limited, check and update its usage
        if (apiToken.subscriptionType === 'limited') {
            if (apiToken.usageCount >= apiToken.usageLimit) {
                throw new Error('Limite de uso excedido.');
            }
            apiToken.usageCount += 1;
            await apiToken.save();
        }
        
        // Return user info
        return {
            id: apiToken._id,
            token: apiToken.token,
            subscriptionType: apiToken.subscriptionType,
            usageCount: apiToken.usageCount,
            usageLimit: apiToken.usageLimit,
            isActive: true
        };
    } catch (error) {
        console.error('Erro na autenticação WebSocket do token:', error);
        throw error;
    }
};

export { authenticateToken, authenticateTokenWS };