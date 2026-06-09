#!/usr/bin/env node

/**
 * Pre-commit validator para SGO
 * Valida convenciones antes de permitir commit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ERRORS = [];
const WARNINGS = [];

// Obtener archivos staged
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Validar componentes Angular standalone
function validateAngularComponents(filePath) {
  if (!filePath.endsWith('.component.ts')) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // Debe tener standalone: true
  if (!content.includes('standalone: true')) {
    ERRORS.push(`❌ ${filePath}: Componente debe tener 'standalone: true'`);
  }

  // Validar control flow: @if, @for, @defer (no *ngIf, *ngFor)
  const templateFile = filePath.replace('.ts', '.html');
  if (fs.existsSync(templateFile)) {
    const template = fs.readFileSync(templateFile, 'utf8');

    // Warn si usa *ngIf o *ngFor
    if (template.includes('*ngIf') || template.includes('*ngFor')) {
      WARNINGS.push(`⚠️  ${templateFile}: Considera usar @if/@for en lugar de *ngIf/*ngFor`);
    }

    // Detectar lazy loading sin @defer
    if (template.includes('(click)') && !template.includes('@defer')) {
      // Solo warn si es una carga de datos (heurística: si hay un método que parece cargar)
      if (content.includes('cargar') || content.includes('Cargar') || content.includes('load')) {
        WARNINGS.push(`⚠️  ${templateFile}: Considera usar @defer para lazy loading de datos`);
      }
    }
  }
}

// Validar DTOs (Request/Response split)
function validateDtos(filePath) {
  if (!filePath.includes('/dto/') || !filePath.endsWith('.java')) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Debe ser Request o Response, no DTO genérico
  if (fileName === 'Dto.java' || (fileName.endsWith('Dto.java') && !fileName.includes('Request') && !fileName.includes('Response'))) {
    ERRORS.push(`❌ ${filePath}: DTOs deben ser split (usar RequestDto o ResponseDto en el nombre)`);
  }

  // Response debe tener @JsonInclude(NON_NULL)
  if (fileName.includes('Response')) {
    if (!content.includes('@JsonInclude(JsonInclude.Include.NON_NULL)')) {
      WARNINGS.push(`⚠️  ${filePath}: ResponseDto debería tener @JsonInclude(NON_NULL)`);
    }
  }
}

// Validar Entidades (no usar @Data)
function validateEntities(filePath) {
  if (!filePath.includes('/entity/') || !filePath.endsWith('.java')) return;

  const content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('@Data')) {
    ERRORS.push(`❌ ${filePath}: Entidades NO deben usar @Data (usar @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor)`);
  }

  // Debe tener @Entity
  if (!content.includes('@Entity')) {
    ERRORS.push(`❌ ${filePath}: Entity debe tener anotación @Entity`);
  }
}

// Validar Migraciones Flyway (SQL Server syntax)
function validateFlywayMigrations(filePath) {
  if (!filePath.includes('db/migration/V') || !filePath.endsWith('.sql')) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // SQL Server syntax checks
  const checks = [
    {
      pattern: /IDENTITY\s*\(/,
      passed: true,
      msg: 'Usa IDENTITY(1,1) para auto-increment ✓',
      error: 'Debe usar IDENTITY(1,1), no AUTO_INCREMENT'
    },
    {
      pattern: /AUTO_INCREMENT/,
      passed: false,
      msg: 'No usar AUTO_INCREMENT'
    },
    {
      pattern: /NVARCHAR\s*\(\s*MAX\s*\)/,
      passed: true,
      msg: 'Usa NVARCHAR(MAX) para strings largos ✓'
    },
    {
      pattern: /TEXT\s*[,;]/,
      passed: false,
      msg: 'No usar TEXT, usar NVARCHAR(MAX)'
    },
    {
      pattern: /BIT/,
      passed: true,
      msg: 'Usa BIT para booleanos ✓'
    },
    {
      pattern: /BOOLEAN/,
      passed: false,
      msg: 'No usar BOOLEAN, usar BIT'
    }
  ];

  checks.forEach(check => {
    if (check.pattern.test(content)) {
      if (!check.passed) {
        ERRORS.push(`❌ ${filePath}: ${check.msg}`);
      }
    }
  });

  // Validar DATETIME2
  if (content.includes('TIMESTAMP') && !content.includes('DATETIME2')) {
    WARNINGS.push(`⚠️  ${filePath}: Considera usar DATETIME2 en lugar de TIMESTAMP`);
  }
}

// Validar naming (kebab-case en archivos Angular)
function validateNaming(filePath) {
  const fileName = path.basename(filePath);

  if (filePath.includes('frontend/') && (filePath.endsWith('.component.ts') || filePath.endsWith('.service.ts'))) {
    // Debe ser kebab-case
    const fileNameWithoutExt = fileName.replace(/\.(ts|html|css)$/, '');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fileNameWithoutExt)) {
      ERRORS.push(`❌ ${filePath}: Archivos Angular deben ser kebab-case (ej: my-component.component.ts)`);
    }
  }
}

// Ejecutar validaciones
function runValidations() {
  const stagedFiles = getStagedFiles();

  stagedFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      validateAngularComponents(filePath);
      validateDtos(filePath);
      validateEntities(filePath);
      validateFlywayMigrations(filePath);
      validateNaming(filePath);
    }
  });
}

// Reportar resultados
function report() {
  console.log('\n🔍 Pre-commit Validation Results\n');

  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('✅ Todas las validaciones pasaron\n');
    process.exit(0);
  }

  if (ERRORS.length > 0) {
    console.log('ERRORES (bloquean commit):');
    ERRORS.forEach(e => console.log(e));
    console.log();
  }

  if (WARNINGS.length > 0) {
    console.log('ADVERTENCIAS (solo informativas):');
    WARNINGS.forEach(w => console.log(w));
    console.log();
  }

  if (ERRORS.length > 0) {
    console.log('❌ Commit bloqueado: corrige los errores arriba\n');
    process.exit(1);
  }

  process.exit(0);
}

// Run
runValidations();
report();
