#!/usr/bin/env node

/**
 * Merge individual plugin OpenAPI specs into master openapi.yml
 *
 * Usage:
 *   node scripts/merge_openapi_specs.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const OPENAPI_DIR = path.join(__dirname, '../docs/openapi');
const MASTER_SPEC = path.join(OPENAPI_DIR, 'openapi.yml');

// Plugin directories to scan
const PLUGINS = [
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

console.log('🔄 Merging OpenAPI specifications...\n');

// Read master spec
let masterSpec;
try {
  const masterContent = fs.readFileSync(MASTER_SPEC, 'utf8');
  masterSpec = yaml.load(masterContent);
} catch (err) {
  console.error('❌ Failed to read master spec:', err.message);
  process.exit(1);
}

let mergedPaths = 0;
let skippedPlugins = [];

// Process each plugin
for (const plugin of PLUGINS) {
  const pluginSpecPath = path.join(OPENAPI_DIR, plugin, `${plugin}.yml`);

  if (!fs.existsSync(pluginSpecPath)) {
    skippedPlugins.push(plugin);
    continue;
  }

  try {
    const pluginContent = fs.readFileSync(pluginSpecPath, 'utf8');
    const pluginSpec = yaml.load(pluginContent);

    // Add path references to master spec
    if (pluginSpec.paths) {
      for (const [pathKey, pathValue] of Object.entries(pluginSpec.paths)) {
        const refPath = `./${plugin}/${plugin}.yml#/paths/${pathKey.replace(/\//g, '~1')}`;
        masterSpec.paths[pathKey] = { $ref: refPath };
        mergedPaths++;
      }
    }

    console.log(`✅ ${plugin}: ${Object.keys(pluginSpec.paths || {}).length} paths`);
  } catch (err) {
    console.error(`⚠️  ${plugin}: ${err.message}`);
  }
}

// Write updated master spec
try {
  const masterYaml = yaml.dump(masterSpec, {
    indent: 2,
    lineWidth: -1,
    noRefs: true
  });
  fs.writeFileSync(MASTER_SPEC, masterYaml, 'utf8');
  console.log(`\n✅ Master spec updated: ${mergedPaths} total paths`);

  if (skippedPlugins.length > 0) {
    console.log(`\n⚠️  Skipped (specs not found): ${skippedPlugins.join(', ')}`);
  }
} catch (err) {
  console.error('❌ Failed to write master spec:', err.message);
  process.exit(1);
}

console.log('\n🎉 Done!\n');
console.log('Run: node scripts/serve_api_docs.js');
console.log('Then open: http://localhost:3000\n');
