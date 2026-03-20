# Cypress Test Configuration Matrix

## Overview

This document maps which Cypress tests require which OSD configuration settings. Understanding this helps you run the right tests with the right configuration.

## Test Directory Structure

```
cypress/integration/
├── dashboard_sanity_test.spec.ts          # Traditional UI (NO workspace)
├── core_opensearch_dashboards/
│   └── opensearch_dashboards/
│       └── apps/
│           ├── query_enhancements/        # Workspace + DataSource REQUIRED
│           │   ├── 01/ through 05/        # Feature tests
│           │   └── s3_tests/              # Requires S3 credentials
│           └── explore/                   # Workspace + DataSource REQUIRED
│               ├── 01/ through 07/        # Feature tests
│               └── s3_tests/              # Requires S3 credentials
├── with_security/                         # Security plugin REQUIRED
└── without_security/                      # Security plugin DISABLED
```

## Configuration Profiles

### Profile 1: Traditional / Legacy UI

**Configuration:**
```bash
node scripts/opensearch_dashboards \
  --dev \
  --no-base-path \
  --workspace.enabled=false \
  --data_source.enabled=false \
  --uiSettings.overrides["query:enhancements:enabled"]=false
```

**Compatible Tests:**
- ✅ `dashboard_sanity_test.spec.ts`
- ✅ Basic navigation tests
- ✅ Classic home page tests

**Expected UI:**
- Traditional OpenSearch Dashboards home page
- Direct navigation links visible
- No workspace concept
- Single cluster only

---

### Profile 2: Modern UI (Workspace + DataSource)

**Configuration:**
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

**Compatible Tests:**
- ✅ `query_enhancements/**/*.spec.js` (ciGroup10-15)
- ✅ `explore/**/*.spec.js` (ciGroup10e-17e)
- ✅ All modern feature tests

**Expected UI:**
- Workspace-based home page
- Card-based layout
- Multi-data-source support
- Query enhancements enabled

**What Tests Require:**
- Tests create and delete workspaces automatically
- Tests use data sources (local by default)
- Tests validate workspace-specific features

---

### Profile 3: S3 Data Source Tests

**Configuration:**
Same as Profile 2, PLUS environment variables:
```bash
export S3_CONNECTION_URL="your-s3-url"
export S3_CONNECTION_USERNAME="your-username"
export S3_CONNECTION_PASSWORD="your-password"
```

**Compatible Tests:**
- ✅ `query_enhancements/s3_tests/*.spec.js` (osd:ciGroupS3)
- ✅ `explore/s3_tests/*.spec.js` (osd:ciGroupS3Explore)

**Expected UI:**
Same as Profile 2, but tests will create S3 data sources

---

### Profile 4: With Security Plugin

**Configuration:**
```bash
# OpenSearch must have security plugin installed
# OSD configuration:
opensearch.url: "https://localhost:9200"
opensearch.username: "admin"
opensearch.password: "myStrongPassword123!"
opensearch.ssl.verificationMode: none
```

**Compatible Tests:**
- ✅ Tests in `with_security/` directory
- ✅ Run with: `yarn cypress:run-with-security`

**Environment:**
```bash
SECURITY_ENABLED=true
openSearchUrl=https://localhost:9200
```

---

## Test Group Mapping

### Query Enhancements (Requires Profile 2)

| Group | Script | Tests | Configuration Required |
|-------|--------|-------|----------------------|
| osd:ciGroup10 | query_enhancements/01 | Basic queries | Workspace + DataSource |
| osd:ciGroup11 | dashboard_sanity | Dashboard sanity | **Profile 1** (Traditional) |
| osd:ciGroup12 | query_enhancements/02 | Dataset selector | Workspace + DataSource |
| osd:ciGroup13 | query_enhancements/03 | Caching, CSV | Workspace + DataSource |
| osd:ciGroup14 | query_enhancements/04 | Advanced settings | Workspace + DataSource |
| osd:ciGroup15 | query_enhancements/05 | Autocomplete | Workspace + DataSource |
| osd:ciGroupS3 | query_enhancements/s3_tests | S3 tests | Profile 3 (S3 + Workspace) |

### Explore Feature (Requires Profile 2)

| Group | Script | Tests | Configuration Required |
|-------|--------|-------|----------------------|
| osd:ciGroup10Explore | explore/01 | AI editor, queries | Workspace + DataSource |
| osd:ciGroup12Explore | explore/02 | Language display | Workspace + DataSource |
| osd:ciGroup13Explore | explore/03 | Field stats, inspect | Workspace + DataSource |
| osd:ciGroup14Explore | explore/04 | Traces, Prometheus | Workspace + DataSource |
| osd:ciGroup15Explore | explore/05 | Autocomplete UI | Workspace + DataSource |
| osd:ciGroup16Explore | explore/06 | Add to dashboard | Workspace + DataSource |
| osd:ciGroup17Explore | explore/07 | Rule matching viz | Workspace + DataSource |
| osd:ciGroupS3Explore | explore/s3_tests | S3 explore tests | Profile 3 (S3 + Workspace) |

