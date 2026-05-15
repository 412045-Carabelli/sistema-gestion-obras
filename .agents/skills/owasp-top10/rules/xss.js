/**
 * A03: Injection (XSS - Cross-Site Scripting)
 */

class XSSRules {
  check(filePath, content) {
    const issues = [];

    // innerHTML without sanitization
    if (/\[innerHTML\]\s*=|\.innerHTML\s*=/i.test(content)) {
      if (!/sanitizer|DomSanitizer|bypassSecurityTrustHtml/i.test(content)) {
        const lineNum = content.substring(0, content.search(/\[innerHTML\]|\.innerHTML/i)).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'HIGH',
          owasp: 'A03: Injection (XSS)',
          message: 'XSS: innerHTML without DomSanitizer',
          suggestion: 'Use property binding [textContent] or inject DomSanitizer: constructor(private sanitizer: DomSanitizer) { this.html = sanitizer.sanitize(SecurityContext.HTML, userInput); }'
        });
      }
    }

    // Unsafe string interpolation in HTML
    if (/\{\{.*\+.*\}\}|innerHTML.*\+|\.append.*\+/i.test(content)) {
      const lineNum = content.substring(0, content.search(/\{\{|innerHTML|append/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'HIGH',
        owasp: 'A03: Injection (XSS)',
        message: 'XSS: Unsanitized string concatenation in HTML',
        suggestion: 'Use property binding [value]="var" or *ngIf/*ngFor instead of string concatenation'
      });
    }

    // eval or Function constructor
    if (/eval\s*\(|new\s*Function\s*\(/i.test(content)) {
      const lineNum = content.substring(0, content.search(/eval|Function/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'CRITICAL',
        owasp: 'A03: Injection (XSS)',
        message: 'XSS: eval() or Function constructor - arbitrary code execution risk',
        suggestion: 'Never use eval(). Use JSON.parse() for safe parsing or template expressions'
      });
    }

    return issues;
  }
}

module.exports = XSSRules;
