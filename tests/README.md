# WebSocket Testing Setup Instructions

## Quick Setup

Run the setup script to install all dependencies:

```bash
./setup.sh
```

## Manual Setup

If you prefer to set up manually:

### 1. Install main dependencies
```bash
npm install
```

### 2. Install test dependencies
```bash
cd tests
npm install
cd ..
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your actual configuration
```

## Running Tests

### WebSocket Tests
```bash
npm run test:websocket
```

### Watch mode (reruns tests on file changes)
```bash
npm run test:websocket:watch
```

### Verbose output
```bash
cd tests && npm run test:verbose
```

## Running Example Client

```bash
npm run example:websocket
```

Note: Make sure to set a valid JWT token in the example client before running.

## Dependencies

### Main Dependencies (already in package.json)
- socket.io: WebSocket server
- express: Web framework
- jsonwebtoken: JWT handling
- mongoose: MongoDB ODM

### Test Dependencies
- mocha: Test framework
- chai: Assertion library
- socket.io-client: WebSocket client for testing
- jsonwebtoken: JWT token generation for tests

## Environment Variables

Make sure these are set in your .env file:

```
JWT_SECRET=your-secret-key
PORT=80
MONGODB_URI=mongodb://localhost:27017/stratus_relayer
```

## Troubleshooting

1. **Connection refused**: Make sure the server is running
2. **Authentication failed**: Check JWT_SECRET in .env
3. **MongoDB errors**: Ensure MongoDB is running
4. **Port conflicts**: Change PORT in .env if needed
