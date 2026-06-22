# Patrón de Resiliencia en BFF Controllers

## Objetivo
Cuando un microservicio no responde, el sistema sigue funcionando con datos parciales en lugar de fallar completamente.

## Uso

### 1. Inyectar ResilientWebClientService

```java
@RestController
@RequiredArgsConstructor
public class YourBffController {
    private final ResilientWebClientService resilientWebClientService;
}
```

### 2. Enriquecer datos con fallback

```java
// Obtener una obra
private Mono<Map<String, Object>> enriquecerObraConCliente(Map<String, Object> obra) {
    Long idCliente = ((Number) obra.get("id_cliente")).longValue();
    String clienteUrl = CLIENTES_URL + "/" + idCliente;

    return resilientWebClientService.getWithFallback(clienteUrl, "clientes")
            .map(cliente -> {
                obra.put("cliente", cliente);  // Si falla, cliente es Map con error=true
                return obra;
            });
}
```

### 3. Resultado

**Si clientes está disponible:**
```json
{
  "id": 1,
  "nombre": "Obra A",
  "cliente": { "id": 5, "nombre": "Juan Pérez" }
}
```

**Si clientes está down:**
```json
{
  "id": 1,
  "nombre": "Obra A",
  "cliente": { 
    "error": true,
    "unavailable": true,
    "service": "clientes"
  }
}
```

## Aplicar a estos controllers:

- [x] ObraBffController - GET /resilientes (ejemplo)
- [ ] CostoBffController - enriquecer con proveedores
- [ ] TransaccionBffController - enriquecer con obras/clientes
- [ ] FacturaBffController - enriquecer con obras/clientes
- [ ] ClienteBffController - enriquecer con obras
- [ ] DocumentoBffController - enriquecer con servicios relacionados

## Configuration

Los circuit breakers están configurados en `application-resilience.properties`:
- Threshold: 50% de fallos
- Ventana deslizante: 10 peticiones
- Espera en estado OPEN: 30 segundos

El sistema automáticamente pone el servicio en modo OPEN después de detectar fallos repetidos.
