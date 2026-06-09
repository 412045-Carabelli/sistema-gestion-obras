# Validate Code

Ejecuta el validador pre-commit para verificar que los cambios staged cumplan con las convenciones del proyecto.

## Usage

```
/validate-code
```

## What it does

- Valida archivos staged según convenciones CLAUDE.md
- Verifica Angular: standalone, @if/@for, @defer, naming
- Verifica Java: DTOs split, entidades sin @Data, migraciones SQL Server
- Muestra errores (bloqueantes) y warnings (informativos)

## Output

- ✅ **Éxito**: Todos los archivos cumplen convenciones
- ❌ **Errores**: Lista qué arreglar antes de commitear
- ⚠️ **Warnings**: Recomendaciones de mejora

---

```shell
node .claude/validators/pre-commit-validator.js
```
