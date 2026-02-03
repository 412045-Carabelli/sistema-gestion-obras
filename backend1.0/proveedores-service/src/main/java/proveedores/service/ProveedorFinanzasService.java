package proveedores.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import proveedores.integration.ObrasClient;
import proveedores.integration.TransaccionesClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProveedorFinanzasService {

    private final ObrasClient obrasClient;
    private final TransaccionesClient transaccionesClient;

    public TotalesProveedor calcularTotales(Long proveedorId) {
        List<ObrasClient.ObraResumenResponse> obras = obrasClient.obtenerObras();
        Map<Long, Boolean> obraGeneraDeuda = new HashMap<>();
        for (ObrasClient.ObraResumenResponse obra : obras) {
            if (obra == null || obra.id() == null) continue;
            boolean activa = obra.activo() == null || Boolean.TRUE.equals(obra.activo());
            boolean genera = activa && obrasClient.obraGeneraDeuda(obra.obra_estado());
            obraGeneraDeuda.put(obra.id(), genera);
        }

        BigDecimal totalCostos = BigDecimal.ZERO;
        for (ObrasClient.ObraResumenResponse obra : obras) {
            if (obra == null || obra.id() == null) continue;
            if (!Boolean.TRUE.equals(obraGeneraDeuda.get(obra.id()))) continue;
            List<ObrasClient.ObraCostoResponse> costos = obrasClient.obtenerCostos(obra.id());
            for (ObrasClient.ObraCostoResponse costo : costos) {
                if (costo == null) continue;
                if (Boolean.FALSE.equals(costo.activo())) continue;
                if (!proveedorId.equals(costo.id_proveedor())) continue;
                totalCostos = totalCostos.add(obrasClient.costoBase(costo));
            }
        }

        BigDecimal pagos = BigDecimal.ZERO;
        List<TransaccionesClient.TransaccionResponse> transacciones = transaccionesClient.obtenerTransaccionesProveedor(proveedorId);
        for (TransaccionesClient.TransaccionResponse tx : transacciones) {
            if (tx == null || tx.monto() == null) continue;
            if (Boolean.FALSE.equals(tx.activo())) continue;
            if (!"PAGO".equalsIgnoreCase(tx.tipo_transaccion())) continue;
            Long obraId = tx.id_obra();
            if (obraId != null && Boolean.FALSE.equals(obraGeneraDeuda.get(obraId))) {
                continue;
            }
            pagos = pagos.add(BigDecimal.valueOf(tx.monto()));
        }

        BigDecimal saldo = saldoPositivo(totalCostos.subtract(pagos));
        return new TotalesProveedor(totalCostos, pagos, saldo);
    }

    private BigDecimal saldoPositivo(BigDecimal valor) {
        if (valor == null) return BigDecimal.ZERO;
        return valor.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : valor;
    }

    public record TotalesProveedor(BigDecimal totalProveedor, BigDecimal pagosRealizados, BigDecimal saldoProveedor) { }
}
