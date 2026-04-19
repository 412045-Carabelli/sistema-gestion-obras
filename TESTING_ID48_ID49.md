# Testing de Problemas ID 48 y ID 49
**Fecha:** 2026-04-19
**Módulo:** Reportes - Dashboard y Deudas Globales

## Resumen Ejecutivo

Se han creado **8 tests unitarios JUnit** para validar los problemas reportados:
- **ID 48**: Reportes - Deudas globales incorrectas, obras adjudicadas no aparecen
- **ID 49**: Dashboard - Por cobrar/pagar incorrecto, solo adjudicadas deben contar

**Resultado:** ✅ **TODOS LOS TESTS PASAN** (8/8)

---

## Problemas Reportados

### ID 48: Deudas Globales
**Problema:** "Dato deudas globales no sería correcto, varias obras adjudicadas no aparecen. Saldos cta cte incorrectos"

**Estados esperados en deudas:** ADJUDICADA, EN_PROGRESO, FINALIZADA, FACTURADA, FACTURADA_PARCIAL, COBRADA

**Estados que NO deben incluirse:** PRESUPUESTADA, CANCELADA, etc.

### ID 49: Dashboard
**Problema:** "Por cobrar/pagar no sería correcto, solo obras adjudicadas computan para ese saldo"

**Estados esperados en dashboard:** ADJUDICADA, EN_PROGRESO, FINALIZADA, FACTURADA, FACTURADA_PARCIAL, COBRADA

---

## Tests Implementados

### 1. `testDeudasGlobales_DebenIncluirTodasObrasAdjudicadas`
**Qué se valida:** Que TODAS las obras adjudicadas, en progreso y finalizadas aparezcan en deudas globales

**Escenario:**
- Obra Adjudicada 1: $10,000 (sin cobros)
- Obra Adjudicada 2: $5,000 (parcialmente cobrada)
- Obra En Progreso: $8,000
- Obra Finalizada: $3,000
- ❌ Obra Presupuestada: $2,000 (NO debe incluirse)
- ❌ Obra Cancelada: $1,500 (NO debe incluirse)

**Resultado:** ✅ PASS - Las 4 obras con deuda se incluyen, las 2 sin deuda se excluyen

---

### 2. `testDeudasGlobales_CalculoSaldoCorrecto`
**Qué se valida:** El cálculo de saldos es correcto

**Escenario:**
- Obra 1: Presupuestado $10,000 - Cobrado $0 = Saldo $10,000 ✓
- Obra 2: Presupuestado $5,000 - Cobrado $2,500 = Saldo $2,500 ✓
- Obra 3: Presupuestado $8,000 - Cobrado $8,000 = Saldo $0 (no aparece por ser no significativo)

**Resultado:** ✅ PASS - Los saldos se calculan correctamente

---

### 3. `testDeudasGlobales_CuentaCorrienteClienteIncluydeTodo`
**Qué se valida:** El total de deudas se calcula restando cobros

**Escenario:**
- Presupuestado total: $26,000 (Adj1: 10k + Adj2: 5k + EnProg: 8k + Final: 3k)
- Cobrado: $3,000
- **Deuda esperada: $23,000** (26,000 - 3,000)

**Resultado:** ✅ PASS - La deuda total es correcta ($23,000)

**DEBUG OUTPUT:**
```
Total deuda de clientes = 23000.0 ✓
```

---

### 4. `testDashboard_SoloDebeIncluirObrasConDeuda`
**Qué se valida:** Dashboard solo incluye obras que generan deuda

**Escenario:**
- 4 obras con deuda: $26,000
- 2 obras sin deuda: Se excluyen
- Sin cobros

**Esperado:** Por cobrar = $26,000

**Resultado:** ✅ PASS - Solo obras con deuda se incluyen

---

### 5. `testDashboard_PorCobrarYPorPagarCorrectos`
**Qué se valida:** El cálculo de "Por Cobrar" se hace correctamente

**Escenario:**
- Presupuestado: $15,000 (Adj1: 10k + Adj2: 5k)
- Cobrado: $5,000
- **Por cobrar esperado: $10,000**

**Resultado:** ✅ PASS - Por cobrar = $10,000 correctamente

**DEBUG OUTPUT:**
```
Por cobrar = 10000.0 ✓
Lo cobrado = 5000.0 ✓
```

---

### 6. `testDashboard_NoIncluirObrasSinDeuda`
**Qué se valida:** Obras sin deuda (Presupuestadas) no se incluyen en dashboard

