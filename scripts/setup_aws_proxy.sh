#!/bin/bash

# AWS OpenSearch Dashboards Proxy Setup Script
# This script helps you configure the CORS proxy for Swagger UI testing

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AWS OpenSearch Dashboards Proxy Setup                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if proxy_to_aws.js exists
PROXY_FILE="$(dirname "$0")/proxy_to_aws.js"
if [ ! -f "$PROXY_FILE" ]; then
    echo "❌ Error: proxy_to_aws.js not found at $PROXY_FILE"
    exit 1
fi

echo "📝 Step 1: Get your cookies from browser"
echo ""
echo "1. Open: https://application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com/w/yCdEiL/app/dashboards"
echo "2. Open DevTools (F12 or Cmd+Option+I)"
echo "3. Run the cookie extraction script from /tmp/extract-cookies.js"
echo "4. Copy the cookies from 'Ready to paste format' section"
echo ""
read -p "Paste your cookies here: " COOKIES
echo ""

if [ -z "$COOKIES" ]; then
    echo "❌ No cookies provided. Exiting."
    exit 1
fi

echo "✅ Cookies received (length: ${#COOKIES})"
echo ""

# Create configured proxy file
CONFIGURED_PROXY="$(dirname "$0")/aws_proxy_configured.js"

echo "📝 Step 2: Creating configured proxy..."

# Read the template and replace cookies
sed "s|const AWS_COOKIES = \[.*\];|const AWS_COOKIES = '$COOKIES';|" "$PROXY_FILE" > "$CONFIGURED_PROXY"

echo "✅ Configured proxy created: $CONFIGURED_PROXY"
echo ""

# Make it executable
chmod +x "$CONFIGURED_PROXY"

echo "📝 Step 3: Starting proxy server..."
echo ""

# Start the proxy
node "$CONFIGURED_PROXY"
