#!/usr/bin/env node
/**
 * OWASP Backend Scanner
 * Scans Java files for vulnerabilities
 */

const OWASPCommand = require('./command.js');

OWASPCommand.execute(['backend1.0/**/*.java'], {})
  .then(result => process.exit(result.exitCode || 0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
