# OWASP Top 10 Vulnerability Scanner

Detecta y sugiere fixes para vulnerabilidades OWASP Top 10 en código Angular + Java.

## Vulnerabilidades Detectadas

| OWASP | Categoría | Lenguajes |
|-------|-----------|-----------|
| A01 | Broken Access Control (CSRF, Auth) | Angular, Java |
| A02 | Cryptographic Failures (Secrets, Crypto) | Angular, Java |
| A03 | Injection (SQL, XSS, Command) | Angular, Java |
| A07 | Authentication Failures (Weak passwords, no encoding) | Java |

## Instalación

```bash
# 1. Instalar como pre-commit hook
node .agents/skills/owasp-top10/setup/install-hook.js

# 2. Verificar instalación
cat .git/hooks/pre-commit
```

## Uso

### On-Demand (por demanda)

En Claude Code, usa:

```bash
/owasp-scan                                  # Escanea todo (frontend + backend)
/owasp-scan 'frontend/src/**/*.ts'           # Solo frontend
/owasp-scan 'backend1.0/**/*.java'           # Solo backend
/owasp-frontend                              # Alias para escanear frontend
/owasp-backend                               # Alias para escanear backend
```

O por terminal:

```bash
npm run scan                   # Todo
npm run scan-frontend         # Frontend
npm run scan-backend          # Backend
node .agents/skills/owasp-top10/command.js 'src/**/*.ts'
```

### Automático (pre-commit)

Cuando intentas hacer commit, la herramienta escanea automáticamente. Si detecta vulnerabilidades CRITICAL, el commit se bloquea.

```bash
git commit -m "mi cambio"
# 🔒 Running OWASP Top 10 security scan...
# ❌ Found 1 potential vulnerabilities
# ❌ CRITICAL vulnerabilities found. Commit blocked.

# Para saltear (NO RECOMENDADO):
git commit -m "mi cambio" --no-verify
```

## Ejemplos de Issues Detectados

### XSS (Angular)

```typescript
// ❌ BAD - XSS Risk
<div [innerHTML]="userData.bio"></div>

// ✓ GOOD
<div [textContent]="userData.bio"></div>
// O si realmente necesitas HTML:
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';
constructor(private sanitizer: DomSanitizer) {}
safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, userInput);
```

### SQL Injection (Java)

```java
// ❌ BAD - SQL Injection Risk
String sql = "SELECT * FROM users WHERE id = " + userId;
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(sql);

// ✓ GOOD
String sql = "SELECT * FROM users WHERE id = ?";
PreparedStatement stmt = conn.prepareStatement(sql);
stmt.setLong(1, userId);
ResultSet rs = stmt.executeQuery();
```

### Hardcoded Secrets

```typescript
// ❌ BAD - Secret in Code
const apiKey = "sk-abc123xyz789";

// ✓ GOOD
const apiKey = process.env.API_KEY;  // Angular
const apiKey = @Value("${api.key}")  // Java
```

### Weak Auth (Java)

```java
// ❌ BAD
@Bean
PasswordEncoder passwordEncoder() {
  return NoOpPasswordEncoder.getInstance();
}

// ✓ GOOD
@Bean
PasswordEncoder passwordEncoder() {
  return new BCryptPasswordEncoder(12);
}
```

## Ignorar Issues (Cautela)

Si necesitas ignorar un issue (no recomendado):

```bash
git commit -m "..." --no-verify
```

O edita `.git/hooks/pre-commit` para deshabilitar temporalmente.

## Configuración Personalizada

Edita los patrones en `rules/*.js` para agregar nuevas detecciones:

```javascript
// rules/my-rule.js
class MyRule {
  check(filePath, content) {
    const issues = [];
    if (/myPattern/i.test(content)) {
      issues.push({
        file: filePath,
        line: 10,
        severity: 'HIGH',
        owasp: 'A01: Broken Access Control',
        message: 'Custom issue detected',
        suggestion: 'Fix by doing X instead of Y'
      });
    }
    return issues;
  }
}
module.exports = MyRule;
```

Luego actualiza `index.js` para incluirla.

## Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Angular Security](https://angular.io/guide/security)
- [OWASP Java Security](https://cheatsheetseries.owasp.org/cheatsheets/Java_Security_Cheat_Sheet.html)
- [Spring Security](https://spring.io/projects/spring-security)
