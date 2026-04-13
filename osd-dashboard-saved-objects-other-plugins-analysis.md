# OpenSearch Dashboards: Dashboard, Saved Objects & Other Plugins Analysis

## Summary

Analysis of 13 plugin areas in the OpenSearch Dashboards codebase focusing on Scroll API usage, DSL query construction, filter types, aggregation cross-references, script usage, and sample data visualization agg types.

---

## 1. `src/plugins/dashboard/` — Dashboard Plugin

### Scroll API Usage
- **None.** Dashboard plugin does not use scroll API directly.

### DSL Query Construction
- **`server/saved_objects/move_filters_to_query.ts`**: Migrates pre-6.0.0 dashboard saved objects that stored filters in `searchSource.filter[]` with `query_string` queries into proper `query` field format.
- **`server/saved_objects/migrate_match_all_query.ts`**: Migrates obsolete `match_all` queries from dashboard saved objects to `{ query: '', language: 'kuery' }`.
- **`server/saved_objects/dashboard_migrations.ts`**: Iterates `searchSource.filter` rows, migrating `match_phrase` → `match_phrase` format and `query_string` queries.

### Filter Types Used
- **`Filter`**, **`Query`** types from `data/public` used throughout.
- Dashboard container passes `filters: Filter[]` to all child embeddables via `DashboardContainerInput`.
- **`opensearchFilters`** utilities used for filter state sync with URL.
- **Cross-panel filtering**: Dashboard container (`dashboard_container.tsx`) propagates `filters`, `query`, `timeRange` to all embedded panels via inherited input state. No explicit `APPLY_FILTER` trigger in dashboard code — that's handled by the embeddable framework.

### Cross-References to Aggregation Types
- None directly. Dashboard delegates to visualization embeddables.

### Script Usage
- None directly.

---

## 2. `src/plugins/saved_objects_management/` — Saved Objects Management

### Scroll API Usage
- **`server/routes/scroll_export.ts`**: Route `POST /api/opensearch-dashboards/management/saved_objects/scroll/export` — uses `findAll()` to paginate through all saved objects of given types (1000 per page). Despite the "scroll" name, it uses **recursive `client.find()` pagination**, NOT the OpenSearch scroll API.
- **`server/routes/scroll_count.ts`**: Route `POST /api/opensearch-dashboards/management/saved_objects/scroll/counts` — same `findAll()` pattern to count objects by type/namespace/workspace.
- **`server/lib/find_all.ts`**: Implements recursive pagination via `client.find({ page })` — iterates pages until `allObjects.length >= total`.
- **`public/lib/get_saved_object_counts.ts`**: Client-side calls the `/scroll/counts` endpoint.

### DSL Query Construction
- **`server/routes/find.ts`**: Passes `search`, `searchFields`, `type` to `client.find()` — the saved objects client handles DSL internally.
- **`public/lib/parse_query.ts`**: Parses user search input into `type` filter and text query.

### Filter Types Used
- None directly (operates at saved object level, not OpenSearch DSL level).

### Script Usage
- None.

---

## 3. `src/plugins/saved_objects/` — Saved Objects Plugin

### Scroll API Usage
- **None.** This is the client-side saved object abstraction (SavedObjectLoader, SavedObjectFinder). No scroll API.

### DSL Query Construction
- None directly. Delegates to `savedObjectsClient.find()`.

### Filter Types Used
- None directly.

### Script Usage
- None.

---

## 4. `src/plugins/vis_augmenter/` — Visualization Augmenter

### Scroll API Usage
- None.

### DSL Query Construction
- None directly. Works with Vega spec augmentation and event overlays.

### Filter Types Used
- None directly.

### Cross-References to Aggregation Types
- **`public/utils/utils.ts`**: Works with `VisLayer` types for overlaying events on time-series visualizations.
- Referenced in `build_pipeline.ts` via `VisAugmenterEmbeddableConfig` and `VisLayers` imports.

### Script Usage
- None.

---

## 5. `src/plugins/visualizations/` — Visualizations Service

### Scroll API Usage
- None.

### DSL Query Construction
- **`public/legacy/build_pipeline.ts`** — **KEY FILE**: Constructs the expression pipeline for visualizations:
  - Builds `opensearch_dashboards_context` with `query` and `filters` JSON
  - Builds `opensearchaggs` expression with `index`, `metricsAtAllLevels`, `aggConfigs`
  - Handles vis-type-specific pipeline functions: `vega`, `input_control_vis`, `tsvb`, `regionmap`, `tilemap`, `opensearch_dashboards_pie`, `vislib`

### Filter Types Used
- Passes through `filters` from `searchSource.getField('filter')` into the pipeline.

### Cross-References to Aggregation Types
- **`build_pipeline.ts` → `getSchemas()`**: Maps agg configs to schema types:
  - `metric`, `bucket`, `geo_centroid`, `group`, `segment`, `split_row`, `split_column`, `radius`, `width`
  - Special handling for `geohash_grid` (precision, useGeocentroid params)
  - Special handling for `geo_centroid` schema assignment
  - References pipeline agg types: `derivative`, `moving_avg`, `serial_diff`, `cumulative_sum`, `sum_bucket`, `avg_bucket`, `min_bucket`, `max_bucket`
  - `date_histogram` and `histogram` bucket handling with interval/bounds
- **`buildVisConfig.tile_map`**: Uses `metric`, `geohash` (segment), `geocentroid` dimensions
- **`buildVisConfig.region_map`**: Uses `metric` and `bucket` (segment)
- **`buildVisConfig.pie`**: Uses `metric`, `buckets` (segment), `splitRow`, `splitColumn`

### Script Usage
- None directly (scripts are in the data plugin's agg configs).

---

## 6. `src/plugins/embeddable/` — Embeddable Framework

### Scroll API Usage
- None.

### DSL Query Construction
- None. Framework provides container/embeddable abstractions.

### Filter Types Used
- **`common/types.ts`**: `EmbeddableInput` includes `filters?: Filter[]`, `query?: Query`, `timeRange?: TimeRange` — the mechanism for cross-panel filter propagation.
- Containers inherit and pass filters to child embeddables.

### Script Usage
- None.

---

## 7. `src/plugins/expressions/` — Expressions Framework

### Scroll API Usage
- None.

### DSL Query Construction
- None directly. Provides the expression language runtime (`opensearchDashboards | opensearch_dashboards_context | opensearchaggs | ...`).

### Filter Types Used
- **`common/types/style.ts`**: Defines `Overflow.SCROLL` enum value (CSS, not OpenSearch scroll).

### Script Usage
- None.

---

## 8. `src/plugins/query_enhancements/` — Query Enhancements Plugin

### Scroll API Usage
- None.

### DSL Query Construction
- **`public/search/filters/filter_utils.ts`** — **KEY FILE**: Converts core `Filter` objects to PPL/SQL WHERE clauses:
  - `phrase` → `\`field\` = 'value'`
  - `phrases` → `\`field\` = 'v1' OR \`field\` = 'v2'`
  - `range` → `\`field\` >= gte AND \`field\` < lt`
  - `exists` → `ISNOTNULL(\`field\`)`
  - `match_phrase` → `\`field\` = 'value'`
  - Negation variants for all types
- **`public/search/filters/natural_language_filter_utils.ts`**: Converts filters to natural language predicates (e.g., `field is 'value'`, `field should exist`).
- **`public/search/filters/ppl_filter_utils.ts`**: PPL-specific filter conversion.
- **`server/search/ppl_search_strategy.ts`**: PPL search strategy.
- **`server/search/sql_search_strategy.ts`**: SQL search strategy.
- **`server/search/promql_search_strategy.ts`**: PromQL search strategy.
- **`server/utils/facet.ts`**: Facet-based query execution.

### Filter Types Used
- `phrase`, `phrases`, `range`, `exists`, `match_phrase` — all converted to SQL/PPL/natural language equivalents.

### Script Usage
- None.

---

## 9. `src/plugins/console/` — Dev Tools Console

### Scroll API Usage
- None in the spec definitions (console is an editor, not a query executor).

### DSL Query Construction
- **`server/lib/spec_definitions/js/query/dsl.ts`** — **KEY FILE**: Complete DSL query autocomplete spec defining all query types:
  - `match`, `match_phrase`, `match_phrase_prefix`, `regexp`, `multi_match`
  - `bool` (must, must_not, should, filter), `boosting`, `ids`, `constant_score`, `dis_max`
  - `distance_feature`, `exists`, `field`, `fuzzy`
  - `has_child`, `has_parent`, `match_all`, `more_like_this`
  - `prefix`, `query_string`, `simple_query_string`, `range`
  - `span_first`, `span_multi`, `span_near`, `span_term`, `span_not`, `span_or`, `span_containing`, `span_within`
  - `term`, `terms`, `wildcard`, `nested`, `percolate`, `common`
  - `geo_shape` (with `__scope_link` to filter.geo_shape)
  - `function_score` (script_score, boost_factor, random_score, linear/exp/gauss decay, field_value_factor)
  - `script`, `wrapper`

### Filter Types Defined (in `filter.ts`)
- **`geo_bounding_box`**: top_left/bottom_right lat/lon, type (memory/indexed)
- **`geo_distance`**: distance, distance_unit (km/miles), distance_type (arc/plane)
- **`geo_distance_range`**: from/to distance with units
- **`geo_polygon`**: points array with lat/lon
- **`geo_shape`**: shape (type, coordinates), indexed_shape, relation (within/intersects/disjoint)
- **`exists`**: field
- **`range`**: gte/gt/lte/lt, time_zone, format
- **`term`**, **`terms`**: field/value matching
- **`bool`**: scope_link to query
- **`nested`**: path + query
- **`script`**: script object
- **`prefix`**, **`ids`**, **`limit`**, **`type`**, **`missing`**, **`and`**, **`or`**, **`not`**
- **`has_child`**, **`has_parent`**: with type/query/filter

### Cross-References to Aggregation Types (in `aggregations.ts`)
- **Metric aggs**: `min`, `max`, `avg`, `sum`, `stats`, `extended_stats`, `value_count`, `cardinality`, `cumulative_cardinality`, `percentiles`, `percentile_ranks`, `geo_bounds`, `top_hits`, `scripted_metric`, `matrix_stats`
- **Bucket aggs**: `terms`, `significant_terms`, `significant_text`, `range`, `date_range`, `ip_range`, `histogram`, `date_histogram`, `geo_distance`, `geohash_grid`, `composite`, `filters`, `filter`, `missing`, `nested`, `reverse_nested`, `adjacency_matrix`, `diversified_sampler`, `sampler`, `children`
- **Pipeline aggs**: `derivative`, `avg_bucket`, `max_bucket`, `min_bucket`, `stats_bucket`, `extended_stats_bucket`, `percentiles_bucket`, `sum_bucket`, `moving_avg`, `cumulative_sum`, `serial_diff`, `bucket_script`, `bucket_selector`, `bucket_sort`

### Script Usage
- `script_score` in function_score
- `script_fields` in inner_hits and search
- `script` in filters, terms agg, range agg, value_count, percentiles, cardinality, sampler
- `scripted_metric` agg (init_script, map_script, combine_script, reduce_script)
- `script_heuristic` in significant_terms

---

## 10. `src/plugins/home/` — Sample Data

### Sample Data Visualizations with Specific Agg Types

#### Logs Dataset (`data_sets/logs/saved_objects.ts`)
| Visualization | Type | Agg Types Used |
|---|---|---|
| [Logs] Visitors Map | vega | `geohash_grid` (gridSplit) in Vega spec body |
| [Logs] Heatmap | heatmap | `count`, `terms`, `date_histogram` |
| [Logs] Source/Dest Sankey | vega | `composite` with `terms` in Vega spec |
| [Logs] Response Codes Over Time | metrics (TSVB) | `cardinality`, `terms` split |
| [Logs] Input Controls | input_control_vis | `terms` (geo.src, machine.os.keyword) |
| [Logs] Visitors by OS | pie | `count`, `terms` |
| (Area) Stacked extensions | area | `count`, `date_histogram`, `terms` |
| (Vega) Stacked extensions | vega | `date_histogram`, `terms` in Vega spec |

#### Flights Dataset (`data_sets/flights/saved_objects.ts`)
| Visualization | Type | Agg Types Used |
|---|---|---|
| [Flights] Controls | input_control_vis | `terms` (OriginCityName, DestCityName) |
| [Flights] Airline Carrier | pie | `count`, `terms` |
| [Flights] Delay Type | area | `count`, `terms`, `date_histogram` |
| [Flights] Flight Delays | histogram | `count`, `terms` |
| [Flights] Flight Cancellations | histogram | `count`, `terms` |
| [Flights] Destination Weather | tagcloud | `count`, `terms` |
| [Flights] Departure Count Map | vega | `geohash_grid` in Vega spec |
| [Flights] Origin vs Dest Country | heatmap | `count`, `terms` (2 levels) |
| [Flights] Origin/Dest Map | vega | `geohash_grid`, `terms` in Vega spec |

#### eCommerce Dataset (`data_sets/ecommerce/saved_objects.ts`)
| Visualization | Type | Agg Types Used |
|---|---|---|
| [eCommerce] Sales by Category | area | `count`, `date_histogram`, `terms` |
| [eCommerce] Sales by Gender | pie | `count`, `terms` |
| [eCommerce] Controls | input_control_vis | `terms` (manufacturer, category) |
| [eCommerce] Sales Count Map | vega | `geohash_grid` in Vega spec |
| [eCommerce] Top Selling Products | tagcloud | `count`, `terms` |

#### Geo Field Mappings
- **Flights**: `OriginLocation` (geo_point), `DestLocation` (geo_point)
- **eCommerce**: `geoip.location` (geo_point)
- **Logs**: `geo.coordinates` (geo_point)

### Note on geo_centroid / geo_bounds / top_hits in Sample Data
- Sample data Vega visualizations use **`geohash_grid`** for map visualizations but do NOT explicitly use `geo_centroid`, `geo_bounds`, or `top_hits` aggs in their saved object definitions.
- These agg types are available in the data plugin and console spec but not exercised in sample data.

---

## 11. `src/plugins/agent_traces/` — Agent Traces Plugin

### Scroll API Usage
- None (editor scroll settings only — `scrollBeyondLastLine`, `scrollbar` for Monaco editor).

### DSL Query Construction
- None directly. Uses PPL/SQL via query_enhancements search strategies.

### Filter Types Used
- None directly.

### Script Usage
- None.

### Notes
- Registers saved object type `agent-traces` with `server/saved_objects/agent_traces.ts`.
- Embeddable component for dashboard integration.
- Uses query assist (AI-powered) via `application/utils/query_assist/agui_agent.ts`.

---

## 12. `src/plugins/vis_type_timeline/` — Timeline (Timelion) Plugin

### Scroll API Usage
- None.

### DSL Query Construction
- **`server/series_functions/opensearch/lib/build_request.js`** — **KEY FILE**: Builds OpenSearch request body:
  - Constructs `bool.filter` from `tlConfig.request.body.extended.es.filter`
  - Builds `query_string` queries from user input
  - Creates `date_histogram` agg with `extended_bounds`, `time_zone`, `interval`
- **`server/series_functions/opensearch/lib/create_date_agg.js`**: Creates date_histogram aggregation with metric sub-aggs.
- **`server/series_functions/opensearch/lib/agg_body.js`**: Builds agg body for scripted fields.
- **`server/series_functions/opensearch/index.js`**: Defines Timeline `.opensearch()` function with params: `q` (lucene query), `metric` (avg/sum/min/max/percentiles/cardinality), `index`, `timefield`, `split`, `opensearchDashboards`, `fit`, `offset`.

### Filter Types Used
- `bool.filter` from dashboard context
- `query_string` for user queries

### Cross-References to Aggregation Types
- `date_histogram` (primary time bucketing)
- Metric aggs: `avg`, `sum`, `min`, `max`, `percentiles`, `cardinality`

### Script Usage
- `agg_body.js`: Handles scripted fields in aggregation body construction.

---

## 13. `src/core/server/saved_objects/` — Core Server Saved Objects

### Scroll API Usage — **PRIMARY SCROLL CONSUMER**
- **`migrations/core/opensearch_index.ts`** → `reader()` function:
  - Uses **real OpenSearch scroll API** for reading documents during migrations
  - `client.search({ body: { size: batchSize }, index, scroll: scrollDuration })`
  - `client.scroll({ scroll, scroll_id: scrollId })` for subsequent batches
  - `client.clearScroll({ scroll_id: scrollId })` on completion
  - Default `scrollDuration: '15m'`, `batchSize: 10`
- **`migrations/core/call_cluster.ts`**: Defines `ScrollOpts` interface with `scroll: string`, `scroll_id: string`.
- **`migrations/core/migration_opensearch_client.ts`**: Exposes `scroll` and `clearScroll` methods on migration client.
- **`migrations/core/migration_context.ts`**: `scrollDuration` config passed through migration context.
- **`migrations/core/index_migrator.ts`**: Uses `Index.reader()` with `batchSize` and `scrollDuration` for document migration.
- **`migrations/opensearch_dashboards/opensearch_dashboards_migrator.ts`**: Passes `scrollDuration` from `savedObjectsConfig`.
- **`saved_objects_config.ts`**: `scrollDuration: schema.string({ defaultValue: '15m' })`.

### DSL Query Construction
- Migration reader uses `client.search({ body: { size: batchSize }, index, scroll })` — minimal DSL, just size-based reads.

### Filter Types Used
- None directly in migrations.

### Script Usage
- None directly.

---

## Cross-Cutting Findings

### Scroll API Usage Summary

| Location | Real Scroll API? | Mechanism |
|---|---|---|
| `core/server/saved_objects/migrations/` | **YES** | `search` + `scroll` + `clearScroll` for index migration |
| `saved_objects_management/server/routes/scroll_export.ts` | **NO** | Recursive `client.find()` pagination (misnamed "scroll") |
| `saved_objects_management/server/routes/scroll_count.ts` | **NO** | Recursive `client.find()` pagination (misnamed "scroll") |
| `saved_objects_management/server/lib/find_all.ts` | **NO** | Page-based iteration via `client.find({ page })` |

### Filter Types Cross-Reference

| Filter Type | Console Spec | Data Plugin | Query Enhancements |
|---|---|---|---|
| `geo_bounding_box` | ✅ | ✅ (filter type) | ❌ |
| `geo_shape` | ✅ | ✅ (filter type) | ❌ |
| `geo_distance` | ✅ | ❌ | ❌ |
| `geo_polygon` | ✅ | ✅ (filter type) | ❌ |
| `phrase` | ✅ (match) | ✅ (PhraseFilter) | ✅ (PPL/NL) |
| `phrases` | ❌ | ✅ (PhrasesFilter) | ✅ (PPL/NL) |
| `range` | ✅ | ✅ (RangeFilter) | ✅ (PPL/NL) |
| `exists` | ✅ | ✅ (ExistsFilter) | ✅ (PPL/NL) |
| `term`/`terms` | ✅ | ✅ | ❌ |
| `bool` | ✅ | ✅ (buildQueryFromFilters) | ❌ |
| `nested` | ✅ | ❌ | ❌ |
| `script` | ✅ | ✅ (getPhraseScript) | ❌ |
| `match_phrase` | ✅ | ✅ | ✅ (PPL/NL) |

### Script Usage Summary

| Location | Script Type |
|---|---|
| `data/common/opensearch_query/filters/phrase_filter.ts` | `getPhraseScript()` — painless lambda for scripted field phrase matching |
| `data/common/opensearch_query/filters/range_filter.ts` | Painless script wrapping for scripted range filters |
| `data/common/opensearch_query/filters/phrases_filter.ts` | `getPhraseScript()` for multi-phrase scripted fields |
| `data/common/opensearch_query/kuery/functions/is.ts` | `getPhraseScript()` for KQL scripted field matching |
| `console/server/lib/spec_definitions/js/aggregations.ts` | `scripted_metric` agg, `script` in terms/range/value_count/percentiles/cardinality |
| `console/server/lib/spec_definitions/js/filter.ts` | `script` filter type |
| `console/server/lib/spec_definitions/js/query/dsl.ts` | `script_score`, `script_fields`, `script` query |
| `vis_type_timeline/server/series_functions/opensearch/lib/agg_body.js` | Scripted field handling in agg body |
