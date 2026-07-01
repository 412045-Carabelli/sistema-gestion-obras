package com.auth.dto;

import com.auth.entity.Descuento;
import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DescuentoResponse {
    private Long id;
    private String codigo;
    private String descripcion;
    private String tipo;                // PORCENTAJE | MONTO_FIJO
    private BigDecimal valor;
    private Long planId;
    private String planNombre;
    private String aplicaCiclo;
    private Instant validoDesde;
    private Instant validoHasta;
    private Integer maxUsos;
    private Integer usosActuales;
    private Boolean soloPrimerPago;
    private Boolean activo;
    private Boolean vigente;
    private Instant creadoEn;
    private String creadoPor;

    public static DescuentoResponse from(Descuento d) {
        return DescuentoResponse.builder()
                .id(d.getId())
                .codigo(d.getCodigo())
                .descripcion(d.getDescripcion())
                .tipo(d.getTipo())
                .valor(d.getValor())
                .planId(d.getPlan() != null ? d.getPlan().getId() : null)
                .planNombre(d.getPlan() != null ? d.getPlan().getNombre() : null)
                .aplicaCiclo(d.getAplicaCiclo())
                .validoDesde(d.getValidoDesde())
                .validoHasta(d.getValidoHasta())
                .maxUsos(d.getMaxUsos())
                .usosActuales(d.getUsosActuales())
                .soloPrimerPago(d.getSoloPrimerPago())
                .activo(d.getActivo())
                .vigente(d.estaVigente())
                .creadoEn(d.getCreadoEn())
                .creadoPor(d.getCreadoPor())
                .build();
    }
}
