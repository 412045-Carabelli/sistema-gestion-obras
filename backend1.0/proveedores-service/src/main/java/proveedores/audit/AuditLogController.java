package proveedores.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auditoria")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository repository;

    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> obtener(@PathVariable("id") Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<AuditLog> buscar(
            @RequestParam(name = "modulo", required = false) String modulo,
            @RequestParam(name = "tipo", required = false) String tipo,
            @RequestParam(name = "creador", required = false) String creador,
            @RequestParam(name = "endpoint", required = false) String endpoint,
            @RequestParam(name = "tabla", required = false) String tabla,
            @RequestParam(name = "codigo", required = false) Integer codigo,
            @RequestParam(name = "desde", required = false) String desde,
            @RequestParam(name = "hasta", required = false) String hasta
    ) {
        Instant desdeInstant = parseInstant(desde, false);
        Instant hastaInstant = parseInstant(hasta, true);
        return repository.search(modulo, tipo, creador, endpoint, tabla, codigo, desdeInstant, hastaInstant);
    }

    private Instant parseInstant(String value, boolean endOfDay) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (Exception ignored) {
        }
        try {
            LocalDateTime ldt = LocalDateTime.parse(value);
            return ldt.atZone(ZoneId.systemDefault()).toInstant();
        } catch (Exception ignored) {
        }
        try {
            LocalDate date = LocalDate.parse(value);
            LocalDateTime ldt = endOfDay
                    ? date.atTime(23, 59, 59, 999_000_000)
                    : date.atStartOfDay();
            return ldt.atZone(ZoneId.systemDefault()).toInstant();
        } catch (Exception ignored) {
        }
        return null;
    }
}