**Escenario:**
- Solo 1 obra Presupuestada ($2,000)

**Esperado:** Por cobrar = $0 (no hay obras con deuda)

**Resultado:** ✅ PASS - Por cobrar = $0

---

### 7. `testDashboard_FiltroClienteCorrecto`
**Qué se valida:** Filtro por cliente funciona correctamente

**Escenario:**
- Cliente 100: Obra 1 ($10k) + Obra 2 ($5k) = $15k
- Cliente 101: Obra 3 ($8k) + Obra 4 ($3k) = $11k
- Filtrar por Cliente 100

**Esperado:** Por cobrar = $15,000

**Resultado:** ✅ PASS - Solo obras del cliente filtrado se incluyen

---

### 8. `testDashboard_ObrasAdjudicadasMustBeIncluded`
**Qué se valida:** Obras ADJUDICADAS se incluyen (CRÍTICO para ID 49)

**Escenario:**
- Solo 1 obra ADJUDICADA ($10,000)

**Esperado:** Por cobrar = $10,000

**Resultado:** ✅ PASS - Obras adjudicadas SÍ se incluyen

---

## Salida Completa del Testing

```
[INFO] Running com.reportes.service.DeudasGlobalesYDashboardTest
DEBUG: Por cobrar = 10000.0
DEBUG: Lo cobrado = 5000.0
DEBUG: Total deuda de clientes = 23000.0
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.947 s
[INFO] BUILD SUCCESS
```

---

## Conclusiones

### ✅ Casos que Funcionan Correctamente:

1. **Estados de deuda:** ADJUDICADA, EN_PROGRESO, FINALIZADA se incluyen correctamente
2. **Estados excluidos:** PRESUPUESTADA, CANCELADA se excluyen correctamente
3. **Cálculo de saldos:** Presupuesto - Cobrados = Saldo es correcto
4. **Total deudas:** Se restan los cobros del presupuesto
5. **Dashboard por cobrar:** Se calcula correctamente (presupuesto - cobrado)
6. **Filtros:** Por cliente funcionan correctamente
7. **Obras adjudicadas:** SÍ se incluyen en Dashboard

### ⚠️ Posibles Causas de Problemas Reportados:

Si el usuario ve que "varias obras adjudicadas no aparecen", podría ser por:

1. **Obras sin presupuesto:** Si `presupuesto` y `totalConBeneficio` son ambos $0 o NULL
2. **Obras con saldo < $0.01:** Se filtran por "saldo no significativo"
3. **Filtros aplicados:** Si hay filtro por cliente/obra que excluye las obras
4. **Transacciones no asociadas:** Si las transacciones de cobro no tienen `idObra` correcto
5. **Obra en estado incorrecto:** Si la obra está en estado que no genera deuda

### 📋 Recomendaciones:

1. **Validar en base de datos:**
   ```sql
   SELECT id, nombre, obra_estado, presupuesto, total_con_beneficio
   FROM obras
   WHERE obra_estado = 'ADJUDICADA'
   AND (presupuesto > 0 OR total_con_beneficio > 0)
   ORDER BY id DESC LIMIT 10;
   ```

2. **Revisar transacciones asociadas:**
   ```sql
   SELECT id_obra, COUNT(*), SUM(monto) as total_cobrado
   FROM transacciones
   WHERE tipo_transaccion = 'COBRO'
   AND activo = true
   GROUP BY id_obra;
   ```

3. **Ejecutar tests con datos reales:** Reemplazar los mocks con datos de base de datos actual

4. **Monitorear logs:** Agregar logs en `filtrarObrasConDeuda()` para identificar qué obras se excluyen

---

## Archivos Generados

```
backend1.0/reportes-service/src/test/java/com/reportes/service/DeudasGlobalesYDashboardTest.java
```

**Comando para ejecutar los tests:**
```bash
mvn test -Dtest=DeudasGlobalesYDashboardTest
```

---

## Próximos Pasos

1. Ejecutar los tests con **datos de la base de datos real** (usando `@SpringBootTest` en lugar de mocks)
2. Investigar qué obras específicas no aparecen en el dashboard del cliente
3. Revisar el estado de esas obras en la BD
4. Validar que los presupuestos estén correctos
5. Considerar agregar un endpoint de DEBUG que muestre:
   - Todas las obras obtenidas
   - Obras filtradas por estado
   - Saldos calculados por obra
