# AsyncAPI Installation & Usage Guide

## Overview
AsyncAPI is the industry standard for documenting event-driven APIs like WebSockets. It's essentially "Swagger for WebSockets."

## Installation Options

### 1. AsyncAPI Studio (Online - Recommended for viewing)
Visit: https://studio.asyncapi.com/
- Paste your `asyncapi.yaml` content
- View beautiful documentation
- No installation required

### 2. AsyncAPI CLI (Local development)
```bash
# Install globally
npm install -g @asyncapi/cli

# Generate HTML documentation
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template -o docs/

# Start development server
asyncapi start studio asyncapi.yaml
```

### 3. AsyncAPI React Component (For integration)
```bash
npm install @asyncapi/react-component

# Use in your React app
import { AsyncApiComponent } from '@asyncapi/react-component';
```

## Generated Documentation Features

The AsyncAPI documentation will provide:

### 📋 **Complete API Overview**
- Server endpoints (production & local)
- Authentication requirements
- Connection flow

### 🔄 **Event Documentation**
- All WebSocket events with examples
- Request/response schemas
- Real code samples

### 📝 **Interactive Examples**
- Copy-paste ready JavaScript code
- Authentication flows
- Subscription patterns

### 🎯 **Schema Validation**
- TypeScript-style type definitions
- JSON Schema validation
- Example payloads

## Comparison: AsyncAPI vs Swagger WebSocket Workaround

| Feature | AsyncAPI | Swagger Workaround |
|---------|----------|-------------------|
| Native WebSocket Support | ✅ Full | ❌ Hack/Limited |
| Event Documentation | ✅ Perfect | ⚠️ Confusing |
| Code Generation | ✅ Yes | ❌ No |
| Industry Standard | ✅ Yes | ❌ Misleading |
| Real-time Events | ✅ Native | ❌ Fake HTTP |
| Developer Experience | ✅ Excellent | ⚠️ Poor |

## Best Practice Recommendation

**Use AsyncAPI for WebSocket documentation** and keep Swagger for HTTP REST APIs:

```
📁 Project Structure
├── swagger.yaml      (HTTP REST APIs)
├── asyncapi.yaml     (WebSocket APIs)  
├── docs/
│   ├── http/         (Generated Swagger docs)
│   └── websocket/    (Generated AsyncAPI docs)
```

## Integration with Your Project

1. **Keep existing Swagger** for HTTP endpoints
2. **Add AsyncAPI** for WebSocket events  
3. **Link both** in your main documentation
4. **Host both** documentation sets

This gives developers the best experience for each API type.
