import connectDB from '../config/db.js';
import crypto from 'crypto';
import ApiToken from '../models/ApiToken.js';

const generateApiToken = async (subscriptionType = 'limited', usageLimit = 1000) => {
    const token = crypto.randomBytes(32).toString('hex');
    const newToken = new ApiToken({ token, subscriptionType, usageLimit });
    await newToken.save();
    return newToken;
};

connectDB().then(() => {
    generateApiToken('unlimited')
        .then(tokenObj => {
            console.log('Token gerado:', tokenObj);
            process.exit(0);
        })
        .catch(err => {
            console.error('Erro ao gerar token:', err);
            process.exit(1);
        });
});