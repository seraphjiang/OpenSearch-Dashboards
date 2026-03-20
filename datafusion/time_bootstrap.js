#!/usr/bin/env node

/**
 * Script to measure timing of each bootstrap phase
 * Usage: node scripts/time_bootstrap.js
 */

const { spawn } = require('child_process');
const path = require('path');

const timings = [];
let currentPhase = null;
let phaseStart = null;
let totalStart = Date.now();

const phases = [
  { pattern: /\[1\/5\] Validating package\.json/, name: '1. Validate package.json' },
  { pattern: /\[2\/5\] Resolving packages/, name: '2. Resolve packages' },
  { pattern: /\[3\/5\] Fetching packages/, name: '3. Fetch packages' },
  { pattern: /\[4\/5\] Linking dependencies/, name: '4. Link dependencies' },
  { pattern: /\[5\/5\] Building fresh packages/, name: '5. Build fresh packages' },
  { pattern: /Patching node_modules/, name: '6. Post-install patches' },
  { pattern: /yarn\.lock analysis completed/, name: '7. Lock file analysis' },
  { pattern: /\[@osd\/.*\] running \[osd:bootstrap\]/, name: '8. Build @osd packages', persist: true },
  { pattern: /\[opensearch-dashboards\] bootstrap complete/, name: '9. Final bootstrap' },
];

function recordPhase(name, duration) {
  timings.push({ name, duration });
  console.log(`\n⏱️  ${name}: ${(duration / 1000).toFixed(2)}s`);
}

function checkPhases(line) {
  for (const phase of phases) {
    if (phase.pattern.test(line)) {
      const now = Date.now();

      // Close previous phase if exists and not persistent
      if (currentPhase && !currentPhase.persist) {
        recordPhase(currentPhase.name, now - phaseStart);
      }

      // Start new phase if different
      if (!currentPhase || currentPhase.name !== phase.name) {
        currentPhase = phase;
        phaseStart = now;
      }
      break;
    }
  }
}

console.log('🚀 Starting bootstrap with timing instrumentation...\n');
console.log('=' .repeat(60));

const proc = spawn('yarn', ['osd', 'bootstrap'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

proc.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      process.stdout.write(line + '\n');
      checkPhases(line);
    }
  }
});

proc.stderr.on('data', (data) => {
  process.stderr.write(data);
});

proc.on('close', (code) => {
  const totalTime = Date.now() - totalStart;

  // Close last phase
  if (currentPhase) {
    recordPhase(currentPhase.name, Date.now() - phaseStart);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TIMING SUMMARY');
  console.log('='.repeat(60));

  let measuredTotal = 0;
  timings.forEach((t, i) => {
    const percentage = ((t.duration / totalTime) * 100).toFixed(1);
    console.log(`${String(i + 1).padStart(2)}. ${t.name.padEnd(35)} ${(t.duration / 1000).toFixed(2).padStart(8)}s  (${percentage.padStart(5)}%)`);
    measuredTotal += t.duration;
  });

  const unmeasured = totalTime - measuredTotal;
  console.log('─'.repeat(60));
  console.log(`    ${'Total measured time'.padEnd(35)} ${(measuredTotal / 1000).toFixed(2).padStart(8)}s`);
  console.log(`    ${'Unmeasured/Other'.padEnd(35)} ${(unmeasured / 1000).toFixed(2).padStart(8)}s`);
  console.log(`    ${'TOTAL TIME'.padEnd(35)} ${(totalTime / 1000).toFixed(2).padStart(8)}s`);
  console.log('='.repeat(60));

  // Identify bottlenecks
  console.log('\n🔍 BOTTLENECK ANALYSIS');
  console.log('='.repeat(60));

  const sorted = [...timings].sort((a, b) => b.duration - a.duration);
  console.log('\nTop 3 slowest phases:');
  sorted.slice(0, 3).forEach((t, i) => {
    const percentage = ((t.duration / totalTime) * 100).toFixed(1);
    console.log(`  ${i + 1}. ${t.name} - ${(t.duration / 1000).toFixed(2)}s (${percentage}%)`);
  });

  console.log('\n💡 OPTIMIZATION OPPORTUNITIES');
  console.log('='.repeat(60));

  const suggestions = [];

  sorted.forEach(t => {
    if (t.name.includes('Fetch packages') && t.duration > 10000) {
      suggestions.push('- Use yarn offline mirror or registry proxy for faster package fetching');
    }
    if (t.name.includes('Link dependencies') && t.duration > 15000) {
      suggestions.push('- Consider using yarn PnP mode or hard links to speed up linking');
    }
    if (t.name.includes('Build @osd packages') && t.duration > 30000) {
      suggestions.push('- Parallelize package builds (check if --concurrency flag helps)');
      suggestions.push('- Use incremental builds (babel/typescript cache)');
      suggestions.push('- Consider using esbuild or swc instead of babel');
    }
    if (t.name.includes('Resolve packages') && t.duration > 5000) {
      suggestions.push('- Lock file might be out of sync - ensure yarn.lock is up to date');
    }
  });

  if (suggestions.length === 0) {
    console.log('✅ No major bottlenecks detected. Bootstrap time is reasonable.');
  } else {
    // Deduplicate suggestions
    [...new Set(suggestions)].forEach(s => console.log(s));
  }

  console.log('\n');
  process.exit(code);
});
