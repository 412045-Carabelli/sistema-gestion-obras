package proveedores.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MovimientoRequest {
    private Long obraId;
    private String descripcion;
    private BigDecimal monto;
    private BigDecimal montoPagado;
    private Boolean pagado;
}
