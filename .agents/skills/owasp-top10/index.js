#!/usr/bin/env node

/**
 * OWASP Top 10 Vulnerability Scanner Skill
 * Detects and fixes security issues in Angular + Java code
 * Runs as pre-commit hook
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AngularScanner = require('./scanners/angular-scanner');
const JavaScanner = require('./scanners/java-scanner');
const InjectionRules = require('./rules/injection');
const XSSRules = require('./rules/xss');
const AuthRules = require('./rules/auth-failures');
const CRSFRules = require('./rules/csrf');
const DataExposureRules = require('./rules/data-exposure');

class OWASPScanner {
  constructor() {
    this.vulnerabilities = [];
    this.scanners = {
      angular: new AngularScanner(),
      java: new JavaScanner()
    };
    this.rules = {
      injection: new InjectionRules(),
      xss: new XSSRules(),
      auth: new AuthRules(),
      csrf: new CRSFRules(),
      dataExposure: new DataExposureRules()
    };
  }

  scan(filePath) {
    const ext = path.extname(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    if (['.ts', '.html'].includes(ext)) {
      this.scanAngular(filePath, content);
    }
    if (['.java'].includes(ext)) {
      this.scanJava(filePath, content);
    }
  }

  scanAngular(filePath, content) {
    // XSS vulnerabilities
    this.rules.xss.check(filePath, content).forEach(v => this.vulnerabilities.push(v));

    // CSRF in forms
    this.rules.csrf.check(filePath, content).forEach(v => this.vulnerabilities.push(v));

    // Auth token exposure
    this.rules.auth.check(filePath, content).forEach(v => this.vulnerabilities.push(v));
  }

  scanJava(filePath, content) {
    // SQL Injection
    this.rules.injection.check(filePath, content).forEach(v => this.vulnerabilities.push(v));

    // Auth/Access Control
    this.rules.auth.check(filePath, content).forEach(v => this.vulnerabilities.push(v));

    // Sensitive data exposure
    this.rules.dataExposure.check(filePath, content).forEach(v => this.vulnerabilities.push(v));
  }

  report() {
    if (this.vulnerabilities.length === 0) {
      console.log('✓ No vulnerabilities detected (OWASP Top 10)');
      return true;
    }

    console.log(`\n⚠️  Found ${this.vulnerabilities.length} potential vulnerabilities:\n`);

    const byFile = {};
    this.vulnerabilities.forEach(v => {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    });

    Object.entries(byFile).forEach(([file, vulns]) => {
      console.log(`📄 ${file}`);
      vulns.forEach(v => {
        console.log(`  [${v.severity}] ${v.owasp} - ${v.message}`);
        console.log(`    Line: ${v.line}`);
        if (v.suggestion) console.log(`    Fix: ${v.suggestion}`);
      });
      console.log();
    });

    return false;
  }

  getExitCode() {
    // CRITICAL = fail (exit 1), HIGH = warn but pass (exit 0)
    const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL');
    return critical.length > 0 ? 1 : 0;
  }
}

// CLI Entry
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: owasp-scan [FILES...]');
    console.log('Example: owasp-scan src/**/*.ts backend1.0/**/*.java');
    process.exit(1);
  }

  const scanner = new OWASPScanner();

  args.forEach(pattern => {
    const files = execSync(`git diff --cached --name-only --diff-filter=d ${pattern} 2>/dev/null || true`, { encoding: 'utf8' })
      .split('\n')
      .filter(f => f && fs.existsSync(f));

    files.forEach(file => {
      try {
        scanner.scan(file);
      } catch (err) {
        console.error(`Error scanning ${file}: ${err.message}`);
      }
    });
  });

  const passed = scanner.report();
  process.exit(scanner.getExitCode());
}

if (require.main === module) {
  main();
}

module.exports = OWASPScanner;
