import express from 'express';
import { getMessages, downloadMessages } from '../controllers/messageController.js';

const router = express.Router();

router.post('/retrieve-messages', getMessages);
router.get('/download-messages', downloadMessages);

export default router;