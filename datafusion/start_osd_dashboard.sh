#!/bin/bash
# Start OpenSearch Dashboards with TRADITIONAL UI configuration
# Use for: Group 11 (dashboard_sanity_test)

set -e

# Load nvm if available
if [ -f "$HOME/.zshenv" ]; then
  source "$HOME/.zshenv"
fi

# Use correct Node version
if command -v nvm &> /dev/null; then
  nvm use 22
fi

# Set environment variables
export OSD_OPTIMIZER_THEMES=v8light
export NODE_OPTIONS='--max-old-space-size=6144 --dns-result-order=ipv4first'

echo "========================================="
echo "Starting OSD with TRADITIONAL UI (Dashboard Config)"
echo "========================================="
echo "Node version: $(node --version)"
echo "Configuration: Traditional Dashboard (NO workspace)"
echo "Compatible with: Group 11 (dashboard_sanity_test)"
echo "========================================="
echo ""

# Check if OpenSearch is running
if ! curl -s http://localhost:9200 > /dev/null 2>&1; then
  echo "⚠️  WARNING: OpenSearch is not running on localhost:9200"
  echo "Please start OpenSearch first:"
  echo "  yarn opensearch snapshot"
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Start OSD with traditional dashboard configuration
echo "Starting OpenSearch Dashboards with traditional UI..."
echo ""

node scripts/opensearch_dashboards \
  --dev \
  --no-base-path \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --home.disableExperienceModal=true
