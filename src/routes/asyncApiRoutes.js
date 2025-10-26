import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @swagger
 * tags:
 *   name: AsyncAPI Documentation
 *   description: AsyncAPI WebSocket documentation endpoints
 */

/**
 * @swagger
 * /docs/websocket:
 *   get:
 *     summary: View AsyncAPI WebSocket documentation
 *     tags: [AsyncAPI Documentation]
 *     description: |
 *       **AsyncAPI WebSocket Documentation**
 *       
 *       View the complete AsyncAPI documentation for WebSocket events.
 *       
 *       **Features:**
 *       - ✅ All WebSocket events documented
 *       - ✅ Request/response schemas
 *       - ✅ Authentication flows
 *       - ✅ Real-world examples
 *       
 *       **Alternative Access:**
 *       - **Online Studio:** https://studio.asyncapi.com/ (paste asyncapi.yaml)
 *       - **Raw YAML:** /docs/websocket/yaml
 *       - **Markdown:** /docs/websocket/markdown
 *     responses:
 *       200:
 *         description: AsyncAPI documentation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "HTML page with AsyncAPI documentation"
 */
router.get('/websocket', (req, res) => {
    try {
        // Read the generated markdown documentation
        const markdownPath = path.join(__dirname, '../../docs/websocket-api-md/asyncapi.md');
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        // Create a simple HTML wrapper for the markdown
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stratus Relayer WebSocket API Documentation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.4.0/github-markdown-light.min.css">
    <style>
        body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
            background-color: #f6f8fa;
        }
        .markdown-body {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .badges {
            margin: 20px 0;
        }
        .badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-right: 8px;
            text-decoration: none;
        }
        .badge.studio { background: #007bff; }
        .badge.yaml { background: #17a2b8; }
        .badge.markdown { background: #6c757d; }
        .notice {
            background: #e9ecef;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="markdown-body">
        <div class="header">
            <h1>🚀 Stratus Relayer WebSocket API</h1>
            <p>Complete AsyncAPI documentation for real-time crypto tracking</p>
        </div>
        
        <div class="badges">
            <a href="https://studio.asyncapi.com/" target="_blank" class="badge studio">
                📋 AsyncAPI Studio
            </a>
            <a href="/docs/websocket/yaml" class="badge yaml">
                📄 Raw YAML
            </a>
            <a href="/docs/websocket/markdown" class="badge markdown">
                📝 Raw Markdown
            </a>
            <a href="/api-docs" class="badge">
                🔗 HTTP API Docs
            </a>
        </div>

        <div class="notice">
            <strong>💡 Pro Tip:</strong> For the best experience, copy the <a href="/docs/websocket/yaml">YAML content</a> 
            and paste it into <a href="https://studio.asyncapi.com/" target="_blank">AsyncAPI Studio</a> 
            for interactive documentation.
        </div>

        <div id="content">
            ${markdownToHtml(markdownContent)}
        </div>
    </div>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error serving AsyncAPI documentation:', error);
        res.status(500).json({
            error: 'Failed to load AsyncAPI documentation',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /docs/websocket/yaml:
 *   get:
 *     summary: Get AsyncAPI YAML specification
 *     tags: [AsyncAPI Documentation]
 *     description: Download the raw AsyncAPI YAML specification for WebSocket events
 *     responses:
 *       200:
 *         description: AsyncAPI YAML specification
 *         content:
 *           text/yaml:
 *             schema:
 *               type: string
 */
router.get('/websocket/yaml', (req, res) => {
    try {
        const yamlPath = path.join(__dirname, '../../asyncapi.yaml');
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', 'inline; filename="stratus-relayer-asyncapi.yaml"');
        res.send(yamlContent);
    } catch (error) {
        console.error('Error serving AsyncAPI YAML:', error);
        res.status(500).json({
            error: 'Failed to load AsyncAPI YAML specification',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /docs/websocket/markdown:
 *   get:
 *     summary: Get AsyncAPI Markdown documentation
 *     tags: [AsyncAPI Documentation]
 *     description: Download the generated AsyncAPI Markdown documentation
 *     responses:
 *       200:
 *         description: AsyncAPI Markdown documentation
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 */
router.get('/websocket/markdown', (req, res) => {
    try {
        const markdownPath = path.join(__dirname, '../../docs/websocket-api-md/asyncapi.md');
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'inline; filename="stratus-relayer-websocket-api.md"');
        res.send(markdownContent);
    } catch (error) {
        console.error('Error serving AsyncAPI Markdown:', error);
        res.status(500).json({
            error: 'Failed to load AsyncAPI Markdown documentation',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /docs/websocket/info:
 *   get:
 *     summary: Get AsyncAPI integration information
 *     tags: [AsyncAPI Documentation]
 *     description: Get information about AsyncAPI integration and available endpoints
 *     responses:
 *       200:
 *         description: AsyncAPI integration information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 description:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                 tools:
 *                   type: object
 */
router.get('/websocket/info', (req, res) => {
    res.json({
        name: "Stratus Relayer AsyncAPI Integration",
        version: "1.0.0",
        description: "AsyncAPI documentation for WebSocket events",
        endpoints: {
            documentation: "/docs/websocket",
            yaml: "/docs/websocket/yaml",
            markdown: "/docs/websocket/markdown",
            info: "/docs/websocket/info"
        },
        tools: {
            "AsyncAPI Studio": "https://studio.asyncapi.com/",
            "AsyncAPI CLI": "npm install -g @asyncapi/cli",
            "Generator": "asyncapi generate fromTemplate asyncapi.yaml @asyncapi/markdown-template"
        },
        websocket: {
            production: "ws://srv800316.hstgr.cloud:8081",
            local: "ws://localhost:8081"
        },
        integration: {
            swagger: "/api-docs",
            dashboard: "/websocket-dashboard.html",
            examples: "/examples"
        }
    });
});

// Simple markdown to HTML converter (basic)
function markdownToHtml(markdown) {
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img alt="$1" src="$2" />')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
        .replace(/\n/gim, '<br>');
}

export default router;
