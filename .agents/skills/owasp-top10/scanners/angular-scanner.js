/**
 * Angular/TypeScript Security Scanner
 * Detects XSS, CSRF, insecure auth patterns
 */

class AngularScanner {
  constructor() {
    this.xssPatterns = [
      // innerHTML without sanitization
      { regex: /\[innerHTML\]\s*=\s*["\'](?!.*sanitizer)/gi, issue: 'XSS: innerHTML without DomSanitizer' },
      // Unsafe method calls
      { regex: /\.innerHTML\s*=/gi, issue: 'XSS: Direct innerHTML assignment' },
      // bypassSecurityTrustHtml without validation
      { regex: /bypassSecurityTrust/gi, issue: 'XSS: bypassSecurityTrust used - ensure input is validated' },
    ];

    this.csrfPatterns = [
      // Forms without CSRF tokens
      { regex: /<form[^>]*method="POST"[^>]*>(?!.*_csrf|.*csrf-token)/gi, issue: 'CSRF: POST form missing CSRF token' },
    ];

    this.authPatterns = [
      // Token stored in localStorage (consider sessionStorage)
      { regex: /localStorage\.(setItem|getItem).*auth|token/gi, issue: 'Data Exposure: Auth token in localStorage (use sessionStorage)' },
      // Password in code
      { regex: /password\s*[=:]\s*["\'].*["\']|pwd\s*[=:]\s*["\']/gi, issue: 'CRITICAL: Hardcoded password in code' },
    ];
  }

  check(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    // XSS checks
    this.xssPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'HIGH',
          owasp: 'A03: Injection (XSS)',
          message: pattern.issue,
          suggestion: 'Use DomSanitizer.sanitize() or Angular property binding instead of [innerHTML]'
        });
      }
    });

    // CSRF checks
    this.csrfPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'HIGH',
          owasp: 'A01: Broken Access Control (CSRF)',
          message: pattern.issue,
          suggestion: 'Add CSRF token via HttpClientXsrfModule or app.config'
        });
      }
    });

    // Auth patterns
    this.authPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const severity = pattern.issue.includes('CRITICAL') ? 'CRITICAL' : 'HIGH';
        issues.push({
          file: filePath,
          line: lineNum,
          severity: severity,
          owasp: 'A02: Cryptographic Failures',
          message: pattern.issue,
          suggestion: 'Use environment variables or secure backend endpoints'
        });
      }
    });

    return issues;
  }
}

module.exports = AngularScanner;
