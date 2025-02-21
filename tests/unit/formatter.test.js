// filepath: /tests/unit/formatter.test.js
import { formattedMessage } from '../../src/utils/formatter.js';

describe('Formatter Utility', () => {
    it('deve formatar corretamente uma mensagem sem anexos ou embeds', () => {
        const message = {
            author: { username: 'TestUser', discriminator: '1234' },
            channel_id: '123456789012345678',
            content: 'Mensagem de teste',
            timestamp: new Date().toISOString(),
            edited_timestamp: null,
            attachments: [],
            embeds: []
        };

        const result = formattedMessage(message);

        expect(result).toContain('**TestUser#1234**');
        expect(result).toContain('📍 **Canal:** 123456789012345678');
        expect(result).toContain('💬 Mensagem de teste');
    });

    it('deve formatar mensagens com anexos de imagem corretamente', () => {
        const message = {
            author: { username: 'ImageUser', discriminator: '5678' },
            channel_id: '876543210987654321',
            content: 'Veja esta imagem',
            timestamp: new Date().toISOString(),
            edited_timestamp: null,
            attachments: [
                {
                    content_type: 'image/png',
                    url: 'http://example.com/image.png',
                    filename: 'image.png'
                }
            ],
            embeds: []
        };

        const result = formattedMessage(message);

        expect(result).toContain('[Image](http://example.com/image.png)');
    });

    // Adicione mais casos de teste conforme necessário
});