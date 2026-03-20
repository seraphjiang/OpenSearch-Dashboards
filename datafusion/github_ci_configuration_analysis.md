# GitHub CI Configuration Analysis

## Summary: CI Runs MULTIPLE Configurations

✅ **Answer:** GitHub CI runs tests with **THREE different configurations**, not just one!

## CI Workflow Matrix Strategy

The main workflow `.github/workflows/cypress_workflow.yml` uses a **matrix strategy** to run different test groups with different configurations.

### Configuration Profiles in CI

#### 1️⃣ **Config: `standard`** (FTR Tests - Groups 1-9)
```bash
node scripts/opensearch_dashboards \
  --no-base-path \
  --no-watch \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --csp.warnLegacyBrowsers=false \
  --uiSettings.overrides["query:enhancements:enabled"]=false \
  --home.disableExperienceModal=true
```

**Features:**
- ❌ workspace.enabled=false (not set, defaults to false)
- ❌ data_source.enabled=false (not set, defaults to false)
- ❌ query:enhancements:enabled=**false** (explicitly disabled)
- ✅ Basic functionality only

**Test Groups:**
- Groups 1-9 (External FTR repository tests)

---

#### 2️⃣ **Config: `dashboard`** (Group 11 ONLY)
```bash
node scripts/opensearch_dashboards \
  --no-base-path \
  --no-watch \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --home.disableExperienceModal=true
```

**Features:**
- ❌ workspace.enabled=false (not set, defaults to false)
- ❌ data_source.enabled=false (not set, defaults to false)
- ❌ query:enhancements:enabled=false (not set, defaults to false)
- ❌ home:useNewHomePage=false (not set, defaults to false)
- ✅ **Traditional Dashboard UI**

**Test Groups:**
- ✅ **Group 11** - `dashboard_sanity_test.spec.ts`

**THIS IS THE KEY!** Group 11 (dashboard_sanity_test) runs with the traditional UI configuration!

---

#### 3️⃣ **Config: `query_enhanced`** (Groups 10, 12-15)
```bash
node scripts/opensearch_dashboards \
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
  --opensearch.ignoreVersionMismatch=true \
  --data.savedQueriesNewUI.enabled=true \
  --home.disableExperienceModal=true
```

**Features:**
- ✅ workspace.enabled=**true**
- ✅ data_source.enabled=**true**
- ✅ query:enhancements:enabled=**true**
- ✅ home:useNewHomePage=**true**
- ✅ **Modern Workspace UI**

**Test Groups:**
- Group 10Fast - query_enhancements/01 (fast tests)
- Group 10Slow - query_enhancements/01 (slow tests)
- Group 12 - query_enhancements/02
- Group 13 - query_enhancements/03
- Group 14 - query_enhancements/04
- Group 15 - query_enhancements/05

---

#### 4️⃣ **Config: `explore`** (Groups 10e-17e)
```bash
node scripts/opensearch_dashboards \
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
  --opensearch.ignoreVersionMismatch=true \
  --data.savedQueriesNewUI.enabled=true \
  --explore.enabled=true \
  --explore.discoverTraces.enabled=true \
  --home.disableExperienceModal=true \
  --datasetManagement.enabled=true
```

**Features:**
- ✅ workspace.enabled=**true**
- ✅ data_source.enabled=**true**
- ✅ query:enhancements:enabled=**true**
- ✅ explore.enabled=**true**
- ✅ datasetManagement.enabled=**true**
- ✅ **Explore Feature UI**

**Test Groups:**
- Group 10Explore - explore/01
- Group 12Explore - explore/02
- Group 13Explore - explore/03
- Group 14Explore - explore/04 (includes Prometheus)
- Group 15Explore - explore/05
- Group 16Explore - explore/06
- Group 17Explore - explore/07

---

## Complete Matrix Mapping

| Group | Config | Workspace | DataSource | Query Enhanced | Explore | Test Location |
|-------|--------|-----------|------------|----------------|---------|---------------|
| 1-9 | standard | ❌ | ❌ | ❌ | ❌ | FTR repo |
| 10Fast | query_enhanced | ✅ | ✅ | ✅ | ❌ | OSD source |
| 10Slow | query_enhanced | ✅ | ✅ | ✅ | ❌ | OSD source |
| **11** | **dashboard** | **❌** | **❌** | **❌** | **❌** | **OSD source** |
| 12 | query_enhanced | ✅ | ✅ | ✅ | ❌ | OSD source |
| 13 | query_enhanced | ✅ | ✅ | ✅ | ❌ | OSD source |
| 14 | query_enhanced | ✅ | ✅ | ✅ | ❌ | OSD source |
| 15 | query_enhanced | ✅ | ✅ | ✅ | ❌ | OSD source |
| 10Explore | explore | ✅ | ✅ | ✅ | ✅ | OSD source |
| 12Explore | explore | ✅ | ✅ | ✅ | ✅ | OSD source |
| 13Explore | explore | ✅ | ✅ | ✅ | ✅ | OSD source |
| 14Explore | explore | ✅ | ✅ | ✅ | ✅ | OSD source |
| 15Explore | explore | ✅ | ✅ | ✅ | ✅ | OSD source |
| 16Explore | explore | ✅ | ✅ | ✅ | ✅ | OSD source |
| 17Explore | explore | ✅ | ✅ | ✅ | ✅ | OSD source |

---

## Why Your Test Failed Locally

