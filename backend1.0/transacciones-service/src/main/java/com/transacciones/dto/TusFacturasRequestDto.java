package com.transacciones.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TusFacturasRequestDto {

    private String apitoken;
    private String apikey;
    private String usertoken;
    private ClienteDto cliente;
    private ComprobanteDto comprobante;

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ClienteDto {
        @JsonProperty("documento_tipo")
        private String documentoTipo;

        @JsonProperty("documento_nro")
        private String documentoNro;

        @JsonProperty("razon_social")
        private String razonSocial;

        @JsonProperty("condicion_iva")
        private String condicionIva;

        private String email;

        private String domicilio;

        private String provincia;

        @JsonProperty("condicion_pago")
        private String condicionPago;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ComprobanteDto {
        private String tipo;
        private String fecha;
        private Integer numero;

        @JsonProperty("punto_venta")
        private Integer puntoVenta;

        private String moneda;
        private Integer cotizacion;
        private String concepto;
        private String operacion;
        private Double total;
        private List<DetalleDto> detalle;
    }

    @Data
    @Builder
    public static class DetalleDto {
        private Double cantidad;
        private ProductoDto producto;
    }

    @Data
    @Builder
    public static class ProductoDto {
        private String descripcion;

        @JsonProperty("precio_unitario_sin_iva")
        private Double precioUnitarioSinIva;

        private Double alicuota;
    }
}
