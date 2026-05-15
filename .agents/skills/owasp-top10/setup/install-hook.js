#!/usr/bin/env node

/**
 * Setup OWASP scanner as pre-commit hook
 * Run: node .agents/skills/owasp-top10/setup/install-hook.js
 */

const fs = require('fs');
const path = require('path');

const hookDir = '.git/hooks';
const preCommitHook = path.join(hookDir, 'pre-commit');
const hookContent = `#!/bin/bash
# OWASP Top 10 Security Scanner
set -e

echo "🔒 Running OWASP Top 10 security scan..."

node .agents/skills/owasp-top10/index.js \\
  'frontend/src/**/*.ts' \\
  'frontend/src/**/*.html' \\
  'backend1.0/**/*.java'

exit_code=$?

if [ $exit_code -eq 1 ]; then
  echo "❌ CRITICAL vulnerabilities found. Commit blocked."
  exit 1
fi

echo "✓ Security scan passed"
exit 0
`;

try {
  if (!fs.existsSync(hookDir)) {
    console.error('❌ .git/hooks directory not found. Are you in a git repository?');
    process.exit(1);
  }

  fs.writeFileSync(preCommitHook, hookContent);
  fs.chmodSync(preCommitHook, '755');

  console.log('✓ Pre-commit hook installed');
  console.log(`  Location: ${preCommitHook}`);
  console.log('  Next commit will run OWASP security scan');
  console.log('  To skip: git commit --no-verify');
} catch (err) {
  console.error('❌ Failed to install hook:', err.message);
  process.exit(1);
}
