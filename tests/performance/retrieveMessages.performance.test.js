// filepath: /tests/performance/retrieveMessages.performance.test.js
import { retrieveMessages } from '../../src/services/messageService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

describe('Performance Tests for retrieveMessages Function', () => {
    beforeAll(async () => {
        // Conectar ao banco de dados de teste
        await mongoose.connect(process.env.MONGO_URI_TEST);
    });

    afterAll(async () => {
        // Desconectar e limpar o banco de dados
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
    });

    it('deve processar mensagens em menos de 3 segundos', async () => {
        const start = Date.now();
        const messages = await retrieveMessages('123456789012345678', 2);
        const duration = Date.now() - start;

        console.log(`Duração da função retrieveMessages: ${duration}ms`);
        expect(duration).toBeLessThan(3000); // 3 segundos
        expect(Array.isArray(messages)).toBe(true);
    });
});