// filepath: /tests/integration/messageController.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/index.js';

describe('Message Controller API', () => {
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

    describe('POST /api/retrieve-messages', () => {
        it('deve extrair mensagens com sucesso', async () => {
            const response = await request(app)
                .post('/api/retrieve-messages')
                .send({ channelId: '123456789012345678', hours: 2 })
                .expect(200);
            
            expect(response.body).toHaveProperty('message', 'Mensagens coletadas com sucesso.');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('deve retornar erro se channelId não for fornecido', async () => {
            const response = await request(app)
                .post('/api/retrieve-messages')
                .send({ hours: 2 })
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'channelId é obrigatório.');
        });
    });

    describe('GET /api/download-messages', () => {
        it('deve baixar mensagens como arquivo JSON', async () => {
            const response = await request(app)
                .get('/api/download-messages')
                .expect(200)
                .expect('Content-Type', /application\/json/);
            
            expect(response.headers['content-disposition']).toContain('attachment; filename=messages.txt');
            expect(response.body).toBeDefined();
        });
    });
});