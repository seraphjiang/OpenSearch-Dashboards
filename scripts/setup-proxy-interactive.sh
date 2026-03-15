#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AWS OpenSearch Proxy - Quick Setup                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Paste your cookies below and press Enter:"
echo "(The line will be hidden for security)"
echo ""
read -s COOKIES
echo ""

if [ -z "$COOKIES" ]; then
    echo "❌ No cookies provided"
    exit 1
fi

echo "✅ Received cookies (${#COOKIES} characters)"
echo ""

# Escape special characters for sed
ESCAPED=$(printf '%s\n' "$COOKIES" | sed 's/[[\.*^$/]/\\&/g')

# Backup and update
cp scripts/proxy_to_aws.js scripts/proxy_to_aws.js.bak 2>/dev/null
sed -i.tmp "s|const AWS_COOKIES = .*|const AWS_COOKIES = '$ESCAPED';|" scripts/proxy_to_aws.js
rm -f scripts/proxy_to_aws.js.tmp

echo "✅ Proxy configured!"
echo ""
echo "🚀 Starting proxy server..."
echo ""
echo "Press Ctrl+C to stop"
echo "═══════════════════════════════════════════════════════════"
echo ""

node scripts/proxy_to_aws.js
