package com.obras.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.obras.enums.EstadoPagoEnum;
import com.obras.enums.TipoCostoEnum;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class ObraCostoDTO {
    private Long id;
    @JsonProperty("id_obra")
    private Long id_obra;
    @JsonProperty("id_proveedor")
    private Long id_proveedor;
    @JsonProperty("item_numero")
    private String item_numero;
    private String descripcion;
    private String unidad;
    private BigDecimal cantidad;
    @JsonProperty("precio_unitario")
    private BigDecimal precio_unitario;
    private BigDecimal beneficio;
    private BigDecimal subtotal;
    private BigDecimal total;
    @JsonProperty("monto_real")
    private BigDecimal monto_real;
    @JsonProperty("estado_pago")
    private EstadoPagoEnum estado_pago;
    @JsonProperty("tipo_costo")
    private TipoCostoEnum tipo_costo;
    private Boolean activo;
    @JsonProperty("ultima_actualizacion")
    private Instant ultima_actualizacion;
    @JsonProperty("tipo_actualizacion")
    private String tipo_actualizacion;
}

