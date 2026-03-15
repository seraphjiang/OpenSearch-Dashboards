#!/usr/bin/env node

/**
 * Bundle all OpenAPI specs into a single file (no external $refs)
 * This makes the spec work in Swagger UI without file resolution issues
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const OPENAPI_DIR = path.join(__dirname, '../docs/openapi');
const OUTPUT_FILE = path.join(OPENAPI_DIR, 'openapi-bundled.yml');

// Plugin directories to bundle
const PLUGINS = [
  'saved_objects',
  'index_patterns',
  'banner',
  'application_config',
  'data_explorer',
  'workspace',
  'vis_augmenter',
  'region_map',
  'home',
  'data_importer',
  'usage_collection',
  'data_source',
  'index_pattern_management',
  'legacy_export',
  'vis_type_timeseries',
  'vis_type_timeline',
  'console',
  'share',
  'chat',
  'telemetry',
  'data_source_management',
  'saved_objects_management',
  'query_enhancements',
  'data',
  'bfetch'
];

console.log('📦 Bundling OpenAPI specifications...\n');

// Read master spec as template
const masterPath = path.join(OPENAPI_DIR, 'openapi.yml');
let bundledSpec;
try {
  const masterContent = fs.readFileSync(masterPath, 'utf8');
  bundledSpec = yaml.load(masterContent);
} catch (err) {
  console.error('❌ Failed to read master spec:', err.message);
  process.exit(1);
}

// Reset paths to empty (we'll populate them)
bundledSpec.paths = {};

// Initialize components if not present
if (!bundledSpec.components) {
  bundledSpec.components = {};
}
if (!bundledSpec.components.schemas) {
  bundledSpec.components.schemas = {};
}
if (!bundledSpec.components.parameters) {
  bundledSpec.components.parameters = {};
}

let totalPaths = 0;
let skippedPlugins = [];

// Helper function to update $ref paths with plugin prefix
function updateRefs(obj, plugin) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => updateRefs(item, plugin));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      // Update $ref to use plugin-prefixed components
      if (value.startsWith('#/components/schemas/')) {
        const schemaName = value.replace('#/components/schemas/', '');
        result[key] = `#/components/schemas/${plugin}_${schemaName}`;
      } else if (value.startsWith('#/components/parameters/')) {
        const paramName = value.replace('#/components/parameters/', '');
        result[key] = `#/components/parameters/${plugin}_${paramName}`;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = updateRefs(value, plugin);
    }
  }
  return result;
}

// Process each plugin and inline paths with their components
for (const plugin of PLUGINS) {
  const pluginSpecPath = path.join(OPENAPI_DIR, plugin, `${plugin}.yml`);

  if (!fs.existsSync(pluginSpecPath)) {
    skippedPlugins.push(plugin);
    continue;
  }

  try {
    const pluginContent = fs.readFileSync(pluginSpecPath, 'utf8');
    const pluginSpec = yaml.load(pluginContent);

    // Copy component schemas with plugin prefix
    if (pluginSpec.components && pluginSpec.components.schemas) {
      for (const [schemaKey, schemaValue] of Object.entries(pluginSpec.components.schemas)) {
        const prefixedKey = `${plugin}_${schemaKey}`;
        bundledSpec.components.schemas[prefixedKey] = updateRefs(schemaValue, plugin);
      }
    }

    // Copy component parameters with plugin prefix
    if (pluginSpec.components && pluginSpec.components.parameters) {
      for (const [paramKey, paramValue] of Object.entries(pluginSpec.components.parameters)) {
        const prefixedKey = `${plugin}_${paramKey}`;
        bundledSpec.components.parameters[prefixedKey] = updateRefs(paramValue, plugin);
      }
    }

    // Copy paths with updated $refs
    if (pluginSpec.paths) {
      for (const [pathKey, pathValue] of Object.entries(pluginSpec.paths)) {
        bundledSpec.paths[pathKey] = updateRefs(pathValue, plugin);
        totalPaths++;
      }
    }

    console.log(`✅ ${plugin}: ${Object.keys(pluginSpec.paths || {}).length} paths`);
  } catch (err) {
    console.error(`⚠️  ${plugin}: ${err.message}`);
  }
}

// Update description
bundledSpec.info.description = `Complete REST API documentation for OpenSearch Dashboards (bundled).

This specification includes all plugin APIs inlined into a single file for easy consumption.

**Generated**: ${new Date().toISOString().split('T')[0]}
**Total Endpoints**: ${totalPaths}
**Plugins**: ${PLUGINS.length - skippedPlugins.length}

## Plugin APIs Included
- Saved Objects (Core)
- Index Patterns
- Workspace Management
- Data Sources & Multi-Data-Source
- Query Enhancements (AI-powered)
- Chat & AI Interactions
- Console & Dev Tools
- Visualizations (Timeseries, Timeline, Augmenter)
- Data Import/Export
- Telemetry & Usage Collection
- And 15+ more plugins
`;

// Write bundled spec
try {
  const bundledYaml = yaml.dump(bundledSpec, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
  fs.writeFileSync(OUTPUT_FILE, bundledYaml, 'utf8');
  console.log(`\n✅ Bundled spec created: ${totalPaths} total paths`);
  console.log(`📄 Output: ${OUTPUT_FILE}`);

  if (skippedPlugins.length > 0) {
    console.log(`\n⚠️  Skipped (specs not found): ${skippedPlugins.join(', ')}`);
  }
} catch (err) {
  console.error('❌ Failed to write bundled spec:', err.message);
  process.exit(1);
}

console.log('\n🎉 Done!\n');
console.log('Restart docs server: pkill -f serve_api_docs && node scripts/serve_api_docs.js\n');
