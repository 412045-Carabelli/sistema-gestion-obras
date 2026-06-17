/**
 * A03: Injection (SQL, NoSQL, Command)
 */

class InjectionRules {
  check(filePath, content) {
    const issues = [];

    // SQL Injection patterns
    const sqlPatterns = [
      /Statement\s*=\s*.*\.prepareStatement\([^?]*\+/,
      /executeQuery\s*\([^?]*\+/,
      /@Query\s*\([^)]*\+/,
      /\.setString\s*\(\s*\d+\s*,\s*[^)]*\+/,
    ];

    // Command injection patterns
    const cmdPatterns = [
      /Runtime\.getRuntime\(\)\.exec\s*\([^)]*\+/,
      /ProcessBuilder\s*\([^)]*\+/,
    ];

    sqlPatterns.forEach((pattern, idx) => {
      if (pattern.test(content)) {
        const lineNum = content.substring(0, content.search(pattern)).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'CRITICAL',
          owasp: 'A03: Injection',
          message: 'SQL Injection: String concatenation in query',
          suggestion: 'Use PreparedStatement with ? placeholders or @Query with :paramName'
        });
      }
    });

    cmdPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        const lineNum = content.substring(0, content.search(pattern)).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'CRITICAL',
          owasp: 'A03: Injection',
          message: 'Command Injection: Unsafe command execution',
          suggestion: 'Avoid Runtime.exec(). Use ProcessBuilder with array args (no string concat)'
        });
      }
    });

    return issues;
  }
}

module.exports = InjectionRules;
