# OpenSearch Dashboards API Documentation

> Auto-generated API reference for OpenSearch Dashboards (OSD) internal and public HTTP endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Core APIs](#core-apis)
  - [Status](#status)
  - [Saved Objects](#saved-objects)
  - [UI Settings](#ui-settings)
  - [Capabilities](#capabilities)
- [Plugin APIs](#plugin-apis)
  - [Application Config](#application-config)
  - [Banner](#banner)
  - [Chat](#chat)
  - [Console (Proxy)](#console-proxy)
  - [Data (Search, Index Patterns, Autocomplete)](#data-search-index-patterns-autocomplete)
  - [Data Importer](#data-importer)
  - [Data Source](#data-source)
  - [Data Source Management](#data-source-management)
  - [Home](#home)
  - [Index Pattern Management](#index-pattern-management)
  - [Legacy Export/Import](#legacy-exportimport)
  - [Query Enhancements](#query-enhancements)
  - [Region Map (Geospatial)](#region-map-geospatial)
  - [Saved Objects Management](#saved-objects-management)
  - [Share (Short URLs)](#share-short-urls)
  - [Telemetry](#telemetry)
  - [Usage Collection](#usage-collection)
  - [Vis Augmenter](#vis-augmenter)
  - [Vis Type Timeline](#vis-type-timeline)
  - [Vis Type Timeseries (TSVB)](#vis-type-timeseries-tsvb)
  - [Workspaces](#workspaces)
- [Common Patterns](#common-patterns)

---

## Authentication

All OSD API endpoints require authentication by default unless explicitly marked otherwise. When the OpenSearch Dashboards Security plugin is installed:

- Requests must include valid session cookies or authentication headers.
- Unauthenticated requests to `/api/` routes receive a `401 Unauthorized` response.
- The `/api/status` endpoint can optionally allow anonymous access via server configuration (`status.allowAnonymous: true`).

**Common Headers:**

| Header | Description |
|--------|-------------|
| `osd-xsrf: true` | Required for all non-GET requests to prevent CSRF attacks |
| `Content-Type: application/json` | Required for JSON request bodies |
| `Content-Type: multipart/form-data` | Required for file upload endpoints |

---

## Core APIs

### Status

#### `GET /api/status`

Returns the overall health and status of the OpenSearch Dashboards server, including version info, plugin statuses, and OS/process metrics.

**Authentication:** Configurable (can allow anonymous access)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `v8format` | boolean | `false` | Use v8-style status format instead of legacy format |

**Example Request:**
```bash
curl -X GET "http://localhost:5601/api/status"
```

**Example Response:**
```json
{
  "name": "opensearch-dashboards",
  "uuid": "abc-123-def",
  "version": {
    "number": "2.19.0",
    "build_hash": "abc123",
    "build_number": 1234,
    "build_snapshot": false
  },
  "status": {
    "overall": { "state": "green", "title": "Green" }
  },
  "metrics": {
    "last_updated": "2026-03-19T00:00:00.000Z",
    "collection_interval_in_millis": 5000,
    "process": {
      "memory": { "heap": { "total_in_bytes": 1000000, "used_in_bytes": 500000, "size_limit": 2000000 } },
      "pid": 12345,
      "uptime_in_millis": 3600000
    },
    "os": {
      "load": { "1m": 1.5, "5m": 1.2, "15m": 1.0 },
      "memory": { "total_in_bytes": 8000000000, "free_in_bytes": 4000000000 }
    },
    "concurrent_connections": 5,
    "requests": { "total": 100, "disconnects": 0 }
  }
}
```

---

### Saved Objects

The Saved Objects API manages persisted objects such as dashboards, visualizations, index patterns, and searches. All endpoints use the base path `/api/saved_objects/`.

#### `GET /api/saved_objects/{type}/{id}`

Retrieve a single saved object by type and ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Saved object type (e.g., `dashboard`, `visualization`, `index-pattern`) |
| `id` | string | Saved object ID |

**Example Request:**
```bash
curl -X GET "http://localhost:5601/api/saved_objects/dashboard/my-dashboard-id" \
  -H "osd-xsrf: true"
```

---

#### `POST /api/saved_objects/{type}/{id?}`

Create a new saved object. The `id` is optional; if omitted, one is auto-generated.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Saved object type |
| `id` | string | No | Custom ID (auto-generated if omitted) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `overwrite` | boolean | `false` | If `true`, overwrite an existing object with the same ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attributes` | object | Yes | The saved object's attributes (type-specific) |
| `references` | array | No | References to other saved objects `[{name, type, id}]` |
| `migrationVersion` | object | No | Migration version tracking |
| `initialNamespaces` | string[] | No | Initial namespace assignments |
| `workspaces` | string[] | No | Workspace assignments |

**Example Request:**
```bash
curl -X POST "http://localhost:5601/api/saved_objects/index-pattern" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "title": "my-index-*",
      "timeFieldName": "@timestamp"
    }
  }'
```

---

#### `PUT /api/saved_objects/{type}/{id}`

Update an existing saved object's attributes.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attributes` | object | Yes | Updated attributes |
| `version` | string | No | Optimistic concurrency version |
| `references` | array | No | Updated references `[{name, type, id}]` |

**Example Request:**
```bash
curl -X PUT "http://localhost:5601/api/saved_objects/index-pattern/my-id" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "title": "updated-index-*"
    }
  }'
```

---

#### `DELETE /api/saved_objects/{type}/{id}`

Delete a saved object.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `force` | boolean | Force deletion even if the object has references |

**Example Request:**
```bash
curl -X DELETE "http://localhost:5601/api/saved_objects/visualization/my-vis-id?force=true" \
  -H "osd-xsrf: true"
```

---

#### `GET /api/saved_objects/_find`

Search for saved objects with filtering, pagination, and sorting.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string or string[] | *required* | Saved object type(s) to search |
| `per_page` | number | `20` | Results per page |
| `page` | number | `1` | Page number |
| `search` | string | - | Full-text search query |
| `default_search_operator` | `OR` or `AND` | `OR` | Search operator for multi-term queries |
| `search_fields` | string or string[] | - | Fields to search within |
| `sort_field` | string | - | Field to sort by |
| `has_reference` | object | - | Filter by reference `{type, id}` |
| `fields` | string or string[] | - | Fields to include in response |
| `filter` | string | - | OSD Query Language filter |
| `namespaces` | string or string[] | - | Namespace filter |
| `workspaces` | string or string[] | - | Workspace filter |

**Example Request:**
```bash
curl -X GET "http://localhost:5601/api/saved_objects/_find?type=dashboard&search=sales&per_page=10" \
  -H "osd-xsrf: true"
```

---

#### `POST /api/saved_objects/_bulk_get`

Retrieve multiple saved objects in a single request.

**Request Body:** Array of objects:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Saved object type |
| `id` | string | Yes | Saved object ID |
| `fields` | string[] | No | Specific fields to return |

**Example Request:**
```bash
curl -X POST "http://localhost:5601/api/saved_objects/_bulk_get" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '[
    {"type": "dashboard", "id": "dash-1"},
    {"type": "visualization", "id": "vis-1"}
  ]'
```

---

#### `POST /api/saved_objects/_bulk_create`

Create multiple saved objects in a single request.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `overwrite` | boolean | `false` | Overwrite existing objects |
| `workspaces` | string or string[] | - | Workspace assignments |

**Request Body:** Array of saved object definitions (same schema as single create, with `type` included in each item).

---

#### `PUT /api/saved_objects/_bulk_update`

Update multiple saved objects in a single request.

**Request Body:** Array of objects:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Saved object type |
| `id` | string | Yes | Saved object ID |
| `attributes` | object | Yes | Updated attributes |
| `version` | string | No | Optimistic concurrency version |
| `references` | array | No | Updated references |
| `namespace` | string | No | Namespace |

---

#### `POST /api/saved_objects/_export`

Export saved objects as NDJSON. Supports exporting by type or by specific object references.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string or string[] | Export all objects of these types |
| `objects` | array | Specific objects to export `[{type, id}]` |
| `search` | string | Search filter |
| `includeReferencesDeep` | boolean | Include all referenced objects recursively (default: `false`) |
| `excludeExportDetails` | boolean | Exclude export summary (default: `false`) |
| `workspaces` | string[] | Filter by workspaces |

**Response:** NDJSON stream (`application/ndjson`)

**Example Request:**
```bash
curl -X POST "http://localhost:5601/api/saved_objects/_export" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{"type": "dashboard", "includeReferencesDeep": true}' \
  -o export.ndjson
```

---

#### `POST /api/saved_objects/_import`

Import saved objects from an NDJSON file.

**Content-Type:** `multipart/form-data`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `overwrite` | boolean | `false` | Overwrite existing objects |
| `createNewCopies` | boolean | `false` | Generate new IDs for all imported objects |
| `dataSourceId` | string | - | Associate with a data source |
| `workspaces` | string or string[] | - | Assign to workspaces |

**Form Data:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | NDJSON file (`.ndjson` extension required) |

**Example Request:**
```bash
curl -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" \
  -H "osd-xsrf: true" \
  -F "file=@export.ndjson"
```

---

#### `POST /api/saved_objects/_resolve_import_errors`

Resolve errors from a previous import attempt by providing corrective actions (retries, overwrite decisions).

**Content-Type:** `multipart/form-data`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `createNewCopies` | boolean | `false` | Generate new IDs |
| `dataSourceId` | string | - | Data source ID |
| `workspaces` | string or string[] | - | Workspace assignments |

**Form Data:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Original NDJSON file |
| `retries` | array | Retry instructions per failed object |

---

#### `POST /api/saved_objects/_log_legacy_import`

*(Deprecated)* Logs a warning about legacy JSON imports. Returns `{success: true}`.

---

#### `POST /internal/saved_objects/_migrate`

*(Internal)* Trigger saved objects migration. Used during upgrade processes.

---

### UI Settings

Manage user interface settings (advanced settings). All endpoints use the path prefix `/api/opensearch-dashboards/settings`.

#### `GET /api/opensearch-dashboards/settings`

Get all user-provided UI settings.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `scope` | `global`, `user`, or `workspace` | Settings scope filter |

**Example Request:**
```bash
curl -X GET "http://localhost:5601/api/opensearch-dashboards/settings" \
  -H "osd-xsrf: true"
```

**Example Response:**
```json
{
  "settings": {
    "dateFormat": { "userValue": "YYYY-MM-DD" },
    "defaultIndex": { "userValue": "my-index-*" }
  }
}
```

---

#### `POST /api/opensearch-dashboards/settings/{key}`

Set a single UI setting.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Setting key (e.g., `dateFormat`, `defaultIndex`) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `scope` | `global` or `user` | Settings scope |

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `value` | any | The new setting value |

**Example Request:**
```bash
curl -X POST "http://localhost:5601/api/opensearch-dashboards/settings/dateFormat" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{"value": "YYYY-MM-DD HH:mm:ss"}'
```

---

#### `POST /api/opensearch-dashboards/settings`

Set multiple UI settings at once.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `changes` | object | Key-value pairs of settings to update |

---

#### `DELETE /api/opensearch-dashboards/settings/{key}`

Reset a UI setting to its default value.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `scope` | `global` or `user` | Settings scope |

---

### Capabilities

#### `POST /api/core/capabilities`

Resolve UI capabilities for the current user based on registered applications.

**Authentication:** Optional

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `applications` | string[] | List of application IDs to resolve capabilities for |

**Example Request:**
```bash
curl -X POST "http://localhost:5601/api/core/capabilities" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{"applications": ["discover", "dashboard", "visualize"]}'
```

---

## Plugin APIs

### Application Config

Manage application-level configuration key-value pairs.

#### `GET /api/appconfig`

Get all application configuration entries.

#### `GET /api/appconfig/{entity}`

Get a single configuration value by entity key.

#### `POST /api/appconfig/{entity}`

Set or update a configuration value.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `newValue` | string | The new configuration value |

#### `DELETE /api/appconfig/{entity}`

Delete a configuration entry.

---

### Banner

#### `GET /api/_plugins/_banner/content`

Get the current banner configuration (content, color, icon, markdown settings, size).

---

### Chat

AI-powered chat assistant using AG-UI protocol.

#### `POST /api/chat/memory/sessions/search`

Search conversation history sessions with pagination.

#### `POST /api/chat/proxy`

Proxy AI agent requests to AG-UI or ML Commons backend. Supports Server-Sent Events (SSE) streaming for real-time responses.

---

### Console (Proxy)

The Console plugin provides a proxy to the OpenSearch cluster and related configuration endpoints.

#### `POST /api/console/proxy`

Proxy requests to the OpenSearch cluster. This is the primary endpoint used by the Dev Tools Console.

#### `GET /api/console/opensearch_config`

Get OpenSearch connection configuration visible to the Console.

#### `GET /api/console/api_server`

Get the Console's spec definitions for API autocompletion.

---

### Data (Search, Index Patterns, Autocomplete)

The Data plugin provides core search, index pattern, and autocomplete functionality.

#### `POST /internal/search/{strategy}/{id?}`

*(Internal)* Execute a search using a registered strategy (e.g., `opensearch`, `ppl`, `sql`).

#### `DELETE /internal/search/{strategy}/{id}`

*(Internal)* Cancel an async search by strategy and ID.

#### `POST /internal/_msearch`

*(Internal, Deprecated)* Execute a multi-search request.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data_source_id` | string | Target data source |

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `searches` | array | Array of `{header: {index, preference?}, body}` pairs |

#### `GET /api/index_patterns/_fields_for_wildcard`

Get field capabilities for an index pattern.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pattern` | string | Index pattern (e.g., `logs-*`) |
| `meta_fields` | string or string[] | Meta fields to include |
| `data_source` | string | Data source ID |

#### `GET /api/index_patterns/_fields_for_time_pattern`

Get fields for a time-based index pattern.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pattern` | string | Index pattern |
| `interval` | string | Time interval |
| `look_back` | number | Number of intervals to look back |
| `meta_fields` | string or string[] | Meta fields to include |
| `data_source` | string | Data source ID |

#### `POST /api/opensearch-dashboards/suggestions/values/{index}`

Get autocomplete value suggestions for a field within an index.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `field` | string | Field name |
| `query` | string | Partial value to autocomplete |
| `boolFilter` | object | Optional filter context |
| `dataSourceId` | string | Data source ID |

#### `GET /api/opensearch-dashboards/scripts/languages`

Get supported scripting languages from OpenSearch.

#### `POST /api/opensearch-dashboards/dql_opt_in_stats`

Track DQL opt-in/opt-out telemetry.

---

### Data Importer

#### `POST /api/data_importer/_import_file`

Import data from a file (CSV, JSON, NDJSON) into an OpenSearch index.

**Content-Type:** `multipart/form-data`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indexName` | string | Yes | Target index name |
| `createMode` | boolean | Yes | Whether to create the index |
| `fileExtension` | string | Yes | File type extension |
| `dataSource` | string | No | Data source ID |
| `delimiter` | string | No | CSV delimiter character |

#### `POST /api/data_importer/_import_text`

Import data from text content directly into an OpenSearch index.

#### `GET /api/data_importer/_cat_indices`

List available indices for import targeting.

#### `POST /api/data_importer/_preview`

Preview imported data before committing.

---

### Data Source

Manage external OpenSearch data source connections.

#### `POST /internal/data-source-management/validate`

Test connection to a data source.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Existing data source ID (optional for new connections) |
| `dataSourceAttr.endpoint` | string | OpenSearch endpoint URL |
| `dataSourceAttr.auth` | object | Authentication configuration |

**Auth Types:**
- `no_auth` - No authentication
- `username_password` - Basic auth with `{username, password}`
- `sigv4` - AWS SigV4 with `{region, accessKey, secretKey, service}`

**Example Request:**
```bash
curl -X POST "http://localhost:5601/internal/data-source-management/validate" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "dataSourceAttr": {
      "endpoint": "https://my-opensearch:9200",
      "auth": {
        "type": "username_password",
        "credentials": {
          "username": "admin",
          "password": "admin"
        }
      }
    }
  }'
```

#### `POST /internal/data-source-management/fetchDataSourceMetaData`

Fetch metadata (version, cluster info) from a data source.

---

### Data Source Management

#### Async Query Jobs

#### `POST /api/datasourcemanagement/query/jobs`

Execute an async direct query (PPL/SQL) job against a data connection.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Query string |
| `lang` | string | Language (ppl, sql) |
| `datasource` | string | Data source name |
| `sessionId` | string | Optional session ID |

#### `GET /api/datasourcemanagement/query/jobs/{queryId}/{dataSourceMDSId?}`

Get the status and results of an async query job.

#### `DELETE /api/datasourcemanagement/query/jobs/{queryId}`

Cancel or delete a running query job.

#### Direct Query Data Connections

#### `GET /api/directquery/dataconnections`

List all data connections.

#### `GET /api/directquery/dataconnections/{name}`

Get a data connection by name.

#### `POST /api/directquery/dataconnections`

Create a new data connection.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Connection name |
| `connector` | string | Connector type (e.g., Prometheus, S3) |
| `allowedRoles` | string[] | Allowed roles |
| `properties` | object | Connection properties |

#### `POST /api/directquery/dataconnections/edit`

Edit a data connection's roles.

#### `POST /api/directquery/dataconnections/edit/status`

Update a data connection's status.

#### `DELETE /api/directquery/dataconnections/{name}`

Delete a data connection.

> **Note:** All `/api/directquery/` routes also have MDS variants with `/dataSourceMDSId={id}` path suffix for multi-data-source environments.

#### DSL & PPL Proxy Routes

#### `POST /api/directquery/dsl/search`

Proxy DSL search queries to a data connection.

#### `GET /api/directquery/dsl/cat.indices`

Proxy cat indices request.

#### `GET /api/directquery/dsl/indices.getFieldMapping`

Proxy get field mapping request.

#### `GET /api/directquery/dsl/indices.getFieldSettings`

Proxy get field settings request.

#### `POST /api/directquery/ppl/search`

Execute a PPL query against a data connection.

---

### Home

#### `POST /api/home/hits_status`

Check whether an index has any matching documents (used by the home page to detect data).

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `index` | string | Index pattern to search |
| `query` | object | OpenSearch query DSL |

#### `GET /api/sample_data`

List available sample datasets and their install status.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data_source_id` | string | Data source ID |

#### `POST /api/sample_data/{id}`

Install a sample dataset (flights, ecommerce, logs).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `now` | string | Override current timestamp |
| `data_source_id` | string | Target data source |

#### `DELETE /api/sample_data/{id}`

Uninstall a sample dataset.

---

### Index Pattern Management

#### `GET /internal/index-pattern-management/resolve_index/{query}`

*(Internal)* Resolve index names matching a pattern. Used by the index pattern creation workflow.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Index pattern query (supports wildcards) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `expand_wildcards` | string | `all`, `open`, `closed`, `hidden`, or `none` |
| `data_source` | string | Data source ID |

#### `POST /internal/index-pattern-management/preview_scripted_field`

*(Internal)* Preview a scripted field's output on sample documents.

---

### Legacy Export/Import

#### `GET /api/opensearch-dashboards/dashboards/export`

Export dashboards and their dependencies in legacy format.

#### `POST /api/opensearch-dashboards/dashboards/import`

Import dashboards from legacy format.

---

### Query Enhancements

#### `POST /api/enhancements/search/{strategy}`

Execute a search using a specific query strategy (SQL, PPL, etc.).

#### `GET /api/enhancements/assist/languages`

List supported query assist languages.

#### `POST /api/enhancements/assist/generate`

Generate a query using AI assistance with time range support.

#### `GET /api/enhancements/jobs`
#### `POST /api/enhancements/jobs`
#### `DELETE /api/enhancements/jobs`

Async query job management: check status, create jobs, and cancel running jobs.

#### `GET /api/enhancements/connections`

List available data connections.

#### `GET /api/enhancements/connections/{id?}`

Get a specific data connection by ID or the default connection.

#### `GET /api/enhancements/remote_cluster/list`

List remote cluster connections.

#### `GET /api/enhancements/remote_cluster/indexes`

Get indexes from a remote cluster.

#### `POST /api/enhancements/resources`

Resource discovery endpoint.

---

### Region Map (Geospatial)

#### `POST /api/geospatial/_indices`

List indices matching a pattern (filtered to geospatial/map indices).

#### `POST /api/geospatial/_search`

Search a geospatial index for map data.

#### `POST /api/geospatial/_mappings`

Get field mappings for a geospatial index.

---

### Saved Objects Management

Management UI-specific endpoints for browsing and managing saved objects.

#### `GET /api/opensearch-dashboards/management/saved_objects/_find`

Enhanced find endpoint with management-specific metadata injection.

**Query Parameters:** Same as core `_find` plus:

| Parameter | Type | Description |
|-----------|------|-------------|
| `sortOrder` | string | Sort direction |
| `fields` | string or string[] | Fields to include in response |

#### `GET /api/opensearch-dashboards/management/saved_objects/{type}/{id}`

Get a saved object with management metadata.

#### `POST /api/opensearch-dashboards/management/saved_objects/scroll/counts`

Get document counts per saved object type.

#### `POST /api/opensearch-dashboards/management/saved_objects/scroll/export`

Stream export all objects of given types.

#### `GET /api/opensearch-dashboards/management/saved_objects/relationships/{type}/{id}`

Get relationship graph for a saved object.

#### `GET /api/opensearch-dashboards/management/saved_objects/_allowed_types`

Get the list of saved object types that can be imported/exported.

---

### Share (Short URLs)

#### `POST /api/shorten_url`

Create a shortened URL for sharing.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The long URL to shorten (must be a valid internal OSD path) |

**Example Response:**
```json
{
  "urlId": "abc123"
}
```

#### `GET /api/short_url/{urlId}`

Retrieve the original URL from a shortened URL ID.

#### `GET /goto/{urlId}`

Redirect to the full URL from a short URL ID.

---

### Telemetry

#### `POST /api/telemetry/v2/optIn`

Opt in or out of telemetry collection.

#### `POST /api/telemetry/v2/clusters/_stats`

Fetch telemetry usage statistics.

#### `POST /api/telemetry/v2/clusters/_opt_in_stats`

Report opt-in statistics.

#### `PUT /api/telemetry/v2/userHasSeenNotice`

Mark the telemetry notice as seen by the user.

---

### Usage Collection

#### `POST /api/ui_metric/report`

Report batched UI interaction metrics for usage tracking.

#### `GET /api/stats`

Get aggregated cluster usage statistics.

---

### Vis Augmenter

#### `GET /api/vis_augmenter/stats`

Get statistics about augmented visualizations.

---

### Vis Type Timeline

#### `GET /api/timeline/functions`

List available Timeline functions.

#### `POST /api/timeline/run`

Execute a Timeline expression.

#### `GET /api/timeline/validate/es`

Validate an OpenSearch query used in Timeline expressions.

---

### Vis Type Timeseries (TSVB)

#### `GET /api/metrics/fields`

Get available fields for an index pattern (used by TSVB).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | string | Index pattern |
| `data_source` | string | Data source ID |

#### `POST /api/metrics/vis/data`

Execute a TSVB visualization query and return time-series data.

#### `POST /api/metrics/vis/data-raw`

Execute a TSVB query and return raw, unprocessed data.

---

### Workspaces

Manage workspaces for organizing saved objects and access control.

**Base URL:** `/api/workspaces`

#### `POST /api/workspaces/_list`

List workspaces with optional search and pagination.

**Request Body:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | - | Search query |
| `sortOrder` | string | - | Sort direction |
| `perPage` | number | `20` | Results per page |
| `page` | number | `1` | Page number |
| `sortField` | string | - | Field to sort by |
| `searchFields` | string[] | - | Fields to search |
| `permissionModes` | string[] | - | Filter by permission mode |

---

#### `GET /api/workspaces/{id}`

Get a workspace by ID.

---

#### `POST /api/workspaces`

Create a new workspace.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attributes.name` | string | Yes | Workspace name (max 40 chars) |
| `attributes.features` | string[] | Yes | Use case feature configurations (exactly one use case required) |
| `attributes.description` | string | No | Description (max 200 chars) |
| `attributes.color` | string | No | Hex color code |
| `attributes.icon` | string | No | Icon identifier |
| `settings.permissions` | object | No | Permission mappings by mode and principal type |
| `settings.dataSources` | string[] | No | Associated data source IDs |
| `settings.dataConnections` | string[] | No | Associated data connection IDs |

**Example Request:**
```bash
curl -X POST "http://localhost:5601/api/workspaces" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "name": "Analytics Team",
      "features": ["use-case-observability"],
      "description": "Shared workspace for the analytics team",
      "color": "#54B399"
    },
    "settings": {
      "dataSources": ["ds-id-1"]
    }
  }'
```

---

#### `PUT /api/workspaces/{id}`

Update a workspace.

---

#### `DELETE /api/workspaces/{id}`

Delete a workspace and all associated metadata.

---

#### `POST /api/workspaces/_associate`

Associate saved objects with a workspace.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `workspaceId` | string | Target workspace ID |
| `savedObjects` | array | Objects to associate `[{id, type}]` |

---

#### `POST /api/workspaces/_dissociate`

Remove saved objects from a workspace.

**Request Body:** Same schema as `_associate`.

---

#### `POST /api/workspaces/_duplicate_saved_objects`

Duplicate saved objects from one workspace to another.

---

## Common Patterns

### Error Responses

All API endpoints return errors in a consistent format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters or body)
- `401` - Unauthorized (missing or invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (version mismatch or duplicate)
- `413` - Payload Too Large (file upload exceeds limit)
- `500` - Internal Server Error

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) must include the `osd-xsrf` header:

```
osd-xsrf: true
```

Requests without this header will be rejected with a `400` error.

### Pagination

List/find endpoints follow a consistent pagination pattern:

```json
{
  "page": 1,
  "per_page": 20,
  "total": 150,
  "saved_objects": [...]
}
```

### Internal vs Public APIs

- **`/api/`** - Public APIs intended for external consumption. Stable between minor versions.
- **`/internal/`** - Internal APIs used by OSD's own UI. May change without notice between versions. Do not depend on these in external integrations.

### Workspace-Aware Requests

Many endpoints accept workspace context via:
- Query parameter: `?workspaces=workspace-id`
- Request body field: `"workspaces": ["workspace-id"]`

When workspace isolation is enabled, requests are scoped to the specified workspace.

### Data Source-Aware Requests

Endpoints that interact with OpenSearch data often accept a `dataSource` or `data_source` parameter to target a specific remote OpenSearch cluster instead of the local one.
