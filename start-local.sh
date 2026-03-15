#!/bin/bash

# Quick start script for local OpenSearch Dashboards development

echo "🚀 Starting Local OpenSearch Dashboards"
echo "════════════════════════════════════════"
echo ""

# Switch to correct Node version
echo "📦 Switching to Node 22..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

echo ""
echo "✅ Node version: $(node --version)"
echo ""

# Check if OpenSearch is running
if ! curl -s http://localhost:9200 > /dev/null; then
    echo "⚠️  OpenSearch not running on localhost:9200"
    echo ""
    echo "Starting OpenSearch snapshot..."
    yarn opensearch snapshot &

    echo "⏳ Waiting for OpenSearch to start..."
    for i in {1..30}; do
        if curl -s http://localhost:9200 > /dev/null; then
            echo "✅ OpenSearch is ready!"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo ""
else
    echo "✅ OpenSearch already running"
fi

echo ""
echo "🎯 Starting OpenSearch Dashboards..."
echo "════════════════════════════════════════"
echo ""
echo "URL: http://localhost:5601"
echo "Press Ctrl+C to stop"
echo ""

yarn start
