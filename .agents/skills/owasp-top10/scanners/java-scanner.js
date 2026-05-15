/**
 * Java/Spring Security Scanner
 * Detects SQL injection, auth failures, crypto issues
 */

class JavaScanner {
  constructor() {
    this.injectionPatterns = [
      // String concatenation in queries
      { regex: /execute.*\+\s*|query.*\+\s*|Statement.*\+/gi, issue: 'SQL Injection: Query string concatenation detected' },
      // Unsafe string interpolation
      { regex: /String\.format.*%s.*sql|".*"\s*\+\s*var/gi, issue: 'SQL Injection: Unsafe string interpolation' },
      // JPQL/HQL injections
      { regex: /setParameter|createQuery.*\+|createNativeQuery.*\+/gi, issue: 'SQL Injection: Parameter not properly bound' },
    ];

    this.authPatterns = [
      // Passwords in log
      { regex: /log\.(info|debug|error).*password|logger.*password/gi, issue: 'CRITICAL: Password logged to output' },
      // No authorization checks
      { regex: /\.permitAll\(\)|\.anonymous\(\)/gi, issue: 'Broken Access Control: Anonymous access to sensitive endpoints' },
      // Weak password encoding
      { regex: /encode\(password\)|PasswordEncoder\s*=\s*null|NoOpPasswordEncoder/gi, issue: 'Auth Failure: Weak password encoding' },
    ];

    this.dataExposurePatterns = [
      // Plaintext secrets
      { regex: /private.*String.*password|private.*String.*secret|private.*String.*key/gi, issue: 'Data Exposure: Hardcoded secrets in code' },
      // Sensitive data in logs
      { regex: /log\.(info|debug).*email|log.*phone|log.*ssn/gi, issue: 'Data Exposure: Sensitive info in logs' },
      // Unencrypted storage
      { regex: /plainText|PLAINTEXT|encrypted\s*=\s*false/gi, issue: 'Cryptographic Failure: Data stored unencrypted' },
    ];

    this.dependencyPatterns = [
      // Known vulnerable versions
      { regex: /jackson.*2\.9\.|spring.*5\.0\.|log4j.*2\.14\./gi, issue: 'Vulnerable Component: Update dependency version' },
    ];
  }

  check(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    // Injection checks
    this.injectionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'CRITICAL',
          owasp: 'A03: Injection (SQL)',
          message: pattern.issue,
          suggestion: 'Use PreparedStatement or JPA with parameterized queries (@Query with ?1, :param)'
        });
      }
    });

    // Auth checks
    this.authPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const severity = pattern.issue.includes('CRITICAL') ? 'CRITICAL' : 'HIGH';
        issues.push({
          file: filePath,
          line: lineNum,
          severity: severity,
          owasp: 'A01/A07: Broken Access Control / Auth Failures',
          message: pattern.issue,
          suggestion: 'Add @PreAuthorize or .hasRole() / Use BCryptPasswordEncoder'
        });
      }
    });

    // Data exposure checks
    this.dataExposurePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'HIGH',
          owasp: 'A02: Cryptographic Failures',
          message: pattern.issue,
          suggestion: 'Use environment variables (application.properties) or vault for secrets'
        });
      }
    });

    return issues;
  }
}

module.exports = JavaScanner;
