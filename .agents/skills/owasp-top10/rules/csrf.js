/**
 * A01: Broken Access Control (CSRF Protection)
 */

class CSRFRules {
  check(filePath, content) {
    const issues = [];

    // POST/PUT/DELETE forms without CSRF protection
    if (/<form[^>]*method\s*=\s*["']?(POST|PUT|DELETE)/i.test(content)) {
      const methodMatch = content.match(/<form[^>]*method\s*=\s*["']?(POST|PUT|DELETE)/i);
      if (methodMatch) {
        // Check if CSRF token is present
        if (!/csrf|_token|x-csrf|anti.*forgery/i.test(content)) {
          const lineNum = content.substring(0, content.indexOf(methodMatch[0])).split('\n').length;
          issues.push({
            file: filePath,
            line: lineNum,
            severity: 'HIGH',
            owasp: 'A01: Broken Access Control (CSRF)',
            message: `CSRF: ${methodMatch[1]} form missing CSRF token protection`,
            suggestion: 'Add HttpClientXsrfModule to app.config.ts or include hidden CSRF token field in form'
          });
        }
      }
    }

    // HTTP requests without CSRF headers (if custom)
    if (/this\.http\.(post|put|delete)/i.test(content)) {
      if (!/withCredentials|XSRF|csrf|HttpClientXsrf/i.test(content)) {
        const lineNum = content.substring(0, content.search(/this\.http\.(post|put|delete)/i)).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'MEDIUM',
          owasp: 'A01: Broken Access Control (CSRF)',
          message: 'CSRF: HTTP request may not include CSRF token',
          suggestion: 'Ensure app.config.ts includes HttpClientXsrfModule.withOptions({ headerName: "X-CSRF-TOKEN" })'
        });
      }
    }

    return issues;
  }
}

module.exports = CSRFRules;
