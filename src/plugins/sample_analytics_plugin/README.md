# Sample Analytics Plugin

Reference implementation demonstrating telemetry integration with the OpenSearch Dashboards core telemetry service — both client-side and server-side.

## What This Demonstrates

### Client-Side (Browser)

| Pattern | File | Description |
|---------|------|-------------|
| Telemetry service wrapper | `public/services/telemetry_service.ts` | Reusable service with domain-specific tracking methods |
| React context & hook | `public/components/telemetry_context.tsx` | `TelemetryProvider` and `useTelemetry()` hook |
| User action tracking | `public/components/sample_app.tsx` (UserActionsDemo) | Button clicks, tab changes, form submissions |
| Performance tracking | `public/components/sample_app.tsx` (PerformanceDemo) | `trackAsync()` for automatic duration + error capture |
| Error tracking | `public/components/sample_app.tsx` (ErrorTrackingDemo) | Caught exceptions and custom validation errors |
| Workflow tracking | `public/components/sample_app.tsx` (WorkflowDemo) | Multi-step workflows with step/completion/abandon |
| Event constants | `common/index.ts` | Centralized event and metric name constants |

### Server-Side

| Pattern | File | Description |
|---------|------|-------------|
| Server telemetry service | `server/services/server_telemetry_service.ts` | Three telemetry approaches in one service |
| API route tracking | `server/routes/analytics_routes.ts` | Duration, success/failure, DB operations |
| Background job tracking | `server/routes/analytics_routes.ts` (run_job) | Job outcome and duration |
| Error tracking | `server/services/server_telemetry_service.ts` | Structured error logging with context |
| HTTP forwarder | `server/services/server_telemetry_service.ts` | Forward events to telemetry index |
| Kinesis integration | `server/services/server_telemetry_service.ts` | Direct backend (commented out) |

## Server-Side Telemetry — Three Options

### Option 1: Structured Logging (Recommended)

Uses the OSD Logger to emit structured telemetry lines. Zero dependencies — log aggregators (CloudWatch, Datadog, ELK) parse these automatically.

```typescript
// In your server plugin:
const telemetry = new ServerTelemetryService(logger);

telemetry.trackRoute('/api/my_route', 'GET', 200, 42);
telemetry.trackBackgroundJob('reindex', 'success', 3500);
telemetry.trackDbOperation('search', 'my-index', 15, 250);
telemetry.trackError(new Error('timeout'), { route: '/api/search' });
```

### Option 2: HTTP Forwarder

Forwards events to an OpenSearch telemetry index, reusing the existing pipeline.

```typescript
// In a route handler:
const client = context.core.opensearch.client.asInternalUser;
await telemetry.forwardEvent(client, 'server_action', { key: 'value' });
```

### Option 3: Direct Kinesis (Production)

Uncomment the Kinesis section in `server_telemetry_service.ts` and configure:

```typescript
telemetry.initKinesis({ region: 'us-east-1', streamName: 'osd-telemetry' });
await telemetry.sendToKinesis('server_event', { data: 'value' });
```

## Quick Start — Copy These Patterns

### Client-side

```typescript
// 1. Create service
const telemetry = new MyTelemetryService(core.telemetry);

// 2. Track user actions
telemetry.trackButtonClick('save');

// 3. Track async operations (auto-records duration + errors)
const data = await telemetry.trackAsync('fetch_data', () => fetchData(params));

// 4. Track workflows
const wf = telemetry.startWorkflow('setup_wizard');
wf.completeStep('step_1');
wf.complete(); // or wf.abandon('user_cancelled');
```

### Server-side

```typescript
// 1. Create service in plugin setup
const telemetry = new ServerTelemetryService(logger);

// 2. Track routes
telemetry.trackRoute('/api/my_route', 'GET', 200, durationMs);

// 3. Wrap operations with automatic tracking
const result = await telemetry.trackAsync('my_operation', () => doWork());

// 4. Track errors
telemetry.trackError(error, { route: '/api/my_route' });
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sample_analytics/stats?index=` | Fetch index stats with DB operation tracking |
| POST | `/api/sample_analytics/process` | Process items with `trackAsync` |
| POST | `/api/sample_analytics/run_job` | Simulate background job with outcome tracking |
| POST | `/api/sample_analytics/track_event` | Forward event via HTTP forwarder (Option 2) |

## File Structure

```
sample_analytics_plugin/
├── opensearch_dashboards.json
├── common/
│   └── index.ts                          # Shared event/metric constants
├── public/
│   ├── index.ts                          # Plugin exports
│   ├── plugin.ts                         # Client plugin (setup/start)
│   ├── types.ts                          # Client Setup/Start contracts
│   ├── application.tsx                   # App mount/unmount
│   ├── components/
│   │   ├── index.ts
│   │   ├── sample_app.tsx                # Demo UI with all tracking patterns
│   │   └── telemetry_context.tsx         # React context + useTelemetry hook
│   └── services/
│       ├── index.ts
│       └── telemetry_service.ts          # Client telemetry wrapper
├── server/
│   ├── index.ts                          # Server exports
│   ├── plugin.ts                         # Server plugin (setup/start)
│   ├── types.ts                          # Server Setup/Start contracts
│   ├── routes/
│   │   ├── index.ts
│   │   └── analytics_routes.ts           # API routes with telemetry examples
│   └── services/
│       ├── index.ts
│       └── server_telemetry_service.ts   # Server telemetry (3 options)
└── tsconfig.json
```
