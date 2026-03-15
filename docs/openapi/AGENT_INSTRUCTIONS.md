# OpenAPI Generation Agent Instructions

## Your Task
Generate a complete OpenAPI 3.0 specification for your assigned plugin(s) by analyzing route files and extracting API definitions.

## Template Structure
Use this structure for each plugin:

```yaml
openapi: 3.0.3
info:
  version: v1
  title: "OpenSearch Dashboards {PluginName} API"
  contact:
    name: OpenSearch Dashboards Team
  description: "OpenAPI schema for OpenSearch Dashboards {PluginName} API"
tags:
  - name: {plugin-tag}
    description: Brief description of what this plugin's API does
servers:
  - url: http://localhost:5601
paths:
  /api/{path}:
    {method}:
      tags: [{plugin-tag}]
      summary: Brief description of endpoint
      operationId: {uniqueId}
      parameters: [...]
      requestBody: {...}
      responses:
        '200': {...}
        '400': {...}
        '404': {...}
components:
  schemas:
    400_bad_request:
      title: Bad request
      type: object
      required:
        - error
        - message
        - statusCode
      properties:
        error:
          type: string
          enum:
            - Bad Request
        message:
          type: string
        statusCode:
          type: integer
          enum:
            - 400
```

## Finding Routes
1. Search for route files in `src/plugins/{plugin}/server/routes/`
2. Look for `router.get()`, `router.post()`, `router.put()`, `router.delete()`, `router.patch()` calls
3. Extract path, validation schema, and handler logic

## Schema Mapping (@osd/config-schema to OpenAPI)
- `schema.string()` → `type: string`
- `schema.number()` → `type: number` (add `minimum`, `maximum` if present)
- `schema.boolean()` → `type: boolean`
- `schema.object({ ... })` → `type: object` with properties
- `schema.arrayOf(...)` → `type: array` with items
- `schema.oneOf([...])` → `oneOf` discriminator
- `schema.maybe(...)` → not required, or nullable
- `schema.uri()` → `type: string, format: uri`
- `schema.literal('value')` → `type: string, enum: ['value']`

## Parameter Locations
- Path params (`:id`, `:type`) → `in: path, required: true`
- Query params → `in: query`
- Body params → `requestBody` with `content: application/json`

## Response Status Codes
- 200: Success
- 201: Created (for POST operations)
- 204: No Content (for DELETE)
- 400: Bad Request (validation errors)
- 401: Unauthorized (auth required)
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Special Cases
### File Upload Routes
```yaml
requestBody:
  content:
    multipart/form-data:
      schema:
        type: object
        properties:
          file:
            type: string
            format: binary
```

### Streaming Routes (SSE)
```yaml
responses:
  '200':
    description: Success
    content:
      text/event-stream:
        schema:
          type: string
```

### OpenSearch Proxy Routes
Document as pass-through with note about authentication forwarding.

## Output Location
Save your spec to: `/Users/huanji/wss/osd/docs/openapi/{plugin_name}/{plugin_name}.yml`

## Quality Checklist
- [ ] All routes discovered and documented
- [ ] Request/response schemas complete
- [ ] Parameter descriptions clear
- [ ] At least one example per endpoint
- [ ] Response status codes accurate
- [ ] File validates as OpenAPI 3.0

## Example Analysis Process
1. Read route file: `src/plugins/banner/server/routes/get_config.ts`
2. Extract route definition:
   - Method: GET
   - Path: `/api/banner/info`
   - Validation: none
   - Response: banner config object
3. Generate OpenAPI spec
4. Add descriptions and examples
5. Save to `/Users/huanji/wss/osd/docs/openapi/banner/banner.yml`
