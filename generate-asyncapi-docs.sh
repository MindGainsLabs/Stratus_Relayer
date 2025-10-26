#!/bin/bash

# AsyncAPI Documentation Generator Script
# This script installs AsyncAPI CLI and generates beautiful WebSocket documentation

echo "🚀 AsyncAPI Documentation Generator for Stratus Relayer"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install AsyncAPI CLI globally
echo "📦 Installing AsyncAPI CLI..."
npm install -g @asyncapi/cli

if [ $? -eq 0 ]; then
    echo "✅ AsyncAPI CLI installed successfully"
else
    echo "❌ Failed to install AsyncAPI CLI"
    exit 1
fi

# Create docs directory if it doesn't exist
if [ ! -d "docs" ]; then
    mkdir -p docs
    echo "📁 Created docs directory"
fi

# Generate HTML documentation
echo "📚 Generating AsyncAPI HTML documentation..."
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template -o docs/websocket-api

if [ $? -eq 0 ]; then
    echo "✅ HTML documentation generated in docs/websocket-api/"
else
    echo "❌ Failed to generate HTML documentation"
fi

# Generate Markdown documentation
echo "📝 Generating AsyncAPI Markdown documentation..."
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/markdown-template -o docs/websocket-api-md

if [ $? -eq 0 ]; then
    echo "✅ Markdown documentation generated in docs/websocket-api-md/"
else
    echo "❌ Failed to generate Markdown documentation"
fi

echo ""
echo "🎉 Documentation generation complete!"
echo ""
echo "📖 View your documentation:"
echo "   • HTML: Open docs/websocket-api/index.html in your browser"
echo "   • Markdown: See docs/websocket-api-md/"
echo "   • Online: Visit https://studio.asyncapi.com/ and paste asyncapi.yaml"
echo ""
echo "🔧 Development commands:"
echo "   • Start AsyncAPI Studio: asyncapi start studio asyncapi.yaml"
echo "   • Validate spec: asyncapi validate asyncapi.yaml"
echo "   • Convert to JSON: asyncapi convert asyncapi.yaml"
echo ""
echo "📚 Learn more: https://www.asyncapi.com/docs/tools/cli"
