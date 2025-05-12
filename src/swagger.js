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
            description: 'API for extracting and controlling Discord messages, with integration to SSE and Telegram',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'], // paths to annotations
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };