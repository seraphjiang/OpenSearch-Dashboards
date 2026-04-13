# OpenSearch Dashboards — Code Quality Report

**Date:** 2026-04-02 | **Ref:** V2120695287 | **Scope:** `src/plugins/data/`, `src/core/`

## P1 — Bugs

| # | Issue | Location |
|---|-------|----------|
| 1 | `isFieldRefreshRequired` legacy shim — `.every()` on empty array=true, triggers writes on read. Root cause of Asurion 409 cascade | `data_views.ts` L391, `index_patterns.ts` L282 |
| 2 | `updateSavedObject` retry calls `this.get()` → re-triggers refresh → recursive amplification. Nested calls bypass MAX_ATTEMPTS | `data_views.ts` L862-904 |
| 3 | Missing `await` on `updateSavedObject` — catch blocks are dead code | `data_views.ts` L230,L655; `index_patterns.ts` L525 |
| 4 | Inconsistent 409 detection — create checks 3 shapes, update checks only `err?.res?.status` | `data_views.ts` L816 vs L869 |
| 5 | `dataSourceRef.type` overloaded — INDEX='DATA_SOURCE' breaks `savedObjectsClient.get()` | `data_view.ts` L71-97 |
| 6 | `throw` in `.catch()` on fire-and-forget → unhandled rejections | `dataset_service.ts` L142,L163 |

## P2 — Performance

| # | Issue | Location |
|---|-------|----------|
| 7 | DatasetSelect `getMultiple()` loads full field specs for dropdown (only needs titles). `find()` also calls `get()` per result — not lightweight | `dataset_select.tsx` L396; `data_views.ts` L757 |
| 8 | 7+ plugins call `get()` on read paths: vis_builder, discover, explore, agent_traces, data_explorer, dataset_management, logs_dataset_selector | various |
| 9 | `retryCallCluster` retries `NoLivingConnectionsError` forever with no max | `retry_call_cluster.ts` L55-66 |

## P3 — Dead Code / Tech Debt

| # | Issue | Location |
|---|-------|----------|
| 10 | `index_patterns/` vs `data_views/` full duplication (47 vs 46 files, identical bugs). `dataset_service.ts` L130-175 branches between both | `common/index_patterns/`, `common/data_views/` |
| 11 | Legacy search strategy — `@deprecated` but NOT dead: active behind `COURIER_BATCH_SEARCHES` setting | `search/search_source/legacy/` |
| 12 | `DeprecatedMatchPhraseFilter` — NOT dead: still in active filter pipeline via `from_filters.ts:82` | `migrate_filter.ts` |
| 13 | explore + agent_traces DatasetSelectWidget 95% identical (213 lines each, ~15 differ) | both `dataset_select.tsx` |
| 14 | Dead imports in agent_traces dataset_select: `useSelector`, `selectQuery`, `currentQuery`, `AgentTracesFlavor` | agent_traces `dataset_select.tsx` |
| 15 | Dead `appName` prop — defined, never destructured, silently ignored | data `dataset_select.tsx` L85 |
| 16 | Dead exports: `baseFormattersPublic`, `useSavedQuery`, `DetailedDataset`, `DatasetSelector`, `DatasetSelectorAppearance`, `opensearchKuery` | `data/public/index.ts` |
| 17 | Dead file: `discover/helpers/migrate_legacy_query.ts` — never imported (copies in dashboard/visualize/data are used) | discover |
| 18 | Dead import: `EuiConfirmModal` in `saved_query_list_item.tsx` L31 (suppressed with `@ts-expect-error`) | data/public/ui |
| 19 | Autocomplete errors silently swallowed (4+ files, empty catch with TODO) | `code_completion.ts`, `utils.ts` |
| 20 | Structure cache never cleared on logout | `_structure_cache.ts` L29 |
| 21 | Hardcoded ".kibana" in user-facing i18n string | `courier_inspector_stats.ts` L65 |
| 22 | Typos: `scriptdFields` (L476), `souerce` (check_conflict), `an data view` (L911) |
| 23 | SCSS hack: `margin-bottom: -3px` magic number | `_query_editor.scss` L141 |
| 24 | Stale TODOs: QueryState temp dataset field (types.ts L41), `remove!` on Timefilter (L41), isDateHistogramBucketAggConfig (index.ts L484) |

## Fix Priority

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | `isFieldRefreshRequired` empty array guard | Trivial | Eliminates 409 class |
| 2 | Add `await` to `updateSavedObject` calls | Trivial | Fixes dead catch blocks |
| 3 | Unify 409 detection into shared helper | Low | Consistent conflict handling |
| 4 | DatasetSelect: skip field refresh for dropdown | Low | Massive perf win |
| 5 | Retry: use `savedObjectsClient.get()` not `this.get()` | Low | Stops amplification |
| 6 | Fix dataset_service.ts thrown errors in .catch | Low | Stops unhandled rejections |
| 7 | Remove `isFieldRefreshRequired` entirely | Medium | get() becomes read-only |
| 8 | Fix `dataSourceRef.type` normalization | Medium | Fixes INDEX datasets |
| 9 | Add max retry to `retryCallCluster` | Medium | Prevents infinite hang |
| 10 | Deduplicate explore/agent_traces widget | Medium | -200 lines |
| 11 | Consolidate index_patterns → data_views | Large | Eliminates dual maintenance |
