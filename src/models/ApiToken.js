import mongoose from 'mongoose';

const apiTokenSchema = new mongoose.Schema({
    token: { type: String, unique: true, required: true },
    subscriptionType: { type: String, enum: ['limited', 'unlimited'], required: true },
    usageCount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 1000 } // Define a limit for limited tokens
}, {
    timestamps: true,
    versionKey: false
});

const ApiToken = mongoose.model('ApiToken', apiTokenSchema);
export default ApiToken;