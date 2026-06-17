package proveedores.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import proveedores.integration.ObrasClient;
import proveedores.integration.TransaccionesClient;

import jakarta.annotation.PreDestroy;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProveedorFinanzasService {

    private final ObrasClient obrasClient;
    private final TransaccionesClient transaccionesClient;

    private final ExecutorService ioExecutor = Executors.newFixedThreadPool(
            Math.max(4, Runtime.getRuntime().availableProcessors() * 2));

    @PreDestroy
    public void shutdown() {
        ioExecutor.shutdown();
    }

    /**
     * Calcula totales para un único proveedor. Usar solo en GET /{id}.
     */
    public TotalesProveedor calcularTotales(Long proveedorId) {
        Map<Long, TotalesProveedor> bulk = calcularTotalesBulk(List.of(proveedorId));
        return bulk.getOrDefault(proveedorId, new TotalesProveedor(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
    }

    /**
     * Calcula totales para múltiples proveedores en bulk:
     * - obras: 1 call
     * - costos: 1 call por obra activa (no por proveedor)
     * - transacciones: 1 call por proveedor, en paralelo
     */
    public Map<Long, TotalesProveedor> calcularTotalesBulk(List<Long> proveedorIds) {
        if (proveedorIds == null || proveedorIds.isEmpty()) return Collections.emptyMap();

        // 1. Fetch obras ONCE → construir set de obras que generan deuda
        List<ObrasClient.ObraResumenResponse> obras = obrasClient.obtenerObras();
        Set<Long> obrasConDeuda = obras.stream()
                .filter(o -> o != null && o.id() != null)
                .filter(o -> o.activo() == null || Boolean.TRUE.equals(o.activo()))
                .filter(o -> obrasClient.obraGeneraDeuda(o.obra_estado()))
                .map(ObrasClient.ObraResumenResponse::id)
                .collect(Collectors.toSet());

        // 2. Fetch costos por obra qualifying ONCE → Map<proveedorId, totalCostos>
        Map<Long, BigDecimal> totalCostosByProveedor = new HashMap<>();
        for (ObrasClient.ObraResumenResponse obra : obras) {
            if (obra == null || obra.id() == null) continue;
            if (!obrasConDeuda.contains(obra.id())) continue;
            List<ObrasClient.ObraCostoResponse> costos = obrasClient.obtenerCostos(obra.id());
            for (ObrasClient.ObraCostoResponse costo : costos) {
                if (costo == null || Boolean.FALSE.equals(costo.activo())) continue;
                if (costo.id_proveedor() == null) continue;
                totalCostosByProveedor.merge(
                        costo.id_proveedor(),
                        obrasClient.costoBase(costo),
                        BigDecimal::add
                );
            }
        }

        // 3. Fetch transacciones por proveedor EN PARALELO
        Map<Long, BigDecimal> pagosByProveedor = new ConcurrentHashMap<>();
        List<CompletableFuture<Void>> futures = proveedorIds.stream()
                .map(proveedorId -> CompletableFuture.runAsync(() -> {


                    List<TransaccionesClient.TransaccionResponse> txs =
                            transaccionesClient.obtenerTransaccionesProveedor(proveedorId);
                    BigDecimal pagos = BigDecimal.ZERO;
                    for (TransaccionesClient.TransaccionResponse tx : txs) {
                        if (tx == null || tx.monto() == null) continue;
                        if (Boolean.FALSE.equals(tx.activo())) continue;
                        if (!"PAGO".equalsIgnoreCase(tx.tipo_transaccion())) continue;
                        Long obraId = tx.id_obra();
                        if (obraId != null && !obrasConDeuda.contains(obraId)) continue;
                        pagos = pagos.add(BigDecimal.valueOf(tx.monto()));
                    }
                    pagosByProveedor.put(proveedorId, pagos);
                }, ioExecutor))
                .toList();
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // 4. Armar resultado
        Map<Long, TotalesProveedor> result = new HashMap<>();
        for (Long proveedorId : proveedorIds) {
            BigDecimal costos = totalCostosByProveedor.getOrDefault(proveedorId, BigDecimal.ZERO);
            BigDecimal pagos = pagosByProveedor.getOrDefault(proveedorId, BigDecimal.ZERO);
            result.put(proveedorId, new TotalesProveedor(costos, pagos, saldoPositivo(costos.subtract(pagos))));
        }
        return result;
    }

    private BigDecimal saldoPositivo(BigDecimal valor) {
        if (valor == null) return BigDecimal.ZERO;
        return valor.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : valor;
    }

    public record TotalesProveedor(BigDecimal totalProveedor, BigDecimal pagosRealizados, BigDecimal saldoProveedor) { }
}
