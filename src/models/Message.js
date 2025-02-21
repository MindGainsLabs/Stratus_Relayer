import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    username: { type: String, required: true },
    description: { type: String, required: true },
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false
});

const Message = mongoose.model('Message', messageSchema);

export default Message;