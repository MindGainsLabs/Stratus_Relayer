// filepath: /tests/performance/messageController.performance.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/index.js'; // Assegure-se que seu app está exportado

describe('Performance Tests for Message Controller API', () => {
    beforeAll(async () => {
        // Conectar ao banco de dados de teste
        await mongoose.connect(process.env.MONGO_URI_TEST, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        // Desconectar e limpar o banco de dados
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
    });

    it('deve responder ao extrair mensagens em menos de 2 segundos', async () => {
        const start = Date.now();
        const response = await request(app)
            .post('/api/retrieve-messages')
            .send({ channelId: '123456789012345678', hours: 2 })
            .expect(200);
        const duration = Date.now() - start;

        console.log(`Duração do POST /api/retrieve-messages: ${duration}ms`);
        expect(duration).toBeLessThan(2000); // 2 segundos
    });

    it('deve responder ao baixar mensagens em menos de 1 segundo', async () => {
        const start = Date.now();
        const response = await request(app)
            .get('/api/download-messages')
            .expect(200);
        const duration = Date.now() - start;

        console.log(`Duração do GET /api/download-messages: ${duration}ms`);
        expect(duration).toBeLessThan(1000); // 1 segundo
    });
});