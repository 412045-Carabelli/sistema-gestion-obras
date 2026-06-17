#!/usr/bin/env node
/**
 * OWASP Frontend Scanner
 * Scans Angular (TS/HTML) files for vulnerabilities
 */

const OWASPCommand = require('./command.js');

OWASPCommand.execute(['frontend/src/**/*.ts', 'frontend/src/**/*.html'], {})
  .then(result => process.exit(result.exitCode || 0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
