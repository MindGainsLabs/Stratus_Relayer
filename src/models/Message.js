import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    channelId: { type: String, index: true },
    username: { type: String, required: true },
    description: { type: String, required: true },
    // Campos para persistir o primeiro preço observado do token associado à mensagem (se aplicável)
    tokenId: { type: String, index: true }, // mint address extraída da mensagem
    initialPriceNative: { type: Number }, // preço na moeda nativa (ex: SOL) apenas na primeira call
    initialPriceUSD: { type: Number }, // preço USD correspondente
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false
});

const Message = mongoose.model('Message', messageSchema);

export default Message;