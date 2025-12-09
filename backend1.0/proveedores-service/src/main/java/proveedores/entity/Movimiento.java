package proveedores.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "movimientos")
@Data
public class Movimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(name = "obra_id")
    private Long obraId;

    private String descripcion;

    @Column(nullable = false)
    private BigDecimal monto = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal montoPagado = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean pagado = Boolean.FALSE;

    @Column(name = "creado_en")
    private Instant creadoEn = Instant.now();
}
