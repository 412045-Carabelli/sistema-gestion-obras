#!/usr/bin/env node

/**
 * Claude Code Skill Command Handler
 * Usage: /owasp-scan [FILES...]
 */

const OWASPScanner = require('./index.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class OWASPCommand {
  static async execute(args, context) {
    // Parse arguments
    const patterns = args.length > 0
      ? args
      : ['frontend/src/**/*.ts', 'frontend/src/**/*.html', 'backend1.0/**/*.java'];

    console.log(`\n🔒 OWASP Top 10 Security Scan\n`);
    console.log(`Patterns: ${patterns.join(', ')}`);
    console.log(`---\n`);

    const scanner = new OWASPScanner();

    // Get files matching patterns
    let files = [];
    patterns.forEach(pattern => {
      try {
        const result = execSync(`find . -path "./.git" -prune -o -type f -name "${pattern}" -print 2>/dev/null || true`,
          { encoding: 'utf8' }).split('\n').filter(f => f && fs.existsSync(f));
        files = [...files, ...result];
      } catch (err) {
        // Fallback: simple glob
        const baseDir = pattern.split('/')[0];
        const ext = pattern.split('.').pop();
        if (fs.existsSync(baseDir)) {
          const found = this.globFiles(baseDir, ext);
          files = [...files, ...found];
        }
      }
    });

    files = [...new Set(files)]; // Deduplicate

    if (files.length === 0) {
      console.log('No files found matching patterns.');
      return { status: 'success', vulnerabilities: 0 };
    }

    console.log(`Scanning ${files.length} files...\n`);

    files.forEach(file => {
      try {
        scanner.scan(file);
      } catch (err) {
        console.error(`⚠️  Error scanning ${file}: ${err.message}`);
      }
    });

    const passed = scanner.report();
    const exitCode = scanner.getExitCode();

    return {
      status: passed ? 'success' : 'vulnerabilities_found',
      vulnerabilities: scanner.vulnerabilities.length,
      critical: scanner.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: scanner.vulnerabilities.filter(v => v.severity === 'HIGH').length,
      exitCode: exitCode
    };
  }

  static globFiles(dir, ext) {
    let files = [];
    if (!fs.existsSync(dir)) return files;

    const walk = (currentPath) => {
      fs.readdirSync(currentPath).forEach(file => {
        const filePath = path.join(currentPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
          walk(filePath);
        } else if (stat.isFile() && filePath.endsWith(`.${ext}`)) {
          files.push(filePath);
        }
      });
    };

    walk(dir);
    return files;
  }
}

// CLI Entry
if (require.main === module) {
  const args = process.argv.slice(2);
  OWASPCommand.execute(args, {}).then(result => {
    process.exit(result.exitCode || 0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = OWASPCommand;
