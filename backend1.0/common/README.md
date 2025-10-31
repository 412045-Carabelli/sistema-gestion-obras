# Módulo Common

Este módulo concentra componentes compartidos entre los microservicios, como la configuración de auditoría con Spring Data JPA y las clases base reutilizables.

## Componentes

- `AbstractAuditableEntity`: clase base que aporta los atributos de auditoría (`created_at`, `updated_at`, `created_by`, `updated_by`).
- `AuditingConfiguration`: auto configuración que habilita JPA Auditing en cualquier servicio que dependa de este módulo.
- `DefaultAuditorAware`: estrategia por defecto que resuelve el usuario autenticado a través del contexto de Spring Security.

## Uso

Añade la dependencia en el `pom.xml` de cada microservicio:

```xml
<dependency>
  <groupId>com.meliquina</groupId>
  <artifactId>common</artifactId>
</dependency>
```

La configuración se auto registrará al levantar el contexto de Spring Boot.
