# 🚀 Quick Start: Test AWS OpenSearch in Swagger UI

**Goal:** Test your AWS OpenSearch Dashboards APIs in Swagger UI in under 5 minutes.

---

## Step 1: Get Cookies (2 minutes)

### Option A: Browser Console (Recommended) ⭐

1. **Open AWS OpenSearch:**
   ```
   https://application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com/w/yCdEiL/app/dashboards
   ```

2. **Open DevTools:** Press `F12` (or `Cmd+Option+I` on Mac)

3. **Go to Console tab**

4. **Paste this and press Enter:**
   ```javascript
   const cookies = document.cookie.split(';').map(c => c.trim());
   const needed = ['aws-token-a-c', 'awsd2c-token-c', 'session-id', 'sidt'];
   const cookieStr = cookies.filter(c => needed.some(n => c.startsWith(n))).join('; ');
   console.log('📋 COPY THIS:\n' + cookieStr);
   navigator.clipboard.writeText(cookieStr).then(() => console.log('✅ Copied to clipboard!'));
   ```

5. **Your cookies are now in clipboard!** (Or copy from console output)

### Option B: Bookmarklet (One-Click)

1. **Create bookmark** with this URL:
   ```javascript
   javascript:(function(){const c=document.cookie.split(';').map(c=>c.trim());const n=['aws-token-a-c','awsd2c-token-c','session-id','sidt'];const f=c.filter(c=>n.some(n=>c.startsWith(n))).join('; ');if(f){prompt('Copy cookies:',f)}else{alert('No cookies found!')}})();
   ```

2. **Click it** on AWS OpenSearch page → Copy the cookies

---

## Step 2: Configure Proxy (1 minute)

### Option A: Auto-Configure (Easiest)

```bash
cd /Users/huanji/wss/osd
./scripts/configure-proxy.sh "PASTE_YOUR_COOKIES_HERE"
```

This will automatically configure and start the proxy!

### Option B: Manual Edit

```bash
vim scripts/proxy_to_aws.js
```

Find line ~22 and replace:
```javascript
const AWS_COOKIES = 'PASTE_YOUR_COOKIES_HERE';
```

Save (`:wq`) and start:
```bash
node scripts/proxy_to_aws.js
```

---

## Step 3: Test in Swagger UI (1 minute)

1. **Open:** http://localhost:3000

2. **Select Server:**
   - Click dropdown at top
   - Choose: **`http://localhost:5602`** (AWS OpenSearch via CORS Proxy)

3. **Test Your Endpoint:**
   - Find: `POST /internal/search/opensearch`
   - Click "Try it out"
   - Click "Execute"
   - See results! 🎉

---

## 🎯 Quick Test Examples

Once proxy is running, try these:

### Your Original Search Query
**Endpoint:** `POST /internal/search/opensearch`

**Body:**
```json
{
  "params": {
    "index": "opensearch-ui-application.cloudwatch-logs*",
    "body": {
      "query": {
        "bool": {
          "must": [{
            "range": {
              "@timestamp": {
                "gte": "2026-03-08T00:01:59.898Z",
                "lte": "2026-03-14T23:01:59.898Z"
              }
            }
          }]
        }
      }
    }
  },
  "dataSourceId": "84f424b0-7ed2-11f0-9e19-7f73d2fc8339"
}
```

### List Workspaces
**Endpoint:** `POST /api/workspaces/_list`
**Body:** `{ "page": 1, "perPage": 10 }`

### Find Dashboards
**Endpoint:** `GET /api/saved_objects/_find?type=dashboard&per_page=10`

### AI Query Generation
**Endpoint:** `POST /api/enhancements/assist/generate`
**Body:**
```json
{
  "question": "Show me API errors from the last hour",
  "index": "opensearch-ui-application.cloudwatch-logs*"
}
```

---

## 🔧 Troubleshooting

### "No cookies found"
**Fix:** Make sure you're logged into AWS OpenSearch and on the correct page

### "401 Unauthorized"
**Fix:** Your cookies expired. Get fresh cookies (they expire every 1-2 hours)

### "CORS error"
**Fix:** Make sure you selected `http://localhost:5602` (proxy), not the direct AWS URL

### "Proxy not starting"
**Fix:** Make sure you updated the cookies in `scripts/proxy_to_aws.js`

---

## 📋 Quick Reference

```bash
# Files you need
START_AWS_TESTING.md              # Detailed guide
scripts/proxy_to_aws.js           # Proxy (needs cookies)
scripts/configure-proxy.sh        # Auto-configure helper

# Servers
http://localhost:3000             # Swagger UI
http://localhost:5602             # Proxy (your AWS instance)

# Get fresh cookies (in browser console)
const c=document.cookie.split(';').filter(c=>['aws-token','awsd2c','session-id','sidt'].some(n=>c.includes(n))).join('; ');console.log(c);

# Configure and start
./scripts/configure-proxy.sh "your-cookies"

# Or manually
node scripts/proxy_to_aws.js
```

---

## ⚠️ Security Notes

- 🔒 Cookies are like passwords - keep them private
- ⏰ Cookies expire every 1-2 hours - refresh as needed
- 📝 Don't commit `proxy_to_aws.js` with real cookies
- 🧪 For testing only - not production use

---

**That's it!** You should be testing in Swagger UI in under 5 minutes. 🚀

For more details, see `START_AWS_TESTING.md`
