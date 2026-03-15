# 🚀 Start Testing AWS OpenSearch in Swagger UI

Quick start guide to test your AWS OpenSearch Dashboards APIs in Swagger UI.

---

## ⚡ Quick Start (3 Steps)

### Step 1: Get Your Cookies (2 minutes)

1. **Open AWS OpenSearch in browser:**
   ```
   https://application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com/w/yCdEiL/app/dashboards
   ```

2. **Open DevTools:** Press `F12` (or `Cmd+Option+I` on Mac)

3. **Go to Console tab**

4. **Run this script:**
   ```javascript
   const cookies = document.cookie.split(';').map(c => c.trim());
   const needed = ['aws-token-a-c', 'awsd2c-token-c', 'session-id', 'sidt'];
   const cookieStr = cookies.filter(c => needed.some(n => c.startsWith(n))).join('; ');
   console.log('📋 Copy this:\n' + cookieStr);
   ```

5. **Copy the output** (the cookie string)

---

### Step 2: Configure Proxy (1 minute)

**Option A: Using the setup script** (recommended)
```bash
cd /Users/huanji/wss/osd
./scripts/setup_aws_proxy.sh
# Paste your cookies when prompted
```

**Option B: Manual configuration**
```bash
# Edit the proxy file
vim scripts/proxy_to_aws.js

# Find this line (around line 22):
const AWS_COOKIES = [
  'aws-token-a-c=YOUR_AWS_TOKEN_HERE',
  ...
].join('; ');

# Replace with your actual cookies:
const AWS_COOKIES = 'aws-token-a-c=eyJraWQ...; awsd2c-token-c=eyJra...; session-id=...; sidt=...';

# Save and exit
```

---

### Step 3: Start Proxy & Test (1 minute)

**Terminal 1: Start the proxy**
```bash
cd /Users/huanji/wss/osd
node scripts/proxy_to_aws.js
```

You should see:
```
╔══════════════════════════════════════════════════════════╗
║  AWS OpenSearch Dashboards CORS Proxy                   ║
╚══════════════════════════════════════════════════════════╝

  🚀 Proxy running at: http://localhost:5602
  🎯 Target: https://application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com/w/yCdEiL
```

**Terminal 2: Docs server (already running)**
```bash
# Already running at http://localhost:3000
# If not, run:
node scripts/serve_api_docs.js
```

**Browser: Open Swagger UI**
```
http://localhost:3000
```

---

## 🎯 Using Swagger UI

### 1. Select the Proxy Server

At the top of Swagger UI:
- Click the **Servers** dropdown
- Select: **`http://localhost:5602` - AWS OpenSearch via CORS Proxy**

### 2. Test Your Original Endpoint

1. **Find the endpoint:** Scroll to **`POST /internal/search/opensearch`**
2. **Click "Try it out"**
3. **Fill in the request body:**
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
4. **Click "Execute"**
5. **View response** below

### 3. Test Other Endpoints

Try these useful endpoints:

**List Workspaces:**
- `POST /api/workspaces/_list`
- Body: `{ "page": 1, "perPage": 10 }`

**Find Dashboards:**
- `GET /api/saved_objects/_find`
- Query params: `type=dashboard`, `per_page=10`

**AI Query Generation:**
- `POST /api/enhancements/assist/generate`
- Body: `{ "question": "Show me API errors", "index": "opensearch-ui-application.cloudwatch-logs*" }`

**Chat with AI:**
- `POST /api/chat/proxy`
- Body: `{ "messages": [{"role": "user", "content": "Analyze my API logs"}] }`

---

## 🔧 Troubleshooting

### Proxy Shows "Proxy error"
**Problem:** Cookies expired or invalid
**Fix:**
1. Get fresh cookies from browser (Step 1)
2. Update `scripts/proxy_to_aws.js`
3. Restart proxy: `Ctrl+C` then `node scripts/proxy_to_aws.js`

### Swagger UI Shows CORS Error
**Problem:** Wrong server selected
**Fix:**
- Make sure you selected `http://localhost:5602` (proxy)
- NOT the direct AWS URL

### 401 Unauthorized
**Problem:** Authentication failed
**Fix:**
- Verify cookies are current (check browser still logged in)
- Cookies expire after ~1-2 hours, refresh them

### 404 Not Found
**Problem:** Endpoint path incorrect
**Fix:**
- Proxy automatically adds `/w/yCdEiL` prefix
- Just use the endpoint path from Swagger UI (e.g., `/api/workspaces`)

---

## 📊 Monitoring

Watch the proxy terminal to see requests:
```
POST /internal/search/opensearch
← 200 OK
```

---

## 🛑 Stopping

**Stop proxy:** `Ctrl+C` in proxy terminal
**Stop docs:** `pkill -f serve_api_docs`

---

## 📚 Next Steps

- **Explore all 90 endpoints** in Swagger UI
- **Export as cURL** using "Copy cURL" button
- **Generate API clients** using openapi-generator
- **Write integration tests** using the specs

---

## 🔒 Security Notes

- ⚠️ **Cookies contain session tokens** - treat them like passwords
- ⚠️ **Don't commit** `proxy_to_aws.js` with real cookies
- ⚠️ **Cookies expire** - refresh them every 1-2 hours
- ⚠️ **Use for testing only** - not for production

---

## ✅ Quick Reference

```bash
# Get cookies (in browser console)
const cookies = document.cookie.split(';').filter(c =>
  ['aws-token', 'awsd2c', 'session-id', 'sidt'].some(n => c.includes(n))
).join('; '); console.log(cookies);

# Start proxy
node scripts/proxy_to_aws.js

# Open Swagger UI
open http://localhost:3000

# Select server: http://localhost:5602
```

---

**Ready to test!** 🚀

Open http://localhost:3000 and select the proxy server!
