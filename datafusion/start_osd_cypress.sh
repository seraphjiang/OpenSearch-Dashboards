#!/bin/bash
# Start OpenSearch Dashboards configured for Cypress testing (matching CI environment)

set -e

# Load nvm if available
if [ -f "$HOME/.zshenv" ]; then
  source "$HOME/.zshenv"
fi

# Use correct Node version
if command -v nvm &> /dev/null; then
  nvm use 22
fi

# Set environment variables matching CI
export OSD_OPTIMIZER_THEMES=v8light
export NODE_OPTIONS='--max-old-space-size=6144 --dns-result-order=ipv4first'
export CYPRESS_VISBUILDER_ENABLED=true
export CYPRESS_DATASOURCE_MANAGEMENT_ENABLED=false

echo "========================================="
echo "Starting OpenSearch Dashboards for Cypress Testing"
echo "========================================="
echo "Node version: $(node --version)"
echo "Environment:"
echo "  - OSD_OPTIMIZER_THEMES=$OSD_OPTIMIZER_THEMES"
echo "  - NODE_OPTIONS=$NODE_OPTIONS"
echo "  - CYPRESS_VISBUILDER_ENABLED=$CYPRESS_VISBUILDER_ENABLED"
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

# Start OSD with CI configuration
echo "Starting OpenSearch Dashboards with CI configuration..."
echo ""

node scripts/opensearch_dashboards \
  --dev \
  --no-base-path \
  --no-watch \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --csp.warnLegacyBrowsers=false \
  --uiSettings.overrides["query:enhancements:enabled"]=true \
  --uiSettings.overrides['home:useNewHomePage']=true \
  --data_source.enabled=true \
  --workspace.enabled=true \
  --opensearch.ignoreVersionMismatch=true
