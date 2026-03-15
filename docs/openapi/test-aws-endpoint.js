/**
 * Test OpenSearch Dashboards API endpoints from Browser DevTools
 *
 * HOW TO USE:
 * 1. Open your AWS OpenSearch Dashboards in browser
 * 2. Open DevTools (F12 or Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Paste this entire script
 * 5. Call test functions (see examples below)
 *
 * Your authentication cookies are automatically included!
 */

// Base configuration
const OSD_BASE = window.location.origin + window.location.pathname.split('/app')[0];
const WORKSPACE = window.location.pathname.match(/\/w\/([^\/]+)/)?.[1];

console.log('🚀 OpenSearch Dashboards API Tester');
console.log('📍 Base URL:', OSD_BASE);
console.log('🏢 Workspace:', WORKSPACE || 'None');

/**
 * Make authenticated API request
 */
async function osdRequest(method, path, body = null) {
  const url = `${OSD_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'osd-xsrf': 'osd-fetch',
      'osd-version': document.querySelector('meta[name="osd-version"]')?.content || '3.6.0'
    },
    credentials: 'include' // Include cookies
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`${method} ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();

  console.log(`✅ ${response.status} ${response.statusText}`);
  return { response, data };
}

// ============================================
// TEST FUNCTIONS - COPY & PASTE TO USE
// ============================================

/**
 * Test: Search API (your original request)
 */
async function testSearch() {
  return await osdRequest('POST', '/internal/search/opensearch', {
    params: {
      index: 'opensearch-ui-application.cloudwatch-logs*',
      body: {
        aggs: {
          api_types: {
            filters: {
              filters: {
                text2ppl: { prefix: { 'req.url': '/api/assistant/text2ppl' } },
                generate: { prefix: { 'req.url': '/api/enhancements/assist/generate' } }
              }
            },
            aggs: {
              time_buckets: {
                date_histogram: {
                  field: '@timestamp',
                  interval: '1d',
                  extended_bounds: {
                    min: 1772928119898,
                    max: 1773529319898
                  },
                  min_doc_count: 0
                }
              }
            }
          }
        },
        query: {
          bool: {
            must: [{
              range: {
                '@timestamp': {
                  gte: '2026-03-08T00:01:59.898Z',
                  lte: '2026-03-14T23:01:59.898Z',
                  format: 'strict_date_optional_time'
                }
              }
            }],
            filter: [
              { match_all: {} },
              {
                bool: {
                  must_not: [
                    { prefix: { 'req.headers.x-amzn-aosd-app-name': 'iamneoapp' } },
                    {
                      bool: {
                        minimum_should_match: 1,
                        should: [
                          { term: { 'res.statusCode': 200 } },
                          { term: { statusCode: 200 } }
                        ]
                      }
                    }
                  ]
                }
              }
            ],
            should: [],
            must_not: []
          }
        }
      },
      preference: Date.now()
    },
    dataSourceId: '84f424b0-7ed2-11f0-9e19-7f73d2fc8339'
  });
}

/**
 * Test: List workspaces
 */
async function testListWorkspaces() {
  return await osdRequest('POST', '/api/workspaces/_list', {
    page: 1,
    perPage: 10
  });
}

/**
 * Test: Get saved objects
 */
async function testFindSavedObjects() {
  return await osdRequest('GET', '/api/saved_objects/_find?type=dashboard&per_page=5');
}

/**
 * Test: Chat API (AI)
 */
async function testChatProxy(message) {
  return await osdRequest('POST', '/api/chat/proxy', {
    messages: [{ role: 'user', content: message }]
  });
}

/**
 * Test: Query assist - Generate query from natural language
 */
async function testQueryAssist(naturalLanguage) {
  return await osdRequest('POST', '/api/enhancements/assist/generate', {
    question: naturalLanguage,
    index: 'opensearch-ui-application.cloudwatch-logs*'
  });
}

/**
 * Test: Telemetry opt-in status
 */
async function testTelemetry() {
  return await osdRequest('POST', '/api/telemetry/v2/clusters/_opt_in_stats');
}

// ============================================
// USAGE EXAMPLES
// ============================================

console.log(`
📖 USAGE EXAMPLES:

// Test your original search request
await testSearch();

// List workspaces
await testListWorkspaces();

// Find dashboards
await testFindSavedObjects();

// AI chat
await testChatProxy("Show me API errors from the last 24 hours");

// Generate query from natural language
await testQueryAssist("Show me failed API requests grouped by endpoint");

// Get telemetry
await testTelemetry();

// Custom request
await osdRequest('GET', '/api/saved_objects/dashboard/my-dashboard-id');
await osdRequest('POST', '/api/workspaces', { name: 'Test Workspace' });
`);
