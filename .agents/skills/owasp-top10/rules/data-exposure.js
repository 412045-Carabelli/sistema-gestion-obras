/**
 * A02: Cryptographic Failures (Data Exposure)
 */

class DataExposureRules {
  check(filePath, content) {
    const issues = [];

    // Secrets in code
    if (/const\s+\w*(secret|key|password|token|apiKey|apiSecret)\s*=\s*["'][^"']+["']/i.test(content)) {
      const lineNum = content.substring(0, content.search(/const.*secret|const.*password/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'CRITICAL',
        owasp: 'A02: Cryptographic Failures',
        message: 'CRITICAL: Hardcoded secret in code',
        suggestion: 'Use environment variables: const secret = process.env.API_SECRET or @Value("${api.secret}")'
      });
    }

    // Sensitive data in logs
    if (/console\.(log|error|debug|info).*password|logger\.(info|debug).*password|log\..*password/i.test(content)) {
      const lineNum = content.substring(0, content.search(/console\.|logger\.|log\./i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'HIGH',
        owasp: 'A02: Cryptographic Failures',
        message: 'Sensitive Data Exposure: Password/token logged',
        suggestion: 'Remove sensitive data from logs. Log: log.info("User login: {}", userId) not passwords'
      });
    }

    // HTTPS not enforced
    if (/http:\/\/|HttpClient|new RestTemplate/i.test(content)) {
      if (!/https:\/\/|.forceHttps|secure.*true/i.test(content)) {
        const lineNum = content.substring(0, content.search(/http:\/\/|HttpClient/i)).split('\n').length;
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'HIGH',
          owasp: 'A02: Cryptographic Failures',
          message: 'Insecure Transport: HTTP connection instead of HTTPS',
          suggestion: 'Use HTTPS URLs only. In Spring Boot: server.servlet.session.cookie.secure=true'
        });
      }
    }

    // Unencrypted data storage
    if (/plainText|PLAINTEXT|encrypted\s*=\s*false|encrypt.*false/i.test(content)) {
      const lineNum = content.substring(0, content.search(/plainText|encrypted.*false/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'HIGH',
        owasp: 'A02: Cryptographic Failures',
        message: 'Data stored unencrypted',
        suggestion: 'Use encryption at rest: AES-256 with SecretKey or database encryption'
      });
    }

    // Weak hashing
    if (/MD5|SHA1|\.hashCode\(\)|SecureRandom.*[0-9]+\s*\)/i.test(content)) {
      const lineNum = content.substring(0, content.search(/MD5|SHA1|hashCode/i)).split('\n').length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'HIGH',
        owasp: 'A02: Cryptographic Failures',
        message: 'Weak Hashing Algorithm',
        suggestion: 'Use BCrypt (passwords) or SHA-256+ (other data). Not MD5/SHA1'
      });
    }

    return issues;
  }
}

module.exports = DataExposureRules;
