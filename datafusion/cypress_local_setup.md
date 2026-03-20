# Cypress Test Configuration Guide

## Overview
This guide explains how to configure OpenSearch Dashboards (OSD) to run Cypress tests locally, based on the CI configuration.

## CI Configuration Analysis

### 1. Environment Variables (from CI workflows)

#### Core Settings
```bash
# Optimizer settings
OSD_OPTIMIZER_THEMES=v8light

# Node settings
NODE_OPTIONS='--max-old-space-size=6144 --dns-result-order=ipv4first'

# Cypress settings
CYPRESS_BROWSER=chromium  # or electron for release tests
CYPRESS_VISBUILDER_ENABLED=true
CYPRESS_DATASOURCE_MANAGEMENT_ENABLED=false

# OpenSearch settings
OSD_SNAPSHOT_SKIP_VERIFY_CHECKSUM=true
```

#### Cypress Environment Variables (from cypress.config.ts)
```bash
# OpenSearch connection
SECURITY_ENABLED=false
openSearchUrl=http://localhost:9200

# Features
AGGREGATION_VIEW=false
VISBUILDER_ENABLED=true
DATASOURCE_MANAGEMENT_ENABLED=false
ML_COMMONS_DASHBOARDS_ENABLED=true
DISABLE_LOCAL_CLUSTER=false

# Timeouts
WAIT_FOR_LOADER_BUFFER_MS=0
WAIT_MS=2000
WAIT_MS_LONG=10000

# Runtime
CYPRESS_RUNTIME_ENV=osd
```

### 2. OSD Startup Configuration

#### Development Mode (from CI)
```bash
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
```

### 3. OpenSearch Configuration

#### Security Disabled (default for tests)
- Remove security plugin: `./bin/opensearch-plugin remove opensearch-security`
- OpenSearch runs on: `http://localhost:9200`
- No authentication required

#### With Security Enabled (optional)
- Keep security plugin
- OpenSearch runs on: `https://localhost:9200`
- Credentials: `admin:myStrongPassword123!`
- Use `--insecure` flag for curl commands

### 4. Required Setup Steps

#### Prerequisites
1. **Node.js**: Version specified in `.nvmrc` (22.x)
2. **Yarn**: Version ^1.22.10
3. **Dependencies**: Run `yarn osd bootstrap`

#### OpenSearch Setup
```bash
# Option 1: Use snapshot (recommended for local dev)
yarn opensearch snapshot

# Option 2: Download and configure manually
# Download from: https://artifacts.opensearch.org/releases/bundle/opensearch/<version>/
# Extract and remove security plugin
cd opensearch-<version>
./bin/opensearch-plugin remove opensearch-security
./opensearch-tar-install.sh
```

#### OSD Setup
```bash
# Bootstrap (already done)
yarn osd bootstrap

# Build platform plugins (optional, for faster startup)
node scripts/build_opensearch_dashboards_platform_plugins --no-examples --workers 12
```

### 5. Running Cypress Tests

#### Available Test Groups
Tests are organized into groups (ciGroups):

**Query Enhancements:**
- `osd:ciGroup10` - Query enhancements tests (01)
- `osd:ciGroup11` - Dashboard sanity test
- `osd:ciGroup12` - Query enhancements tests (02)
- `osd:ciGroup13` - Query enhancements tests (03)
- `osd:ciGroup14` - Query enhancements tests (04)
- `osd:ciGroup15` - Query enhancements tests (05)
- `osd:ciGroupS3` - S3-specific tests

**Explore Feature:**
- `osd:ciGroup10Explore` through `osd:ciGroup17Explore`
- `osd:ciGroupS3Explore` - S3-specific explore tests

#### Running Tests

**Option 1: Quick run (security disabled)**
```bash
# Run a specific test group
SPEC=$(yarn --silent osd:ciGroup10)
yarn cypress:run-without-security --browser chromium --spec "$SPEC"

# Run a single test file
yarn cypress:run-without-security --spec "cypress/integration/dashboard_sanity_test.spec.ts"
```

**Option 2: With custom configuration**
```bash
# Set environment variables
export CYPRESS_VISBUILDER_ENABLED=true
export CYPRESS_DATASOURCE_MANAGEMENT_ENABLED=false

# Run tests
yarn cypress:run-without-security --browser chromium --spec "$SPEC"
```

**Option 3: Interactive mode**
```bash
# Open Cypress UI for debugging
npx cypress open
```

### 6. Configuration Files

