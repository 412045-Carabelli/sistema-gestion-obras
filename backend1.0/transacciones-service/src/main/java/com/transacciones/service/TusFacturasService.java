package com.transacciones.service;

import com.transacciones.dto.EmisionElectronicaRequest;
import com.transacciones.dto.FacturaDto;
import com.transacciones.dto.TusFacturasRequestDto;
import com.transacciones.dto.TusFacturasRequestDto.ClienteDto;
import com.transacciones.dto.TusFacturasRequestDto.ComprobanteDto;
import com.transacciones.dto.TusFacturasRequestDto.DetalleDto;
import com.transacciones.dto.TusFacturasRequestDto.ProductoDto;
import com.transacciones.dto.TusFacturasResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TusFacturasService {

    private static final DateTimeFormatter TF_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final RestTemplate restTemplate;

    @Value("${tusfacturas.api-url:https://www.tusfacturas.app/app/api/v2}")
    private String apiUrl;

    @Value("${tusfacturas.apitoken:DEMO_TOKEN}")
    private String apitoken;

    @Value("${tusfacturas.apikey:DEMO_KEY}")
    private String apikey;

    @Value("${tusfacturas.usertoken:DEMO_USERTOKEN}")
    private String usertoken;

    @Value("${tusfacturas.punto-venta:3}")
    private Integer puntoVenta;

    /**
     * Emite un comprobante electrónico en TusFacturasAPP y retorna la respuesta con el CAE.
     */
    public TusFacturasResponseDto emitirFactura(FacturaDto factura, EmisionElectronicaRequest req) {
        String tipo = req.getTipoComprobante() != null ? req.getTipoComprobante() : "FACTURA B";
        Integer numero = obtenerProximoNumero(tipo);

        TusFacturasRequestDto request = buildRequest(factura, req, tipo, numero);
        log.info("Emitiendo {} #{} — cliente: {}", tipo, numero, req.getClienteRazonSocial());

        TusFacturasResponseDto response = restTemplate.postForObject(
                apiUrl + "/facturacion/nuevo",
                request,
                TusFacturasResponseDto.class
        );

        if (response == null) {
            throw new RuntimeException("TusFacturasAPP no respondió");
        }
        if ("S".equals(response.getError())) {
            String msg = response.getErrores() != null
                    ? String.join(", ", response.getErrores())
                    : "Error desconocido";
            throw new RuntimeException("Error TusFacturasAPP: " + msg);
        }

        log.info("Factura emitida OK — CAE: {}, vto: {}", response.getCae(), response.getVencimientoCae());
        return response;
    }

    // ── Privados ──────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Integer obtenerProximoNumero(String tipoComprobante) {
        Map<String, Object> body = Map.of(
                "apitoken", apitoken,
                "apikey", apikey,
                "usertoken", usertoken,
                "tipo_comprobante", tipoComprobante,
                "punto_venta", puntoVenta
        );
        try {
            Map<String, Object> resp = restTemplate.postForObject(
                    apiUrl + "/facturacion/numeracion",
                    body,
                    Map.class
            );
            if (resp == null || "S".equals(resp.get("error"))) {
                throw new RuntimeException("No se pudo obtener numeración de TusFacturasAPP");
            }
            return Integer.parseInt(resp.get("rta").toString().trim());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error consultando numeración: " + e.getMessage(), e);
        }
    }

    private TusFacturasRequestDto buildRequest(
            FacturaDto factura,
            EmisionElectronicaRequest req,
            String tipo,
            Integer numero) {

        double total = factura.getMonto() != null ? factura.getMonto() : 0d;
        double alicuota = req.getAlicuotaIva() != null ? req.getAlicuotaIva() : 21d;

        // Para todos los tipos: monto = total con IVA. Calculamos neto como total / (1 + alicuota/100)
        double divisor = 1 + (alicuota / 100d);
        double neto = Math.round((total / divisor) * 100.0) / 100.0;

        String fechaStr = factura.getFecha() != null
                ? factura.getFecha().format(TF_DATE)
                : LocalDate.now().format(TF_DATE);

        String descripcion = (factura.getDescripcion() != null && !factura.getDescripcion().isBlank())
                ? factura.getDescripcion()
                : "Servicio de obra / construcción";

        ClienteDto cliente = ClienteDto.builder()
                .documentoTipo(coalesce(req.getClienteDocumentoTipo(), "DNI"))
                .documentoNro(coalesce(req.getClienteDocumentoNro(), "0"))
                .razonSocial(req.getClienteRazonSocial())
                .condicionIva(coalesce(req.getClienteCondicionIva(), "CF"))
                .email(req.getClienteEmail())
                .domicilio("Sin especificar")
                .provincia("2")        // Buenos Aires por defecto
                .condicionPago("201")  // Contado
                .build();

        ComprobanteDto comprobante = ComprobanteDto.builder()
                .tipo(tipo)
                .fecha(fechaStr)
                .numero(numero)
                .puntoVenta(puntoVenta)
                .moneda("PES")
                .cotizacion(1)
                .concepto("Servicios")
                .operacion("V")
                .total(total)
                .detalle(List.of(DetalleDto.builder()
                        .cantidad(1d)
                        .producto(ProductoDto.builder()
                                .descripcion(descripcion)
                                .precioUnitarioSinIva(neto)
                                .alicuota(alicuota)
                                .build())
                        .build()))
                .build();

        return TusFacturasRequestDto.builder()
                .apitoken(apitoken)
                .apikey(apikey)
                .usertoken(usertoken)
                .cliente(cliente)
                .comprobante(comprobante)
                .build();
    }

    private static String coalesce(String value, String fallback) {
        return (value != null && !value.isBlank()) ? value : fallback;
    }
}
