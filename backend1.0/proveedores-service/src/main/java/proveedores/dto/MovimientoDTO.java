package proveedores.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoDTO {
    private Long id;
    private Long proveedorId;
    private Long obraId;
    private String obraNombre;
    private String descripcion;
    private BigDecimal monto;
    private BigDecimal montoPagado;
    private BigDecimal saldoPendiente;
    private String estadoPago;
    private Instant creadoEn;
}