**What you did:**
```bash
# Started OSD with workspace enabled (based on CI config for groups 10, 12-15)
./start-osd-cypress.sh
# This uses query_enhanced config

# Ran group 11 test
yarn cypress:run-without-security --spec "cypress/integration/dashboard_sanity_test.spec.ts"
```

**The problem:**
- Group 11 test expects **`dashboard` config** (no workspace)
- You started OSD with **`query_enhanced` config** (workspace enabled)
- Result: Test looks for traditional UI elements that don't exist in workspace mode

---

## How CI Avoids This Problem

CI uses a **matrix strategy** that automatically:
1. Detects which group is being tested (from `matrix.group`)
2. Selects the correct config (from `matrix.config`)
3. Starts OSD with the appropriate flags
4. Runs only the tests designed for that configuration

**Example for Group 11:**
```yaml
matrix:
  - group: 11
    config: dashboard      # <-- Uses 'dashboard' config
    test_location: source

START_CMD: ${{ matrix.config == 'dashboard' &&
  'node scripts/opensearch_dashboards ... --home.disableExperienceModal=true' }}
  # ^ NO workspace, NO data_source, NO query enhancements
```

---

## The Correct Local Setup

### To Run Group 11 (dashboard_sanity_test):
```bash
# Stop current OSD
pkill -f opensearch_dashboards

# Start with 'dashboard' config (traditional UI)
node scripts/opensearch_dashboards \
  --dev \
  --no-base-path \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --home.disableExperienceModal=true

# Run the test
yarn cypress:run-without-security --spec "cypress/integration/dashboard_sanity_test.spec.ts"
```

### To Run Groups 10, 12-15 (query_enhancements):
```bash
# Use your existing script (already correct)
./start-osd-cypress.sh

# Run any query_enhancements test
yarn cypress:run-without-security --spec "$(yarn --silent osd:ciGroup12)"
```

### To Run Groups 10e-17e (explore):
```bash
# Stop current OSD
pkill -f opensearch_dashboards

# Start with 'explore' config
node scripts/opensearch_dashboards \
  --dev \
  --no-base-path \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --csp.warnLegacyBrowsers=false \
  --uiSettings.overrides["query:enhancements:enabled"]=true \
  --uiSettings.overrides['home:useNewHomePage']=true \
  --data_source.enabled=true \
  --workspace.enabled=true \
  --opensearch.ignoreVersionMismatch=true \
  --data.savedQueriesNewUI.enabled=true \
  --explore.enabled=true \
  --explore.discoverTraces.enabled=true \
  --home.disableExperienceModal=true \
  --datasetManagement.enabled=true

# Run any explore test
yarn cypress:run-without-security --spec "$(yarn --silent osd:ciGroup10Explore)"
```

---

## Other CI Workflows

### `cypress_workflow_with_s3.yml`
- **Config:** Same as `query_enhanced`
- **Purpose:** Runs S3 data source tests
- **Requires:** S3 credentials in secrets

### `release_cypress_workflow.yml`
- **Config:** Uses external OpenSearch/OSD artifacts
- **Purpose:** Tests release candidates
- **Matrix:** Groups 10-11 (runs in parallel)

---

## Key Insights

1. **CI is smarter than we thought** - It automatically switches configurations based on test group

2. **Group 11 is special** - It's the ONLY group that runs without workspace

3. **Your start-osd-cypress.sh is correct** - But only for groups 10, 12-15 (query_enhanced)

4. **To test locally like CI** - You need different OSD configs for different test groups

---

## Recommendation: Update Helper Scripts

Create config-specific scripts:

### `start-osd-dashboard.sh` (for group 11)
```bash
#!/bin/bash
# For dashboard_sanity_test (group 11) - Traditional UI

node scripts/opensearch_dashboards \
  --dev \
  --no-base-path \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --home.disableExperienceModal=true
```

### `start-osd-query-enhanced.sh` (for groups 10, 12-15)
```bash
#!/bin/bash
# Already exists as start-osd-cypress.sh
# For query_enhancements tests
```

### `start-osd-explore.sh` (for groups 10e-17e)
```bash
#!/bin/bash
# For explore tests - Adds explore-specific flags

node scripts/opensearch_dashboards \
  --dev \
  --no-base-path \
  --savedObjects.maxImportPayloadBytes=10485760 \
  --server.maxPayloadBytes=1759977 \
  --logging.json=false \
  --data.search.aggs.shardDelay.enabled=true \
  --csp.warnLegacyBrowsers=false \
  --uiSettings.overrides["query:enhancements:enabled"]=true \
  --uiSettings.overrides['home:useNewHomePage']=true \
  --data_source.enabled=true \
  --workspace.enabled=true \
  --opensearch.ignoreVersionMismatch=true \
  --data.savedQueriesNewUI.enabled=true \
  --explore.enabled=true \
  --explore.discoverTraces.enabled=true \
  --home.disableExperienceModal=true \
  --datasetManagement.enabled=true
```

---

## Conclusion

**GitHub CI does NOT run just one configuration** - it intelligently runs:
- ✅ Traditional UI (group 11)
- ✅ Workspace UI (groups 10, 12-15)
- ✅ Explore UI (groups 10e-17e)
- ✅ Standard FTR tests (groups 1-9)

This explains why `dashboard_sanity_test` passes in CI but failed for you locally - CI uses the correct traditional UI configuration for that specific test!
