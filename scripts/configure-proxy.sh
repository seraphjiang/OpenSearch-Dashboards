#!/bin/bash

# Quick proxy configuration script
# Usage: ./configure-proxy.sh "your-cookie-string"

PROXY_FILE="scripts/proxy_to_aws.js"

echo "🔧 Configuring AWS Proxy..."
echo ""

if [ -z "$1" ]; then
    echo "❌ Error: No cookies provided"
    echo ""
    echo "Usage:"
    echo "  $0 \"your-cookie-string\""
    echo ""
    echo "Example:"
    echo "  $0 \"aws-token-a-c=eyJ...; awsd2c-token-c=eyJ...; session-id=...; sidt=...\""
    exit 1
fi

COOKIES="$1"

echo "📋 Cookie length: ${#COOKIES} characters"
echo ""

# Backup original
cp "$PROXY_FILE" "${PROXY_FILE}.bak"
echo "✅ Backed up: ${PROXY_FILE}.bak"

# Replace cookies (escape special characters)
ESCAPED_COOKIES=$(echo "$COOKIES" | sed 's/[\/&]/\\&/g')

# Use perl for more reliable substitution
perl -i -pe "s/const AWS_COOKIES = .*/const AWS_COOKIES = '$ESCAPED_COOKIES';/" "$PROXY_FILE"

echo "✅ Updated: $PROXY_FILE"
echo ""
echo "🚀 Starting proxy server..."
echo ""

# Start proxy
node "$PROXY_FILE"
