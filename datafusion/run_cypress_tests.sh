#!/bin/bash
# Intelligent Cypress test runner that automatically configures OSD
# Maps test groups to required OSD configurations

set -e

# Load nvm if available
if [ -f "$HOME/.zshenv" ]; then
  source "$HOME/.zshenv"
fi

# Use correct Node version
if command -v nvm &> /dev/null; then
  nvm use 22
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "========================================="
echo "Intelligent Cypress Test Runner"
echo "========================================="
echo ""

# Function to detect OSD configuration
detect_osd_config() {
  if ! pgrep -f "opensearch_dashboards --dev" > /dev/null 2>&1; then
    echo "none"
    return
  fi

  # Get the full command line of OSD process
  local cmd=$(ps aux | grep -E "opensearch_dashboards --dev" | grep -v grep | head -1)

  if echo "$cmd" | grep -q "workspace.enabled=true"; then
    if echo "$cmd" | grep -q "explore.enabled=true"; then
      echo "explore"
    else
      echo "query_enhanced"
    fi
  else
    echo "dashboard"
  fi
}

# Check if services are running
check_service() {
  local url=$1
  local name=$2

  if curl -s "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name is running"
    return 0
  else
    echo -e "${RED}✗${NC} $name is NOT running"
    return 1
  fi
}

echo "Checking services..."
OPENSEARCH_OK=0
OSD_OK=0
CURRENT_CONFIG="none"

if check_service "http://localhost:9200" "OpenSearch"; then
  OPENSEARCH_OK=1
fi

if check_service "http://localhost:5601/api/status" "OpenSearch Dashboards"; then
  OSD_OK=1
  CURRENT_CONFIG=$(detect_osd_config)
  echo -e "${CYAN}Current OSD config:${NC} $CURRENT_CONFIG"
fi

echo ""

# Test group selection
echo "========================================="
echo "Available Test Groups:"
echo "========================================="
echo ""
echo "${BLUE}Query Enhancements (Workspace UI):${NC}"
echo "  10  - Query enhancements (01) - Basic queries"
echo "  12  - Query enhancements (02) - Dataset selector, saved queries"
echo "  13  - Query enhancements (03) - Caching, CSV, field filtering"
echo "  14  - Query enhancements (04) - Advanced settings, more queries"
echo "  15  - Query enhancements (05) - Autocomplete, recent queries"
echo ""
echo "${BLUE}Traditional Dashboard UI:${NC}"
echo "  11  - Dashboard sanity test ${YELLOW}[Traditional UI - NO workspace]${NC}"
echo ""
echo "${BLUE}Explore Feature (Enhanced Workspace UI):${NC}"
echo "  10e - Explore (01) - AI editor, queries, saved search"
echo "  12e - Explore (02) - Dataset selector, language display"
echo "  13e - Explore (03) - Field stats, inspect, CSV"
echo "  14e - Explore (04) - Histogram, traces, Prometheus"
echo "  15e - Explore (05) - Autocomplete UI, sidebar"
echo "  16e - Explore (06) - Add to dashboard, rule matching"
echo "  17e - Explore (07) - More rule matching visualizations"
echo ""
echo "${BLUE}Special:${NC}"
echo "  s3  - S3 data source tests ${YELLOW}[Requires S3 credentials]${NC}"
echo "  s3e - S3 explore tests ${YELLOW}[Requires S3 credentials]${NC}"
echo ""

read -p "Select test group (default: 11): " TEST_GROUP
TEST_GROUP=${TEST_GROUP:-11}

# Map test group to required configuration
case $TEST_GROUP in
  10|12|13|14|15)
    REQUIRED_CONFIG="query_enhanced"
    CONFIG_NAME="Query Enhanced (Workspace UI)"
    START_SCRIPT="./start-osd-cypress.sh"
    ;;
  11)
    REQUIRED_CONFIG="dashboard"
    CONFIG_NAME="Traditional Dashboard UI"
    START_SCRIPT="./start-osd-dashboard.sh"
    ;;
  10e|12e|13e|14e|15e|16e|17e)
    REQUIRED_CONFIG="explore"
    CONFIG_NAME="Explore Feature UI"
    START_SCRIPT="./start-osd-explore.sh"
    ;;
  s3)
    REQUIRED_CONFIG="query_enhanced"
    CONFIG_NAME="Query Enhanced (Workspace UI) + S3"
    START_SCRIPT="./start-osd-cypress.sh"
    ;;
  s3e)
    REQUIRED_CONFIG="explore"
    CONFIG_NAME="Explore Feature UI + S3"
    START_SCRIPT="./start-osd-explore.sh"
    ;;
  *)
    echo -e "${RED}Invalid selection${NC}"
    exit 1
    ;;
esac

# Determine spec
case $TEST_GROUP in
  10)
    SPEC=$(yarn --silent osd:ciGroup10)
    DESC="Query enhancements (01)"
    ;;
  11)
    SPEC=$(yarn --silent osd:ciGroup11)
    DESC="Dashboard sanity test"
    ;;
  12)
    SPEC=$(yarn --silent osd:ciGroup12)
    DESC="Query enhancements (02)"
    ;;
  13)
    SPEC=$(yarn --silent osd:ciGroup13)
    DESC="Query enhancements (03)"
    ;;
  14)
    SPEC=$(yarn --silent osd:ciGroup14)
    DESC="Query enhancements (04)"
    ;;
  15)
    SPEC=$(yarn --silent osd:ciGroup15)
    DESC="Query enhancements (05)"
    ;;
  s3)
    SPEC=$(yarn --silent osd:ciGroupS3)
    DESC="S3 data source tests"
    ;;
  10e)
    SPEC=$(yarn --silent osd:ciGroup10Explore)
    DESC="Explore (01)"
    ;;
  12e)
    SPEC=$(yarn --silent osd:ciGroup12Explore)
    DESC="Explore (02)"
    ;;
  13e)
    SPEC=$(yarn --silent osd:ciGroup13Explore)
    DESC="Explore (03)"
    ;;
  14e)
    SPEC=$(yarn --silent osd:ciGroup14Explore)
    DESC="Explore (04)"
    ;;
  15e)
    SPEC=$(yarn --silent osd:ciGroup15Explore)
    DESC="Explore (05)"
    ;;
  16e)
    SPEC=$(yarn --silent osd:ciGroup16Explore)
    DESC="Explore (06)"
    ;;
  17e)
    SPEC=$(yarn --silent osd:ciGroup17Explore)
    DESC="Explore (07)"
    ;;
  s3e)
    SPEC=$(yarn --silent osd:ciGroupS3Explore)
    DESC="S3 explore tests"
    ;;