#### cypress.config.ts
- **Base URL**: `http://localhost:5601`
- **OpenSearch URL**: `http://localhost:9200`
- **Spec Pattern**: `cypress/integration/**/*.spec.{js,jsx,ts,tsx}`
- **Timeouts**:
  - Command: 15000ms
  - Request: 60000ms
  - Response: 60000ms
- **Retries**: 2 in run mode, 0 in open mode
- **Video**: Enabled, compression 15

#### config/opensearch_dashboards.yml
Default configuration works for most tests. Key settings:
```yaml
# Default - no changes needed for basic tests
# server.port: 5601
# opensearch.hosts: ["http://localhost:9200"]

# For specific features, uncomment:
# data_source.enabled: true
# workspace.enabled: true
# vis_builder.enabled: true
```

### 7. Troubleshooting

#### Common Issues

**1. Connection Errors**
```
[ConnectionError]: Connection Error
```
**Solution**: Ensure OpenSearch is running and accessible at `http://localhost:9200`
```bash
curl http://localhost:9200
```

**2. Bundle Compilation Slow**
**Solution**: Use pre-built bundles or increase Node memory
```bash
export NODE_OPTIONS='--max-old-space-size=6144'
```

**3. Timeout Errors**
**Solution**: Increase timeouts in cypress.config.ts or environment variables
```bash
export WAIT_MS=5000
export WAIT_MS_LONG=20000
```

**4. Test Isolation Issues**
**Solution**: Tests have `testIsolation: false` in config. Be aware of state pollution between tests.

### 8. CI-Equivalent Local Setup

To replicate CI environment exactly:

```bash
# 1. Set environment variables
export OSD_OPTIMIZER_THEMES=v8light
export NODE_OPTIONS='--max-old-space-size=6144 --dns-result-order=ipv4first'
export CYPRESS_BROWSER=chromium
export CYPRESS_VISBUILDER_ENABLED=true
export CYPRESS_DATASOURCE_MANAGEMENT_ENABLED=false

# 2. Start OpenSearch (security disabled)
cd .opensearch/3.6.0
./opensearch-tar-install.sh &

# Wait for OpenSearch to be ready
until curl -s http://localhost:9200 > /dev/null; do sleep 1; done

# 3. Start OSD with CI flags
cd /path/to/osd
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
  --opensearch.ignoreVersionMismatch=true &

# 4. Wait for OSD to be ready
until curl -s http://localhost:5601/api/status > /dev/null; do sleep 1; done

# 5. Run tests
SPEC=$(yarn --silent osd:ciGroup10)
yarn cypress:run-without-security --browser chromium --spec "$SPEC"
```

### 9. Test Organization

```
cypress/
├── integration/
│   ├── dashboard_sanity_test.spec.ts              # Basic dashboard tests
│   └── core_opensearch_dashboards/
│       └── opensearch_dashboards/
│           └── apps/
│               ├── query_enhancements/            # Query enhancement features
│               │   ├── 01/                        # Basic functionality
│               │   ├── 02/                        # Advanced features
│               │   ├── 03/                        # Data operations
│               │   ├── 04/                        # UI interactions
│               │   ├── 05/                        # Autocomplete & recent queries
│               │   └── s3_tests/                  # S3 data source tests
│               └── explore/                       # Explore app tests
│                   ├── 01/ through 07/            # Various feature tests
│                   └── s3_tests/                  # S3 explore tests
├── screenshots/                                    # Test failure screenshots
├── videos/                                         # Test execution videos
└── support/                                        # Test utilities & commands
```

### 10. Quick Start Commands

```bash
# Clean and restart
yarn osd clean
yarn osd bootstrap
yarn opensearch snapshot  # In another terminal
yarn start               # In another terminal

# Run specific test group
yarn cypress:run-without-security --spec "$(yarn --silent osd:ciGroup11)"

# Interactive debugging
npx cypress open
```

## Summary

**Minimum Required Configuration:**
1. ✅ OpenSearch running on `localhost:9200` (security disabled)
2. ✅ OSD running on `localhost:5601` (dev mode)
3. ✅ Environment: `SECURITY_ENABLED=false`

**Recommended for CI-equivalent:**
1. All environment variables from section 1
2. OSD started with all CI flags from section 2
3. Node memory increased to 6GB

**Current Status:**
- ✅ OpenSearch: Running on localhost:9200
- ✅ OSD: Running on localhost:5601
- ✅ Ready to run Cypress tests!
