package com.reportes.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class ObraCostoExternalDto {
    private Long id;
    @JsonProperty("id_obra")
    private Long idObra;
    @JsonProperty("id_proveedor")
    private Long idProveedor;
    private String descripcion;
    private String unidad;
    private BigDecimal cantidad;
    @JsonProperty("precio_unitario")
    private BigDecimal precioUnitario;
    private BigDecimal beneficio;
    private BigDecimal subtotal;
    private BigDecimal total;
    @JsonProperty("id_estado_pago")
    private Long idEstadoPago;
    private Boolean activo;
    @JsonProperty("ultima_actualizacion")
    private Instant ultimaActualizacion;
    @JsonProperty("tipo_actualizacion")
    private String tipoActualizacion;
}
