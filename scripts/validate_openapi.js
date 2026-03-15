#!/usr/bin/env node

/**
 * Validate all OpenAPI specifications
 *
 * Usage:
 *   node scripts/validate_openapi.js
 *   node scripts/validate_openapi.js --plugin banner
 */

const fs = require('fs');
const path = require('path');

// Simple YAML parser without external dependencies
function parseYaml(content) {
  try {
    // Very basic YAML parsing - just check for syntax errors
    // For full validation, use a proper validator
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

function validateSpec(specPath) {
  // Check file exists
  if (!fs.existsSync(specPath)) {
    return { valid: false, error: 'File not found' };
  }

  // Read file
  let content;
  try {
    content = fs.readFileSync(specPath, 'utf8');
  } catch (err) {
    return { valid: false, error: `Cannot read file: ${err.message}` };
  }

  // Basic checks
  const errors = [];

  // Check for required OpenAPI fields
  if (!content.includes('openapi:')) {
    errors.push('Missing "openapi:" field');
  }
  if (!content.includes('info:')) {
    errors.push('Missing "info:" field');
  }
  if (!content.includes('paths:')) {
    errors.push('Missing "paths:" field');
  }

  // Check OpenAPI version
  if (!content.includes('openapi: 3.0')) {
    errors.push('Must use OpenAPI 3.0.x');
  }

  // Check for API paths
  const apiPathRegex = /^\s+\/api\//gm;
  const hasPaths = apiPathRegex.test(content);
  if (!hasPaths) {
    errors.push('No API paths found (must start with /api/)');
  }

  // Check YAML syntax (basic)
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for tabs (YAML doesn't allow tabs)
    if (line.includes('\t')) {
      errors.push(`Line ${i + 1}: Contains tab character (use spaces)`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

// Main
const args = process.argv.slice(2);
const OPENAPI_DIR = path.join(__dirname, '../docs/openapi');

console.log('🔍 Validating OpenAPI specifications...\n');

let specs = [];

if (args.includes('--plugin')) {
  const pluginIndex = args.indexOf('--plugin');
  const plugin = args[pluginIndex + 1];
  if (!plugin) {
    console.error('❌ Error: --plugin requires a plugin name');
    process.exit(1);
  }
  specs = [path.join(OPENAPI_DIR, plugin, `${plugin}.yml`)];
} else {
  // Validate all specs
  const entries = fs.readdirSync(OPENAPI_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'examples') {
      const specPath = path.join(OPENAPI_DIR, entry.name, `${entry.name}.yml`);
      if (fs.existsSync(specPath)) {
        specs.push(specPath);
      }
    }
  }

  // Add master spec
  const masterSpec = path.join(OPENAPI_DIR, 'openapi.yml');
  if (fs.existsSync(masterSpec)) {
    specs.unshift(masterSpec);
  }
}

let validCount = 0;
let invalidCount = 0;

for (const specPath of specs) {
  const pluginName = path.basename(path.dirname(specPath));
  const fileName = path.basename(specPath);
  const displayName = fileName === 'openapi.yml' ? 'Master Spec' : pluginName;

  const result = validateSpec(specPath);

  if (result.valid) {
    console.log(`✅ ${displayName}`);
    validCount++;
  } else {
    console.log(`❌ ${displayName}`);
    if (result.error) {
      console.log(`   ${result.error}`);
    }
    if (result.errors) {
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
    invalidCount++;
  }
}

console.log('');
console.log(`📊 Results: ${validCount} valid, ${invalidCount} invalid`);

if (invalidCount > 0) {
  console.log('\n⚠️  Some specs have errors. Please fix them.');
  console.log('For detailed validation, use:');
  console.log('  npx @apidevtools/swagger-cli validate docs/openapi/openapi.yml');
  process.exit(1);
}

console.log('\n🎉 All specs are valid!\n');
