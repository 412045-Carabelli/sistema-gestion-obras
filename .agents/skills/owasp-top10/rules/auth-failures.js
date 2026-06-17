/**
 * A07: Authentication Failures
 */

class AuthFailuresRules {
  check(filePath, content) {
    const issues = [];

    // Hardcoded credentials
    if (/password\s*[=:]\s*["'][^"']+["']|apiKey\s*[=:]\s*["'][^"']+["']|secret\s*[=:]\s*["'][^"']+["']/i.test(content)) {
      const lineNum = content.substring(0, content.search(/password|apiKey|secret/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'CRITICAL',
        owasp: 'A07: Authentication Failures',
        message: 'CRITICAL: Hardcoded credentials in code',
        suggestion: 'Move to environment variables (process.env, application.properties) or use secure vault'
      });
    }

    // Weak password validation
    if (/new RegExp\(.*[a-z].*\)|length.*<\s*8|minLength\s*=\s*["\']?[0-5]/i.test(content)) {
      const lineNum = content.substring(0, content.search(/RegExp|minLength/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'HIGH',
        owasp: 'A07: Authentication Failures',
        message: 'Weak Password Policy: Minimum length < 8 or missing complexity',
        suggestion: 'Require: min 12 chars, uppercase, lowercase, number, special char. Use Validators.pattern()'
      });
    }

    // NoOpPasswordEncoder or no encoding
    if (/NoOpPasswordEncoder|PasswordEncoder\s*=\s*null|plainText\s*password/i.test(content)) {
      const lineNum = content.substring(0, content.search(/NoOpPasswordEncoder|plainText/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'CRITICAL',
        owasp: 'A07: Authentication Failures',
        message: 'CRITICAL: Passwords not encoded',
        suggestion: 'Use BCryptPasswordEncoder: @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }'
      });
    }

    // No @PreAuthorize on sensitive endpoints
    if (/@PostMapping|@PutMapping|@DeleteMapping|@PatchMapping/i.test(content)) {
      if (!/@PreAuthorize|@Secured|.hasRole|.hasAuthority/i.test(content)) {
        const lineNum = content.substring(0, content.search(/@PostMapping|@PutMapping|@DeleteMapping/i)).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'HIGH',
          owasp: 'A01: Broken Access Control',
          message: 'Missing Authorization: State-changing endpoint without @PreAuthorize',
          suggestion: 'Add @PreAuthorize("hasRole(\'USER\')") or @PreAuthorize("@securityService.canAccess(#id)")'
        });
      }
    }

    return issues;
  }
}

module.exports = AuthFailuresRules;