---

## How to Identify Test Requirements

### Method 1: Check Test Code

Look at the beginning of the test file:

**Workspace-enabled test:**
```javascript
import { getRandomizedWorkspaceName } from '...';
// ...
cy.osd.createWorkspaceWithDataSourceId(...);
```

**Traditional test:**
```javascript
miscUtils.visitPage('app/home#');
// Checks for traditional UI elements like:
commonUI.checkElementExists(`a[href="/app/opensearch_dashboards_overview"]`);
```

### Method 2: Check Test Location

- `query_enhancements/` → Requires Workspace
- `explore/` → Requires Workspace
- `s3_tests/` → Requires S3 credentials
- `with_security/` → Requires security plugin
- `without_security/` → Security disabled
- Root level tests (like `dashboard_sanity_test`) → Traditional UI

### Method 3: Check CI Configuration

Look at `.github/workflows/`:
- `cypress_workflow_with_s3.yml` → Uses Profile 2 (Workspace enabled)
- `release_cypress_workflow.yml` → Uses Profile 2 (Workspace enabled)

**Note:** CI uses Profile 2 by default for most tests!

---

## Quick Start Guide

### Running Traditional UI Tests
```bash
# Stop current OSD, start without workspace
node scripts/opensearch_dashboards --dev \
  --workspace.enabled=false \
  --data_source.enabled=false

# Run traditional tests
yarn cypress:run-without-security --spec "cypress/integration/dashboard_sanity_test.spec.ts"
```

### Running Modern UI Tests
```bash
# Use the helper script (already configured for Profile 2)
./start-osd-cypress.sh

# Run any query_enhancements or explore test
yarn cypress:run-without-security --spec "$(yarn --silent osd:ciGroup12)"
```

### Running S3 Tests
```bash
# Set S3 credentials
export S3_CONNECTION_URL="your-url"
export S3_CONNECTION_USERNAME="your-username"
export S3_CONNECTION_PASSWORD="your-password"

# Start OSD with workspace enabled
./start-osd-cypress.sh

# Run S3 tests
yarn cypress:run-without-security --spec "$(yarn --silent osd:ciGroupS3)"
```

---

## Common Issues

### Issue: Test looks for elements that don't exist

**Cause:** Configuration mismatch
- Traditional test running with workspace enabled, OR
- Workspace test running without workspace

**Solution:** Check test requirements and restart OSD with correct profile

### Issue: Test fails with "workspace not found"

**Cause:** Workspace feature not enabled

**Solution:** Restart OSD with `--workspace.enabled=true`

### Issue: Test fails with "data source not found"

**Cause:** Data source feature not enabled

**Solution:** Restart OSD with `--data_source.enabled=true`

---

## Current Setup

Based on your `start-osd-cypress.sh`, you're currently running **Profile 2** (Modern UI):
- ✅ workspace.enabled=true
- ✅ data_source.enabled=true
- ✅ query:enhancements:enabled=true

**Compatible with:**
- ✅ All query_enhancements tests (ciGroup10, 12-15)
- ✅ All explore tests (ciGroup10e-17e)
- ❌ dashboard_sanity_test (requires Profile 1)

**To run dashboard_sanity_test:** Restart OSD without workspace:
```bash
node scripts/opensearch_dashboards --dev \
  --workspace.enabled=false \
  --data_source.enabled=false
```

---

## Summary Table

| Test Type | Workspace | DataSource | Query Enhancements | Security | S3 Creds |
|-----------|-----------|------------|-------------------|----------|----------|
| dashboard_sanity_test | ❌ | ❌ | ❌ | ❌ | ❌ |
| query_enhancements/* | ✅ | ✅ | ✅ | ❌ | ❌ |
| explore/* | ✅ | ✅ | ✅ | ❌ | ❌ |
| */s3_tests | ✅ | ✅ | ✅ | ❌ | ✅ |
| with_security/* | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## References

- **CI Configuration:** `.github/workflows/cypress_workflow_with_s3.yml`
- **Test Helper Scripts:** `./start-osd-cypress.sh`, `./run-cypress-tests.sh`
- **Cypress Config:** `cypress.config.ts`
- **Main Setup Guide:** `CYPRESS_LOCAL_SETUP.md`
