# OpenSearch Dashboards REST API Documentation

Complete OpenAPI 3.0 specifications for all OpenSearch Dashboards REST APIs.

## Quick Start

**View interactive documentation:**
```bash
node scripts/serve_api_docs.js
# Open http://localhost:3000
```

**Validate all specs:**
```bash
node scripts/validate_openapi.js
```

**Regenerate master spec:**
```bash
node scripts/merge_openapi_specs.js
```

## Directory Structure

```
docs/openapi/
├── openapi.yml                      # Master spec (all APIs consolidated)
├── saved_objects/                   # Core saved objects API
│   └── saved_objects.yml
├── index_patterns/                  # Index pattern management
│   └── index_patterns.yml
├── banner/                          # Banner configuration
├── chat/                            # AI chat APIs
├── console/                         # Dev console & proxy
├── data/                            # Search APIs
├── data_source/                     # Multi-data source
├── query_enhancements/              # Query assist
├── telemetry/                       # Usage telemetry
├── workspace/                       # Workspace management
└── [20+ more plugins]/
```

## API Coverage

### Core APIs
- **Saved Objects** (10 endpoints) - CRUD, bulk operations, import/export
- **Index Patterns** (1 endpoint) - Field discovery

### Plugin APIs (23 plugins)
- **banner** - Banner configuration
- **application_config** - App configuration
- **chat** - AI chat and interactions
- **console** - Dev console & OpenSearch proxy
- **data** - Search and query APIs
- **data_source** - Multi-data source management
- **data_source_management** - DSL/PPL queries
- **data_explorer** - Data exploration
- **data_importer** - File import/export
- **home** - Home screen & sample data
- **index_pattern_management** - Index pattern utilities
- **legacy_export** - Legacy export functionality
- **query_enhancements** - Query assist & language support
- **region_map** - Region map visualization
- **saved_objects_management** - Advanced saved object operations
- **share** - URL shortening
- **telemetry** - Usage analytics
- **usage_collection** - Usage metrics
- **vis_augmenter** - Visualization augmentation
- **vis_type_timeseries** - Timeseries visualization
- **vis_type_timeline** - Timeline visualization
- **workspace** - Workspace isolation
- **bfetch** - Batch fetch utilities

## Using the API Documentation

### Interactive Swagger UI

The Swagger UI provides:
- **Browse all endpoints** organized by plugin
- **Try it out** - Make live API calls to your OSD instance
- **View schemas** - See request/response models
- **Copy cURL commands** - Export requests as cURL
- **Download spec** - Export OpenAPI YAML/JSON

### Programmatic Access

```javascript
// Load master spec
const yaml = require('js-yaml');
const fs = require('fs');

const spec = yaml.load(
  fs.readFileSync('docs/openapi/openapi.yml', 'utf8')
);

// Get all paths
console.log(Object.keys(spec.paths));
```

### API Client Generation

Generate type-safe clients using:
- **openapi-generator** - Multi-language support
- **oazapfts** - TypeScript fetch client
- **swagger-codegen** - Legacy generator

```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i docs/openapi/openapi.yml \
  -g typescript-fetch \
  -o src/client
```

## Development

### Adding New Routes

When adding routes to a plugin:

1. **Implement route** in `src/plugins/{plugin}/server/routes/`
2. **Update OpenAPI spec** in `docs/openapi/{plugin}/{plugin}.yml`
3. **Merge into master**: `node scripts/merge_openapi_specs.js`
4. **Validate**: `node scripts/validate_openapi.js`

### Spec Format

All specs follow OpenAPI 3.0 format:

```yaml
openapi: 3.0.3
info:
  version: v1
  title: Plugin Name API
paths:
  /api/plugin/endpoint:
    get:
      summary: Endpoint description
      parameters: [...]
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema: {...}
```

### Validation Rules

- All paths must start with `/api/`
- Required: summary, responses, operationId
- Schema refs must resolve
- Examples should be valid JSON
- Response codes: 200, 201, 204, 400, 401, 403, 404, 409, 500

## Testing

### Contract Testing

Integration tests validate API responses against OpenAPI schemas:

```typescript
import { validateResponse } from 'jest-openapi';
import spec from 'docs/openapi/banner/banner.yml';

it('matches OpenAPI spec', async () => {
  const response = await supertest
    .get('/api/banner/info')
    .expect(200);

  validateResponse(response, spec);
});
```

### Manual Testing

```bash
# Start OSD
yarn start

# Test endpoint
curl http://localhost:5601/api/saved_objects/_find?type=dashboard

# View in Swagger UI
node scripts/serve_api_docs.js
# Try endpoints in browser
```

## Contributing

When contributing API changes:

1. ✅ Update route implementation
2. ✅ Update OpenAPI spec
3. ✅ Add integration tests
4. ✅ Run validation: `node scripts/validate_openapi.js`
5. ✅ Test in Swagger UI
6. ✅ Document breaking changes in PR

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OSD API Architecture](../../CLAUDE.md#architecture)

## Changelog

**2026-03-14**
- ✨ Initial generation of all plugin OpenAPI specs
- ✨ Master spec consolidation
- ✨ Interactive Swagger UI server
- ✨ Validation tooling
