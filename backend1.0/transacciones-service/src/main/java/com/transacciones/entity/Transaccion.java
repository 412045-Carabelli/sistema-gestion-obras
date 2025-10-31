package com.transacciones.entity;

import com.common.audit.AbstractAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity that represents a monetary transaction registered against an obra.
 */
@Entity
@Table(name = "transacciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Transaccion extends AbstractAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_obra", nullable = false)
    private Long idObra;

    @Column(name = "tipo_asociado", nullable = false)
    private String tipoAsociado;

    @Column(name = "id_asociado", nullable = false)
    private Long idAsociado;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_transaccion", nullable = false)
    private TipoTransaccion tipo_transaccion;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "monto", nullable = false)
    private Double monto;

    @Column(name = "forma_pago", nullable = false)
    private String forma_pago; // Parcial | Total

    @Column(name = "activo")
    private Boolean activo = true;
}
