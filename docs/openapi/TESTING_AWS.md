# Testing AWS OpenSearch Dashboards APIs

Guide for testing the OpenSearch Dashboards REST APIs against your AWS-hosted instance.

## Your AWS Instance

**URL:** `https://application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com`
**Workspace:** `/w/yCdEiL`
**Version:** OSD 3.6.0

---

## 🚨 The Challenge

Testing from Swagger UI (localhost:3000) to AWS has these issues:

1. **CORS Blocked** - AWS doesn't allow cross-origin requests from localhost
2. **Authentication** - Cookie-based sessions don't work cross-origin
3. **Workspace Prefix** - Paths need `/w/yCdEiL` prefix

---

## ✅ Solution 1: Browser DevTools (Easiest)

**Best for:** Quick testing, no setup required

### Steps:

1. **Open AWS OpenSearch Dashboards in your browser**
   ```
   https://application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com/w/yCdEiL/app/dashboards
   ```

2. **Open DevTools**
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `F12` or `Ctrl + Shift + I`

3. **Go to Console tab**

4. **Load the test script**
   ```bash
   # On your local machine
   cat docs/openapi/test-aws-endpoint.js
   ```
   Copy the entire script and paste into browser console

5. **Run tests**
   ```javascript
   // Your original search query
   await testSearch();

   // List workspaces
   await testListWorkspaces();

   // Find dashboards
   await testFindSavedObjects();

   // AI query generation
   await testQueryAssist("Show me failed API requests from the last hour");

   // Custom request
   await osdRequest('POST', '/internal/search/opensearch', {
     params: { index: 'my-index', body: { query: { match_all: {} } } }
   });
   ```

### ✅ Advantages:
- ✅ No CORS issues (same-origin)
- ✅ Authentication automatic (uses your session cookies)
- ✅ Workspace prefix handled automatically
- ✅ No additional setup

---

## ✅ Solution 2: Local CORS Proxy (Best for Swagger UI)

**Best for:** Using Swagger UI with your AWS instance

### Steps:

1. **Get your session cookies**
   - Open AWS OSD in browser
   - DevTools → Application/Storage → Cookies
   - Copy these cookies:
     - `aws-token-a-c`
     - `awsd2c-token-c`
     - `session-id`
     - `sidt`

2. **Update proxy script**
   ```bash
   vim scripts/proxy_to_aws.js
   ```
   Replace `YOUR_AWS_TOKEN_HERE`, `YOUR_AWSD2C_TOKEN_HERE`, etc. with actual cookie values

3. **Start proxy**
   ```bash
   node scripts/proxy_to_aws.js
   ```
   This starts a proxy on `http://localhost:5602`

4. **Update OpenAPI spec**
   ```bash
   vim docs/openapi/openapi-bundled.yml
   ```
   Add to `servers:` section:
   ```yaml
   servers:
     - url: http://localhost:5602
       description: AWS OpenSearch (via proxy)
     - url: http://localhost:5601
       description: Local development
   ```

5. **Restart docs server**
   ```bash
   pkill -f serve_api_docs
   node scripts/serve_api_docs.js
   ```

6. **Use Swagger UI**
   - Open http://localhost:3000
   - Select "AWS OpenSearch (via proxy)" from server dropdown
   - Click "Try it out" on any endpoint
   - Execute requests!

### ⚠️ Security Note:
- **DO NOT commit** `proxy_to_aws.js` with real cookies
- Cookies expire - update them when sessions expire
- Use `.gitignore` to exclude this file

---

## ✅ Solution 3: Postman/Insomnia (Best for API Development)

**Best for:** Building/testing API integrations

### Postman Setup:

1. **Import OpenAPI spec**
   - Open Postman
   - Import → File → Select `docs/openapi/openapi-bundled.yml`

2. **Configure environment**
   - Create new environment
   - Add variables:
     ```
     base_url: https://application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com/w/yCdEiL
     data_source_id: 84f424b0-7ed2-11f0-9e19-7f73d2fc8339
     ```

3. **Set up authentication**
   - Go to collection → Authorization
   - Type: Cookie
   - Add cookies from browser (same as Solution 2)

4. **Add headers**
   ```
   osd-xsrf: osd-fetch
   osd-version: 3.6.0
   Content-Type: application/json
   ```

5. **Test endpoints**
   - Select any request
   - Click Send
   - View response

---

## 📊 Example Requests

### Your Original Search Query

**Endpoint:** `POST /internal/search/opensearch`

**Request Body:**
```json
{
  "params": {
    "index": "opensearch-ui-application.cloudwatch-logs*",
    "body": {
      "aggs": {
        "api_types": {
          "filters": {
            "filters": {
              "text2ppl": {
                "prefix": { "req.url": "/api/assistant/text2ppl" }
              },
              "generate": {
                "prefix": { "req.url": "/api/enhancements/assist/generate" }
              }
            }
          },
          "aggs": {
            "time_buckets": {
              "date_histogram": {
                "field": "@timestamp",
                "interval": "1d",
                "extended_bounds": {
                  "min": 1772928119898,
                  "max": 1773529319898
                },
                "min_doc_count": 0
              }
            }
          }
        }
      },
      "query": {
        "bool": {
          "must": [
            {
              "range": {
                "@timestamp": {
                  "gte": "2026-03-08T00:01:59.898Z",
                  "lte": "2026-03-14T23:01:59.898Z",
                  "format": "strict_date_optional_time"
                }
              }
            }
          ],
          "filter": [
            { "match_all": {} }
          ]
        }
      }
    },
    "preference": 1773529280144
  },
  "dataSourceId": "84f424b0-7ed2-11f0-9e19-7f73d2fc8339"
}
```

### Other Useful Endpoints

**List Workspaces:**
```bash
POST /api/workspaces/_list
{
  "page": 1,
  "perPage": 10
}
```

**AI Query Generation:**
```bash
POST /api/enhancements/assist/generate
{
  "question": "Show me API errors from the last 24 hours",
  "index": "opensearch-ui-application.cloudwatch-logs*"
}
```

**Find Dashboards:**
```bash
GET /api/saved_objects/_find?type=dashboard&per_page=10
```

---

## 🔧 Troubleshooting

### CORS Errors
**Problem:** "Access to fetch blocked by CORS policy"
**Solution:** Use Solution 1 (Browser DevTools) or Solution 2 (Proxy)

### Authentication Errors (401/403)
**Problem:** "Unauthorized" or "Forbidden"
**Solution:**
- Check cookies are still valid (they expire!)
- Copy fresh cookies from authenticated browser session
- Verify workspace access permissions

### Workspace Not Found (404)
**Problem:** "Not found" errors
**Solution:**
- Verify workspace ID: `/w/yCdEiL`
- Check path includes workspace prefix
- Confirm you have access to this workspace

### Data Source Not Found
**Problem:** "Data source not found"
**Solution:**
- Verify dataSourceId: `84f424b0-7ed2-11f0-9e19-7f73d2fc8339`
- Check data source is still active
- Confirm permissions for data source access

---

## 📚 Next Steps

1. **Choose a solution** - Start with Solution 1 (easiest)
2. **Test the endpoint** - Run your original search query
3. **Explore other APIs** - Try workspace, chat, query assist endpoints
4. **Build integrations** - Use Postman collections for CI/CD

**Files:**
- Test script: `docs/openapi/test-aws-endpoint.js`
- Proxy server: `scripts/proxy_to_aws.js`
- OpenAPI spec: `docs/openapi/openapi-bundled.yml`

**Support:**
- OpenAPI docs: http://localhost:3000 (when running locally)
- API reference: `docs/openapi/README.md`
