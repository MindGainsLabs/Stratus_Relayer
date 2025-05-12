// filepath: /home/ubuntu/Stratus_Relayer/src/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
dotenv.config();

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stratus Relayer API',
            version: '1.0.0',
            description: 'API para extração e controle de mensagens do Discord, com integração a SSE e Telegram',
        },
        servers: [
            {
                url: `http://srv711516.hstgr.cloud`,
                description: 'Servidor de produção',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'], // caminhos onde estão as anotações
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };