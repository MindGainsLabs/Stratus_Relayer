#!/bin/bash

# Stratus_Relayer Setup Script
echo "🚀 Setting up Stratus_Relayer WebSocket Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"

# Install main dependencies
echo -e "${BLUE}📦 Installing main dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Main dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install main dependencies${NC}"
    exit 1
fi

# Setup test environment
echo -e "${BLUE}🧪 Setting up test environment...${NC}"
cd tests
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install test dependencies${NC}"
    exit 1
fi

cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚙️  Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your actual configuration values${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✅ Created logs directory${NC}"

# Check MongoDB connection (optional)
echo -e "${BLUE}🔍 Checking MongoDB connection...${NC}"
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.adminCommand('ping')" --quiet; then
        echo -e "${GREEN}✅ MongoDB is running and accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB is not running or not accessible${NC}"
        echo -e "${YELLOW}   Make sure MongoDB is installed and running${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  MongoDB shell (mongosh) not found${NC}"
    echo -e "${YELLOW}   Make sure MongoDB is installed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Edit .env file with your configuration"
echo -e "   2. Make sure MongoDB is running"
echo -e "   3. Start the server: ${YELLOW}npm start${NC}"
echo -e "   4. Run WebSocket tests: ${YELLOW}npm run test:websocket${NC}"
echo -e "   5. Try the example client: ${YELLOW}npm run example:websocket${NC}"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo -e "   - WebSocket API: README_WEBSOCKETS.md"
echo -e "   - Example client: examples/websocket-client.js"
echo -e "   - Tests: tests/websocket.test.js"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