esac

echo ""
echo "========================================="
echo "Test Configuration"
echo "========================================="
echo -e "${CYAN}Test Group:${NC} $TEST_GROUP - $DESC"
echo -e "${CYAN}Required Config:${NC} $CONFIG_NAME"
echo -e "${CYAN}Spec:${NC} $SPEC"
echo "========================================="
echo ""

# Check if configuration matches
CONFIG_MISMATCH=false
if [ "$OSD_OK" -eq 1 ]; then
  if [ "$CURRENT_CONFIG" != "$REQUIRED_CONFIG" ]; then
    CONFIG_MISMATCH=true
    echo -e "${YELLOW}⚠️  Configuration Mismatch!${NC}"
    echo -e "   Current: ${RED}$CURRENT_CONFIG${NC}"
    echo -e "   Required: ${GREEN}$REQUIRED_CONFIG${NC}"
    echo ""
    echo "The test will likely fail with the current configuration."
    echo ""
    read -p "Restart OSD with correct configuration? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
      echo "Stopping current OSD..."
      pkill -f "opensearch_dashboards --dev" || true
      sleep 2
      OSD_OK=0
      CURRENT_CONFIG="none"
    fi
  else
    echo -e "${GREEN}✓ Configuration matches!${NC}"
    echo ""
  fi
fi

# Start OSD if needed
if [ "$OSD_OK" -eq 0 ]; then
  if [ "$OPENSEARCH_OK" -eq 0 ]; then
    echo -e "${RED}OpenSearch is not running!${NC}"
    echo "Please start OpenSearch first:"
    echo "  yarn opensearch snapshot"
    echo ""
    exit 1
  fi

  echo "Starting OSD with $CONFIG_NAME..."
  echo "Command: $START_SCRIPT"
  echo ""

  # Check for S3 credentials if needed
  if [[ "$TEST_GROUP" == "s3"* ]]; then
    if [ -z "$S3_CONNECTION_URL" ]; then
      echo -e "${YELLOW}⚠️  S3 credentials not set!${NC}"
      echo "S3 tests require environment variables:"
      echo "  export S3_CONNECTION_URL='your-url'"
      echo "  export S3_CONNECTION_USERNAME='your-username'"
      echo "  export S3_CONNECTION_PASSWORD='your-password'"
      echo ""
      read -p "Continue anyway? (y/N): " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi
  fi

  # Start OSD in background
  $START_SCRIPT &
  OSD_PID=$!

  echo "OSD starting (PID: $OSD_PID)..."
  echo "Waiting for OSD to be ready..."

  # Wait for OSD to be ready (max 3 minutes)
  for i in {1..90}; do
    if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
      echo -e "${GREEN}✓ OSD is ready!${NC}"
      break
    fi
    if [ $i -eq 90 ]; then
      echo -e "${RED}✗ OSD startup timed out${NC}"
      exit 1
    fi
    sleep 2
    echo -n "."
  done
  echo ""
  echo ""
fi

# Browser selection
echo "Browser options:"
echo "  1) chromium (default)"
echo "  2) electron"
echo "  3) chrome"
echo "  4) firefox"
read -p "Select browser (1-4, default: 1): " BROWSER_CHOICE
BROWSER_CHOICE=${BROWSER_CHOICE:-1}

case $BROWSER_CHOICE in
  1) BROWSER="chromium" ;;
  2) BROWSER="electron" ;;
  3) BROWSER="chrome" ;;
  4) BROWSER="firefox" ;;
  *) BROWSER="chromium" ;;
esac

# Set environment variables
export CYPRESS_VISBUILDER_ENABLED=true
export CYPRESS_DATASOURCE_MANAGEMENT_ENABLED=false
export NODE_OPTIONS='--max-old-space-size=6144 --dns-result-order=ipv4first'

# Run mode selection
echo ""
read -p "Run mode? (1: headless, 2: interactive, default: 1): " RUN_MODE
RUN_MODE=${RUN_MODE:-1}

echo ""
echo "========================================="
echo "Starting Test Run"
echo "========================================="
echo ""

if [ "$RUN_MODE" = "2" ]; then
  echo "Opening Cypress interactive mode..."
  npx cypress open --browser $BROWSER --config specPattern="$SPEC"
else
  echo "Running tests in headless mode..."
  echo ""
  yarn cypress:run-without-security --browser $BROWSER --spec "$SPEC"
fi

RESULT=$?

echo ""
echo "========================================="
echo "Test Results"
echo "========================================="
if [ $RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Tests passed!${NC}"
else
  echo -e "${RED}✗ Tests failed${NC}"
fi
echo ""
echo "Artifacts:"
echo "  Videos:      cypress/videos/"
echo "  Screenshots: cypress/screenshots/"
echo "========================================="

exit $RESULT
