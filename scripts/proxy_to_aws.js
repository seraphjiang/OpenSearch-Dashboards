#!/usr/bin/env node

/**
 * CORS Proxy Server for testing AWS OpenSearch Dashboards APIs
 *
 * This proxy forwards requests from Swagger UI to your AWS instance
 * with your authentication cookies, bypassing CORS restrictions.
 *
 * Usage:
 *   1. Update AWS_COOKIES with your session cookies
 *   2. Run: node scripts/proxy_to_aws.js
 *   3. In Swagger UI, select server: http://localhost:5602
 */

const http = require('http');
const https = require('https');
const url = require('url');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const AWS_HOST = 'application-metric-9wfds1dy935s8exh7yo0.eu-central-1.opensearch.amazonaws.com';
const WORKSPACE = '/w/yCdEiL'; // Set to '' if no workspace
const PROXY_PORT = 5602;

// UPDATE THESE WITH YOUR COOKIES FROM BROWSER
const AWS_COOKIES = [
  'aws-token-a-c=YOUR_AWS_TOKEN_HERE',
  'awsd2c-token-c=YOUR_AWSD2C_TOKEN_HERE',
  'session-id=YOUR_SESSION_ID_HERE',
  'sidt=YOUR_SIDT_HERE'
  // Add more cookies as needed
].join('; ');

// ============================================
// PROXY SERVER
// ============================================

const server = http.createServer((req, res) => {
  // Enable CORS for Swagger UI
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, osd-xsrf, osd-version');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Build target URL
  const targetPath = WORKSPACE + req.url;
  const targetUrl = `https://${AWS_HOST}${targetPath}`;

  console.log(`${req.method} ${targetPath}`);

  // Forward headers
  const headers = {
    ...req.headers,
    host: AWS_HOST,
    cookie: AWS_COOKIES,
    origin: `https://${AWS_HOST}`,
    referer: `https://${AWS_HOST}${WORKSPACE}/app/dashboards`,
    'osd-xsrf': 'osd-fetch'
  };

  // Remove localhost-specific headers
  delete headers['host'];
  delete headers['connection'];

  // Forward request to AWS
  const parsedUrl = url.parse(targetUrl);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: req.method,
    headers: headers
  };

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`← ${proxyRes.statusCode} ${proxyRes.statusMessage}`);

    // Forward response headers (except CORS)
    Object.keys(proxyRes.headers).forEach(key => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });

    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('❌ Proxy error:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  // Forward request body
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  AWS OpenSearch Dashboards CORS Proxy                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀 Proxy running at: http://localhost:${PROXY_PORT}`);
  console.log(`  🎯 Target: https://${AWS_HOST}${WORKSPACE}`);
  console.log('');
  console.log('  📝 To use with Swagger UI:');
  console.log(`     1. Add this server URL to openapi-bundled.yml:`);
  console.log(`        - url: http://localhost:${PROXY_PORT}`);
  console.log('     2. Rebuild bundle: node scripts/bundle_openapi.js');
  console.log('     3. Restart docs server');
  console.log('     4. Select "http://localhost:5602" in Swagger UI');
  console.log('');
  console.log('  ⚠️  Security: Cookies are stored in this script!');
  console.log('      Do NOT commit this file with real cookies.');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PROXY_PORT} is already in use.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
