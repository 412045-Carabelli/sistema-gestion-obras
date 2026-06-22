# Checklist de Compliance Legal - buildrr

## ✅ Implementado

- [x] **Términos de Servicio** (`TERMS_OF_SERVICE.md`)
  - Limitación de responsabilidad
  - Uso permitido/prohibido
  - Propiedad intelectual
  - Resolución de disputas

- [x] **Política de Privacidad** (`PRIVACY_POLICY.md`)
  - Cumplimiento LPDP (Ley 25.326)
  - Derechos de acceso, rectificación, cancelación
  - Notificación de brechas
  - Contacto privacy@buildrr.cloud

- [x] **Legal Controller** (`/api/legal/*`)
  - GET `/api/legal/terms`
  - GET `/api/legal/privacy`
  - GET `/api/legal/contact`

- [x] **Footer en Landing**
  - Links a Términos
  - Links a Privacidad

---

## ⏳ Próximos Pasos (No Urgente)

### 1. Registro ante AEPD (Antes de Producción)
**Acción:** Contactar Autoridad de Protección de Datos
- Inscribir como responsable de tratamiento de datos
- Completar formulario de registro
- Tiempo: ~2 semanas

**Contacto:**
- AEPD Argentina: www.aepd.gob.ar
- Requiere: Razón social, domicilio, responsable legal

### 2. Consentimiento Explícito en Registro
**Acción:** Agregar checkbox en login/registro
```typescript
// En login.component.html, antes del botón submit:
<div class="consent-checkbox">
  <input type="checkbox" formControlName="termsAccepted" required />
  <label>
    Acepto los <a href="/terminos" target="_blank">Términos de Servicio</a>
    y la <a href="/privacidad" target="_blank">Política de Privacidad</a>
  </label>
</div>
```

### 3. Data Processing Agreement (DPA)
**Acción:** Crear documento para clientes empresariales
- Define cómo se procesan datos de terceros
- Cómo se usan para fines administrativos
- Retención y eliminación

### 4. Política de Cookies
**Acción:** Crear `COOKIE_POLICY.md`
- Describir cookies técnicas
- Obtener consentimiento para analytics
- Banner de cookies en landing

### 5. Avisos de Incidente de Seguridad
**Acción:** Crear protocolo de respuesta
- Detectar brecha
- Notificar en 72 horas (LPDP)
- Documentar en logs

**Template email de notificación:**
```
Asunto: Incidente de Seguridad - Datos Personales Afectados

Estimado [Cliente],

Nos complace informarle sobre un incidente de seguridad que detectamos 
el [FECHA].

Datos afectados: [DESCRIPCCIÓN]
Medidas tomadas: [ACCIONES]
Contacto: privacy@buildrr.cloud

Atentamente,
Equipo Legal - buildrr
```

### 6. Auditoría de Seguridad Trimestral
**Acción:** Contatar auditor externo
- Verificar encriptación
- Revisar accesos y logs
- Generar reporte

---

## 📋 Obligaciones Continuas

### Mensual
- [ ] Revisar logs de acceso anómalo
- [ ] Verificar backups funcionan
- [ ] Monitorear uptime

### Trimestral
- [ ] Auditoría interna de seguridad
- [ ] Revisar solicitudes de derechos de usuarios
- [ ] Actualizar inventario de datos

### Anual
- [ ] Auditoría externa (si > 5000 registros)
- [ ] Revisar Política de Privacidad
- [ ] Capacitación de equipo en privacidad

---

## ⚠️ Riesgos Legales Mitigados

| Riesgo | Mitigación |
|--------|-----------|
| Multa AEPD por falta de política | ✅ Política publicada |
| Reclamación por mal uso de datos | ✅ Términos limitan responsabilidad |
| Incumplimiento LPDP | ✅ Derechos de acceso/cancelación |
| Demanda por brecha de seguridad | ✅ No garantía absoluta + notificación |
| Claim de terceros | ✅ Términos prohiben actividades ilícitas |

---

## 📞 Contactos Legales Recomendados

### Argentina
- **Abogado especializado en Derecho Digital**
  - Revisar Términos y Privacidad antes de producción
  - Costo estimado: $5,000-15,000 ARS

- **AEPD (Autoridad de Protección de Datos)**
  - www.aepd.gob.ar
  - Consultorías gratuitas

### Auditoría de Seguridad
- Buscar empresa con ISO 27001
- Costo: $10,000-30,000 ARS (trimestral)

---

## 🎯 Timeline Recomendado

**Antes de Producción (CRÍTICO):**
- [ ] Publicar Términos y Privacidad
- [ ] Registrarse ante AEPD
- [ ] Revisar con abogado especializado

**Primer Mes:**
- [ ] Implementar checkbox de consentimiento
- [ ] Crear protocolo de incidente
- [ ] Documentar procedimientos

**Próximos 3 Meses:**
- [ ] Auditoría de seguridad
- [ ] Entrenar equipo
- [ ] Crear DPA

---

## 📄 Referencias Legales

### Leyes Argentina
- **LPDP (Ley 25.326):** Protección de Datos Personales
- **CCC (Ley 26.994):** Código Civil Comercial
- **LSSI-CE:** Regulación de servicios de la sociedad de la información

### Estándares
- ISO 27001: Seguridad de la información
- OWASP Top 10: Seguridad web

---

**Nota:** Este checklist es orientativo. Consultar con abogado especializado antes de producción es OBLIGATORIO.

Última revisión: 21/06/2026
