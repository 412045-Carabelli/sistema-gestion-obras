package com.reportes.service;

import com.reportes.client.ClientesClient;
import com.reportes.client.FacturasClient;
import com.reportes.client.ObrasClient;
import com.reportes.client.ProveedoresClient;
import com.reportes.client.TransaccionesClient;
import com.reportes.dto.external.*;
import com.reportes.dto.request.EstadoObraFilterRequest;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.*;
import com.reportes.dto.response.FiltroResponse;
import com.reportes.entity.Comision;
import com.reportes.entity.MovimientoReporte;
import com.reportes.repository.ComisionRepository;
import com.reportes.repository.DeudasGlobalesRepository;
import com.reportes.repository.MovimientoReporteRepository;
import com.reportes.service.pdf.PdfBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportesService {

    private final ObrasClient obrasClient;
    private final TransaccionesClient transaccionesClient;
    private final ClientesClient clientesClient;
    private final ProveedoresClient proveedoresClient;
    private final FacturasClient facturasClient;
    private final ComisionRepository comisionRepository;
    private final MovimientoReporteRepository movimientoReporteRepository;
    private final DeudasGlobalesRepository deudasGlobalesRepository;
    private final PdfBuilder pdfBuilder;

    public DashboardFinancieroResponse generarDashboardFinanciero(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obrasFiltradas = filtrarObrasConDeuda(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obrasFiltradas, ObraExternalDto::getId);

        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);
        transacciones = transacciones.stream()
                .filter(tx -> Boolean.TRUE.equals(tx.getActivo()) || tx.getActivo() == null)
                .filter(tx -> tx.getIdObra() != null && obrasPorId.containsKey(tx.getIdObra()))
                .collect(Collectors.toList());

        BigDecimal ingresos = sumarPorTipo(transacciones, "COBRO");
        BigDecimal egresos = sumarPorTipo(transacciones, "PAGO");

        BigDecimal totalPresupuesto = obrasFiltradas.stream()
                .map(this::presupuestoEfectivo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCostos = BigDecimal.ZERO;
        if (filtros.getClienteId() == null) {
            for (ObraExternalDto obra : obrasFiltradas) {
                List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
                for (ObraCostoExternalDto costo : costos) {
                    if (Boolean.FALSE.equals(costo.getActivo())) continue;
                    if (!costoTieneProveedor(costo)) continue;
                    if (filtros.getProveedorId() != null
                            && !Objects.equals(filtros.getProveedorId(), costo.getIdProveedor())) {
                        continue;
                    }
                    totalCostos = totalCostos.add(costoBase(costo));
                }
            }
        }
        if (filtros.getProveedorId() == null) {
            BigDecimal totalComisiones = obrasFiltradas.stream()
                    .map(this::calcularMontoComision)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            totalCostos = totalCostos.add(totalComisiones);
        }

        DashboardFinancieroResponse response = new DashboardFinancieroResponse();
        response.getFlujo().setIngresos(ingresos);
        response.getFlujo().setEgresos(egresos);
        response.getFlujo().setSaldo(ingresos.subtract(egresos));

        if (filtros.getProveedorId() != null) {
            response.getCtaCte().setLoCobrado(BigDecimal.ZERO);
            response.getCtaCte().setPorCobrar(BigDecimal.ZERO);
            response.getCtaCte().setPagado(egresos);
            response.getCtaCte().setPorPagar(saldoPositivo(totalCostos.subtract(egresos)));
            return response;
        }

        if (filtros.getClienteId() != null) {
            response.getCtaCte().setPagado(BigDecimal.ZERO);
            response.getCtaCte().setPorPagar(BigDecimal.ZERO);
            response.getCtaCte().setLoCobrado(ingresos);
            response.getCtaCte().setPorCobrar(saldoPositivo(totalPresupuesto.subtract(ingresos)));
            return response;
        }

        response.getCtaCte().setLoCobrado(ingresos);
        response.getCtaCte().setPagado(egresos);
        response.getCtaCte().setPorCobrar(saldoPositivo(totalPresupuesto.subtract(ingresos)));
        response.getCtaCte().setPorPagar(saldoPositivo(totalCostos.subtract(egresos)));
        return response;
    }

    public DashboardConsolidadoResponse generarDashboardConsolidado(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obrasFiltradas = filtrarObrasConDeuda(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obrasFiltradas, ObraExternalDto::getId);

        // Transacciones
        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);
        transacciones = transacciones.stream()
                .filter(tx -> Boolean.TRUE.equals(tx.getActivo()) || tx.getActivo() == null)
                .filter(tx -> tx.getIdObra() != null && obrasPorId.containsKey(tx.getIdObra()))
                .collect(Collectors.toList());

        BigDecimal totalCobros = sumarPorTipo(transacciones, "COBRO");
        BigDecimal totalPagos = sumarPorTipo(transacciones, "PAGO");

        // Presupuestos
        BigDecimal totalPresupuesto = obrasFiltradas.stream()
                .map(this::presupuestoEfectivo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Costos
        BigDecimal totalCostos = BigDecimal.ZERO;
        if (filtros.getClienteId() == null) {
            for (ObraExternalDto obra : obrasFiltradas) {
                List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
                for (ObraCostoExternalDto costo : costos) {
                    if (Boolean.FALSE.equals(costo.getActivo())) continue;
                    if (!costoTieneProveedor(costo)) continue;
                    if (filtros.getProveedorId() != null
                            && !Objects.equals(filtros.getProveedorId(), costo.getIdProveedor())) {
                        continue;
                    }
                    totalCostos = totalCostos.add(costoBase(costo));
                }
            }
        }
        if (filtros.getProveedorId() == null) {
            BigDecimal totalComisiones = obrasFiltradas.stream()
                    .map(this::calcularMontoComision)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            totalCostos = totalCostos.add(totalComisiones);
        }

        // Consolidar
        DashboardConsolidadoResponse response = DashboardConsolidadoResponse.builder()
                .totalPresupuesto(totalPresupuesto)
                .totalCostos(totalCostos)
                .porPresupuestar(saldoPositivo(totalPresupuesto.subtract(totalCostos)))
                .totalCobros(totalCobros)
                .totalPagos(totalPagos)
                .saldoFlujo(totalCobros.subtract(totalPagos))
                .porCobrar(saldoPositivo(totalPresupuesto.subtract(totalCobros)))
                .porPagar(saldoPositivo(totalCostos.subtract(totalPagos)))
                .build();

        // Cuenta corriente consolidada
        DashboardConsolidadoResponse.CuentaCorrienteConsolidada ctaCte =
                DashboardConsolidadoResponse.CuentaCorrienteConsolidada.builder()
                        .loCobrado(totalCobros)
                        .porCobrar(saldoPositivo(totalPresupuesto.subtract(totalCobros)))
                        .pagado(totalPagos)
                        .porPagar(saldoPositivo(totalCostos.subtract(totalPagos)))
                        .build();
        response.setCuentaCorriente(ctaCte);

        return response;
    }

    public DeudasGlobalesResponse generarDeudasGlobales(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        DeudasGlobalesResponse response = new DeudasGlobalesResponse();

        // Obtener deudas de clientes (filtrando por proveedor si se especifica)
        List<DeudasGlobalesResponse.DetalleDeudaCliente> detalleClientes = deudasGlobalesRepository.obtenerDeudaClientes(
            filtros.getGrupoId(),
            filtros.getObraId(),
            filtros.getClienteId(),
            filtros.getProveedorId(),
            filtros.getFechaInicio(),
            filtros.getFechaFin()
        );

        // Obtener deudas de proveedores
        // Si se filtra por cliente, traerá solo los proveedores de sus obras
        // Si se filtra por proveedor, traerá solo sus propios costos
        List<DeudasGlobalesResponse.DetalleDeudaProveedor> detalleProveedores = deudasGlobalesRepository.obtenerDeudaProveedores(
            filtros.getGrupoId(),
            filtros.getClienteId(),
            filtros.getObraId(),
            filtros.getProveedorId(),
            filtros.getFechaInicio(),
            filtros.getFechaFin()
        );

        List<Long> obraIdsFiltro = filtros.getObraIds();
        if (obraIdsFiltro != null && !obraIdsFiltro.isEmpty()) {
            detalleClientes = detalleClientes.stream()
                .filter(d -> obraIdsFiltro.contains(d.getObraId()))
                .collect(java.util.stream.Collectors.toList());
            detalleProveedores = detalleProveedores.stream()
                .filter(d -> obraIdsFiltro.contains(d.getObraId()))
                .collect(java.util.stream.Collectors.toList());
        }

        response.setDetalleDeudaClientes(detalleClientes);
        response.setDetalleDeudaProveedores(detalleProveedores);
        response.setDeudaClientes(sumarSaldosClientes(detalleClientes));
        response.setDeudaProveedores(sumarSaldosProveedores(detalleProveedores));
        return response;
    }

    public CuentasCorrientesCombindasResponse generarCuentasCorrientesCombinadas(ReportFilterRequest filtro) {
        // Obtener deudas globales para extraer clientes y proveedores únicos
        DeudasGlobalesResponse deudas = generarDeudasGlobales(filtro);

        List<CuentaCorrientePdfResponse> clientes = new ArrayList<>();
        List<CuentaCorrientePdfResponse> proveedores = new ArrayList<>();

        // Agrupar deudas de clientes por clienteId
        Map<Long, List<DeudasGlobalesResponse.DetalleDeudaCliente>> clientesAgrupados = deudas
                .getDetalleDeudaClientes().stream()
                .collect(Collectors.groupingBy(DeudasGlobalesResponse.DetalleDeudaCliente::getClienteId));

        // Generar PDF para cada cliente
        for (Long clienteId : clientesAgrupados.keySet()) {
            List<Long> obraIds = clientesAgrupados.get(clienteId).stream()
                    .map(DeudasGlobalesResponse.DetalleDeudaCliente::getObraId)
                    .collect(Collectors.toList());
            CuentaCorrientePdfResponse ctaCte = generarCuentaCorrienteClientePdf(clienteId, obraIds);
            clientes.add(ctaCte);
        }

        // Agrupar deudas de proveedores por proveedorId
        Map<Long, List<DeudasGlobalesResponse.DetalleDeudaProveedor>> proveedoresAgrupados = deudas
                .getDetalleDeudaProveedores().stream()
                .collect(Collectors.groupingBy(DeudasGlobalesResponse.DetalleDeudaProveedor::getProveedorId));

        // Generar PDF para cada proveedor
        for (Long proveedorId : proveedoresAgrupados.keySet()) {
            List<Long> obraIds = proveedoresAgrupados.get(proveedorId).stream()
                    .map(DeudasGlobalesResponse.DetalleDeudaProveedor::getObraId)
                    .collect(Collectors.toList());
            CuentaCorrientePdfResponse ctaCte = generarCuentaCorrienteProveedorPdf(proveedorId, obraIds);
            proveedores.add(ctaCte);
        }

        return CuentasCorrientesCombindasResponse.builder()
                .clientes(clientes)
                .proveedores(proveedores)
                .build();
    }

    public IngresosEgresosResponse generarIngresosEgresos(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);

        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);

        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);

        IngresosEgresosResponse response = new IngresosEgresosResponse();
        Map<Long, IngresosEgresosResponse.DetalleObra> detallePorObra = new LinkedHashMap<>();

        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalEgresos = BigDecimal.ZERO;

        for (TransaccionExternalDto tx : transacciones) {
            if (tx.getMonto() == null || Boolean.FALSE.equals(tx.getActivo())) {
                continue;
            }

            BigDecimal monto = BigDecimal.valueOf(tx.getMonto());
            String tipo = tx.getTipoTransaccion() != null ? tx.getTipoTransaccion() : "";

            ObraExternalDto obra = obrasPorId.get(tx.getIdObra());
            if (obra == null) {
                continue;
            }

            IngresosEgresosResponse.DetalleObra detalle = detallePorObra.computeIfAbsent(
                    obra.getId(),
                    id -> {
                        IngresosEgresosResponse.DetalleObra nuevo = new IngresosEgresosResponse.DetalleObra();
                        nuevo.setObraId(id);
                        nuevo.setObraNombre(obra.getNombre());
                        nuevo.setClienteId(obra.getIdCliente());
                        ClienteExternalDto cliente = clientes.get(obra.getIdCliente());
                        nuevo.setClienteNombre(cliente != null ? cliente.getNombre() : null);
                        return nuevo;
                    }
            );

            if ("COBRO".equalsIgnoreCase(tipo)) {
                detalle.setIngresos(detalle.getIngresos().add(monto));
                totalIngresos = totalIngresos.add(monto);
            } else {
                detalle.setEgresos(detalle.getEgresos().add(monto));
                totalEgresos = totalEgresos.add(monto);
            }
        }

        // Cuando filtro por proveedor, sumar costos asociados como egresos (crédito del proveedor)
        if (filtros.getProveedorId() != null) {
            Map<Long, BigDecimal> egresosPorObra = new HashMap<>();
            for (ObraExternalDto obra : obras) {
                List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
                for (ObraCostoExternalDto costo : costos) {
                    if (Boolean.FALSE.equals(costo.getActivo())) continue;
                    if (!Objects.equals(filtros.getProveedorId(), costo.getIdProveedor())) continue;
                    BigDecimal total = costoBase(costo);
                    egresosPorObra.merge(obra.getId(), total, BigDecimal::add);
                    totalEgresos = totalEgresos.add(total);
                }
            }
            egresosPorObra.forEach((obraId, monto) -> {
                ObraExternalDto obra = obrasPorId.get(obraId);
                if (obra == null) return;
                IngresosEgresosResponse.DetalleObra detalle = detallePorObra.computeIfAbsent(
                        obra.getId(),
                        id -> {
                            IngresosEgresosResponse.DetalleObra nuevo = new IngresosEgresosResponse.DetalleObra();
                            nuevo.setObraId(id);
                            nuevo.setObraNombre(obra.getNombre());
                            nuevo.setClienteId(obra.getIdCliente());
                            ClienteExternalDto cliente = clientes.get(obra.getIdCliente());
                            nuevo.setClienteNombre(cliente != null ? cliente.getNombre() : null);
                            return nuevo;
                        }
                );
                detalle.setEgresos(detalle.getEgresos().add(monto));
            });
        }

        response.setDetallePorObra(new ArrayList<>(detallePorObra.values()));
        response.setTotalIngresos(totalIngresos);
        response.setTotalEgresos(totalEgresos);
        return response;
    }

    public EstadoFinancieroObraResponse generarEstadoFinanciero(Long obraId) {
        ObraExternalDto obra = obrasClient.obtenerObra(obraId)
                .orElseThrow(() -> new NoSuchElementException("Obra no encontrada: " + obraId));

        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);
        List<TransaccionExternalDto> transacciones = filtrarTransaccionesPorObra(obraId);
        List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obraId);

        BigDecimal totalCostos = costos.stream()
                .filter(c -> c.getTotal() != null && !Boolean.FALSE.equals(c.getActivo()))
                .map(ObraCostoExternalDto::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cobros = sumarPorTipo(transacciones, "COBRO");
        BigDecimal pagos = sumarPorTipo(transacciones, "PAGO");

        EstadoFinancieroObraResponse response = new EstadoFinancieroObraResponse();
        response.setObraId(obra.getId());
        response.setObraNombre(obra.getNombre());
        response.setClienteId(obra.getIdCliente());
        ClienteExternalDto cliente = clientes.get(obra.getIdCliente());
        response.setClienteNombre(cliente != null ? cliente.getNombre() : null);
        response.setEstadoObra(obra.getObraEstado());
        response.setPresupuesto(presupuestoEfectivo(obra));
        response.setCostos(totalCostos);
        response.setCobros(cobros);
        response.setPagos(pagos);
        response.setUtilidadNeta(cobros.subtract(totalCostos));
        response.setNotas(obra.getNotas());
        return response;
    }

    public FlujoCajaResponse generarFlujoCaja(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);

        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);
        transacciones.sort(Comparator.comparing(TransaccionExternalDto::getFecha,
                Comparator.nullsLast(Comparator.naturalOrder())));

        FlujoCajaResponse response = new FlujoCajaResponse();
        BigDecimal ingresos = BigDecimal.ZERO;
        BigDecimal egresos = BigDecimal.ZERO;

        for (TransaccionExternalDto tx : transacciones) {
            if (tx.getMonto() == null || Boolean.FALSE.equals(tx.getActivo())) {
                continue;
            }

            BigDecimal monto = BigDecimal.valueOf(tx.getMonto());
            String tipo = tx.getTipoTransaccion() != null ? tx.getTipoTransaccion() : "";

            FlujoCajaResponse.Movimiento movimiento = new FlujoCajaResponse.Movimiento();
            movimiento.setTransaccionId(tx.getId());
            movimiento.setFecha(tx.getFecha());
            movimiento.setTipo(tipo);
            movimiento.setMonto(monto);
            movimiento.setFormaPago(tx.getFormaPago());
            movimiento.setDetalle(tx.getMedioPago());
            movimiento.setAsociadoTipo(tx.getTipoAsociado());
            movimiento.setAsociadoId(tx.getIdAsociado());

            ObraExternalDto obra = obrasPorId.get(tx.getIdObra());
            if (obra != null) {
                movimiento.setObraId(obra.getId());
                movimiento.setObraNombre(obra.getNombre());
            }

            if ("COBRO".equalsIgnoreCase(tipo)) {
                ingresos = ingresos.add(monto);
            } else {
                egresos = egresos.add(monto);
            }

            response.getMovimientos().add(movimiento);
        }

        // Si se filtra por proveedor, agregar costos como egresos (crédito del proveedor)
        if (filtros.getProveedorId() != null) {
            for (ObraExternalDto obra : obras) {
                List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
                for (ObraCostoExternalDto costo : costos) {
                    if (Boolean.FALSE.equals(costo.getActivo())) continue;
                    if (!Objects.equals(filtros.getProveedorId(), costo.getIdProveedor())) continue;
                    BigDecimal monto = costoBase(costo);
                    egresos = egresos.add(monto);
                    FlujoCajaResponse.Movimiento mov = new FlujoCajaResponse.Movimiento();
                    mov.setTransaccionId(null);
                    LocalDate fechaInicio = Optional.ofNullable(obra.getFechaInicio())
                            .map(LocalDateTime::toLocalDate)
                            .orElse(null);
                    mov.setFecha(fechaInicio);
                    mov.setTipo("COSTO");
                    mov.setMonto(monto);
                    mov.setFormaPago("PENDIENTE");
                    mov.setDetalle(costo.getDescripcion());
                    mov.setAsociadoTipo("PROVEEDOR");
                    mov.setAsociadoId(filtros.getProveedorId());
                    mov.setObraId(obra.getId());
                    mov.setObraNombre(obra.getNombre());
                    response.getMovimientos().add(mov);
                }
            }
        }

        response.setTotalIngresos(ingresos);
        response.setTotalEgresos(egresos);
        response.setSaldoFinal(ingresos.subtract(egresos));
        return response;
    }

    public PendientesResponse generarPendientes(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obras = filtrarObrasConDeuda(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ProveedorExternalDto> proveedoresPorId = mapearPorId(
            proveedoresClient.obtenerProveedores(),
            ProveedorExternalDto::getId
        );

        // Calcular totales de costos y construir lista de pendientes
        BigDecimal totalCostos = BigDecimal.ZERO;
        PendientesResponse response = new PendientesResponse();

        for (ObraExternalDto obra : obras) {
            List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costos) {
                if (Boolean.FALSE.equals(costo.getActivo())) {
                    continue;
                }
                if (filtros.getProveedorId() != null && !Objects.equals(costo.getIdProveedor(), filtros.getProveedorId())) {
                    continue;
                }
                BigDecimal costoBD = costoBase(costo);
                totalCostos = totalCostos.add(costoBD);

                // Agregar a lista de pendientes
                PendientesResponse.Pendiente pendiente = new PendientesResponse.Pendiente();
                pendiente.setObraId(obra.getId());
                pendiente.setObraNombre(obra.getNombre());
                pendiente.setProveedorId(costo.getIdProveedor());
                ProveedorExternalDto proveedor = proveedoresPorId.get(costo.getIdProveedor());
                pendiente.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);
                pendiente.setDescripcion(costo.getDescripcion());
                pendiente.setTotal(costoBD);
                response.getPendientes().add(pendiente);
            }
        }

        // Calcular totales de pagos (movimientos tipo PAGO)
        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);
        BigDecimal totalPagos = sumarPorTipo(transacciones, "PAGO");

        response.setTotalCostos(totalCostos);
        response.setTotalPagos(totalPagos);
        response.setSaldoPorPagar(saldoPositivo(totalCostos.subtract(totalPagos)));

        return response;
    }

    public EstadoObrasResponse generarEstadoObras(EstadoObraFilterRequest filtro) {
        EstadoObraFilterRequest filtros = filtro != null ? filtro : new EstadoObraFilterRequest();
        List<ObraExternalDto> obras = filtrarObrasPorEstado(filtros);
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);

        EstadoObrasResponse response = new EstadoObrasResponse();
        for (ObraExternalDto obra : obras) {
            EstadoObrasResponse.DetalleEstadoObra detalle = new EstadoObrasResponse.DetalleEstadoObra();
            detalle.setObraId(obra.getId());
            detalle.setObraNombre(obra.getNombre());
            detalle.setEstado(obra.getObraEstado());
            detalle.setClienteId(obra.getIdCliente());
            ClienteExternalDto cliente = clientes.get(obra.getIdCliente());
            detalle.setClienteNombre(cliente != null ? cliente.getNombre() : null);
            detalle.setFechaInicio(obra.getFechaInicio());
            detalle.setFechaFin(obra.getFechaFin());
            detalle.setNotas(obra.getNotas());
            response.getObras().add(detalle);
        }
        return response;
    }

    public AvanceTareasResponse generarAvanceTareas(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        AvanceTareasResponse response = new AvanceTareasResponse();
        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);

        if (filtros.getProveedorId() != null) {
            List<TareaExternalDto> tareasProveedor = obrasClient.obtenerTareasPorProveedor(filtros.getProveedorId());
            Map<Long, List<TareaExternalDto>> tareasPorObra = tareasProveedor.stream()
                    .filter(t -> obrasPorId.containsKey(t.getIdObra()))
                    .collect(Collectors.groupingBy(TareaExternalDto::getIdObra));

            tareasPorObra.forEach((obraId, tareas) -> {
                AvanceTareasResponse.AvanceObra avance = construirAvanceParaTareas(
                        obrasPorId.get(obraId),
                        tareas
                );
                avance.setProveedorId(filtros.getProveedorId());
                response.getAvances().add(avance);
            });
        } else {
            for (ObraExternalDto obra : obras) {
                AvanceTareasResponse.AvanceObra avance = new AvanceTareasResponse.AvanceObra();
                avance.setObraId(obra.getId());
                avance.setObraNombre(obra.getNombre());

                Optional<ProgresoExternalDto> progresoOpt = obrasClient.obtenerProgreso(obra.getId());
                if (progresoOpt.isPresent()) {
                    ProgresoExternalDto progreso = progresoOpt.get();
                    avance.setTotalTareas(progreso.getTotalTareas());
                    avance.setTareasCompletadas(progreso.getTareasCompletadas());
                    avance.setPorcentaje(Optional.ofNullable(progreso.getPorcentaje()).orElse(BigDecimal.ZERO));
                } else {
                    List<TareaExternalDto> tareas = obrasClient.obtenerTareasDeObra(obra.getId());
                    AvanceTareasResponse.AvanceObra calculado = construirAvanceParaTareas(obra, tareas);
                    avance.setTotalTareas(calculado.getTotalTareas());
                    avance.setTareasCompletadas(calculado.getTareasCompletadas());
                    avance.setPorcentaje(calculado.getPorcentaje());
                }

                response.getAvances().add(avance);
            }
        }

        return response;
    }

    public CostosPorCategoriaResponse generarCostosPorCategoria(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ProveedorExternalDto> proveedores = mapearPorId(proveedoresClient.obtenerProveedores(), ProveedorExternalDto::getId);

        Map<String, BigDecimal> acumuladoPorCategoria = new LinkedHashMap<>();
        BigDecimal totalGeneral = BigDecimal.ZERO;

        for (ObraExternalDto obra : obras) {
            List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costos) {
                if (Boolean.FALSE.equals(costo.getActivo())) {
                    continue;
                }
                if (filtros.getProveedorId() != null && !Objects.equals(filtros.getProveedorId(), costo.getIdProveedor())) {
                    continue;
                }
                BigDecimal total = costoBase(costo);
                ProveedorExternalDto proveedor = proveedores.get(costo.getIdProveedor());
                String categoria = proveedor != null && proveedor.getTipoProveedor() != null
                        ? proveedor.getTipoProveedor().getNombre()
                        : "Sin categoría";

                acumuladoPorCategoria.merge(categoria, total, BigDecimal::add);
                totalGeneral = totalGeneral.add(total);
            }
        }

        CostosPorCategoriaResponse response = new CostosPorCategoriaResponse();
        response.setTotal(totalGeneral);

        for (Map.Entry<String, BigDecimal> entry : acumuladoPorCategoria.entrySet()) {
            CostosPorCategoriaResponse.CategoriaCosto categoria = new CostosPorCategoriaResponse.CategoriaCosto();
            categoria.setCategoria(entry.getKey());
            categoria.setTotal(entry.getValue());
            if (totalGeneral.compareTo(BigDecimal.ZERO) > 0) {
                categoria.setPorcentaje(
                        entry.getValue()
                                .divide(totalGeneral, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                );
            }
            response.getCategorias().add(categoria);
        }

        return response;
    }

    public ResumenGeneralResponse generarResumenGeneral() {
        List<ObraExternalDto> obras = obrasClient.obtenerObras();
        List<ClienteExternalDto> clientes = clientesClient.obtenerClientes();
        List<ProveedorExternalDto> proveedores = proveedoresClient.obtenerProveedores();
        List<TransaccionExternalDto> transacciones = obtenerTransaccionesActivas();

        ResumenGeneralResponse response = new ResumenGeneralResponse();
        response.setTotalObras(obras.size());
        response.setTotalClientes(clientes.size());
        response.setTotalProveedores(proveedores.size());
        response.setTotalIngresos(sumarPorTipo(transacciones, "COBRO"));
        response.setTotalEgresos(sumarPorTipo(transacciones, "PAGO"));
        return response;
    }

    public CuentaCorrienteObraResponse generarCuentaCorrientePorObra(Long obraId) {
        ObraExternalDto obra = obrasClient.obtenerObra(obraId)
                .orElseThrow(() -> new NoSuchElementException("Obra no encontrada: " + obraId));
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);

        List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obraId);
        List<TransaccionExternalDto> transacciones = filtrarTransaccionesPorObra(obraId);

        BigDecimal totalCostos = costos.stream()
                .filter(c -> Boolean.TRUE.equals(c.getActivo()) || c.getActivo() == null)
                .map(c -> Optional.ofNullable(c.getTotal()).orElse(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal comisionPendiente = calcularComisionPendiente(obra);
        if (comisionPendiente.compareTo(BigDecimal.ZERO) > 0) {
            totalCostos = totalCostos.add(comisionPendiente);
        }

        BigDecimal pagosRecibidos = transacciones.stream()
                .filter(tx -> "COBRO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .map(tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CuentaCorrienteObraResponse response = new CuentaCorrienteObraResponse();
        response.setObraId(obra.getId());
        response.setObraNombre(obra.getNombre());
        response.setClienteId(obra.getIdCliente());
        ClienteExternalDto cliente = clientes.get(obra.getIdCliente());
        response.setClienteNombre(cliente != null ? cliente.getNombre() : null);
        response.setPresupuestado(presupuestoEfectivo(obra));
        response.setCostoTotal(totalCostos);
        response.setPagosRecibidos(pagosRecibidos);
        response.setSaldoPendiente(saldoPositivo(response.getPresupuestado().subtract(pagosRecibidos)));

        List<CuentaCorrienteObraResponse.Movimiento> movimientos = new ArrayList<>();

        for (ObraCostoExternalDto costo : costos) {
            if (Boolean.FALSE.equals(costo.getActivo())) continue;
            CuentaCorrienteObraResponse.Movimiento mov = new CuentaCorrienteObraResponse.Movimiento();
            mov.setTipo("COSTO");
            mov.setMonto(Optional.ofNullable(costo.getTotal()).orElse(BigDecimal.ZERO));
            mov.setReferencia(costo.getDescripcion());
            mov.setFecha(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : null);
            movimientos.add(mov);
        }

        if (comisionPendiente.compareTo(BigDecimal.ZERO) > 0) {
            CuentaCorrienteObraResponse.Movimiento mov = new CuentaCorrienteObraResponse.Movimiento();
            mov.setTipo("COSTO");
            mov.setMonto(comisionPendiente);
            mov.setReferencia("Comision pendiente");
            mov.setFecha(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : LocalDate.now());
            movimientos.add(mov);
        }

        transacciones.stream()
                .filter(tx -> "COBRO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .forEach(tx -> {
                    CuentaCorrienteObraResponse.Movimiento mov = new CuentaCorrienteObraResponse.Movimiento();
                    mov.setTipo("COBRO");
                    mov.setMonto(BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)));
                    mov.setReferencia("Transaccion " + tx.getId());
                    mov.setFecha(tx.getFecha());
                    mov.setAsociadoTipo(tx.getTipoAsociado());
                    mov.setAsociadoId(tx.getIdAsociado());
                    movimientos.add(mov);
                });

        movimientos.sort(Comparator.comparing(
                m -> Optional.ofNullable(m.getFecha()).orElse(LocalDate.MAX)
        ));

        BigDecimal cobrosAcum = BigDecimal.ZERO;
        BigDecimal costosAcum = BigDecimal.ZERO;

        for (CuentaCorrienteObraResponse.Movimiento mov : movimientos) {
            if ("COBRO".equalsIgnoreCase(mov.getTipo())) {
                cobrosAcum = cobrosAcum.add(mov.getMonto());
            } else {
                costosAcum = costosAcum.add(mov.getMonto());
            }
            mov.setCobrosAcumulados(cobrosAcum);
            mov.setCostosAcumulados(costosAcum);
            mov.setSaldoCliente(saldoPositivo(cobrosAcum.subtract(costosAcum)));
            response.getMovimientos().add(mov);
            guardarMovimiento("CTA_CTE_OBRA", mov.getMonto(), mov.getReferencia());
        }

        return response;
    }

    public CuentaCorrienteProveedorResponse generarCuentaCorrientePorProveedor(Long proveedorId) {
        List<ObraExternalDto> obras = obrasClient.obtenerObras();
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ProveedorExternalDto> proveedores = mapearPorId(proveedoresClient.obtenerProveedores(), ProveedorExternalDto::getId);
        Set<Long> obrasConDeuda = obras.stream()
                .filter(obra -> estadoGeneraSaldoProveedor(obra.getObraEstado()))
                .map(ObraExternalDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        BigDecimal costos = BigDecimal.ZERO;
        BigDecimal pagosAcum = BigDecimal.ZERO;
        CuentaCorrienteProveedorResponse response = new CuentaCorrienteProveedorResponse();
        response.setProveedorId(proveedorId);
        ProveedorExternalDto proveedor = proveedores.get(proveedorId);
        response.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);

        List<CuentaCorrienteProveedorResponse.Movimiento> movimientos = new ArrayList<>();

        for (ObraExternalDto obra : obras) {
            if (!obrasConDeuda.contains(obra.getId())) {
                continue;
            }
            List<ObraCostoExternalDto> costosObra = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costosObra) {
                if (!Objects.equals(proveedorId, costo.getIdProveedor()) || Boolean.FALSE.equals(costo.getActivo())) {
                    continue;
                }
                BigDecimal total = costoBase(costo);
                costos = costos.add(total);
                CuentaCorrienteProveedorResponse.Movimiento movimiento = new CuentaCorrienteProveedorResponse.Movimiento();
                movimiento.setTipo("COSTO");
                movimiento.setMonto(total);
                movimiento.setObraId(obra.getId());
                movimiento.setObraNombre(obra.getNombre());
                String estado = obra.getObraEstado();
                if (estado == null || estado.isEmpty()) {
                    estado = obrasClient.obtenerObra(obra.getId())
                            .map(ObraExternalDto::getObraEstado)
                            .orElse(null);
                }
                movimiento.setObraEstado(estado);
                movimiento.setProveedorId(proveedorId);
                movimiento.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);
                movimiento.setConcepto(costo.getDescripcion());
                movimiento.setFecha(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : null);
                movimientos.add(movimiento);
                guardarMovimiento("COSTO_PROVEEDOR", total, obra.getNombre());
            }
        }

        BigDecimal pagos = obtenerTransaccionesActivas().stream()
                .filter(tx -> Objects.equals(tx.getIdAsociado(), proveedorId))
                .filter(tx -> "PROVEEDOR".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse("")))
                .filter(tx -> "PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .filter(tx -> {
                    Long obraId = tx.getIdObra();
                    return obraId == null || obrasConDeuda.contains(obraId);
                })
                .map(tx -> {
                    CuentaCorrienteProveedorResponse.Movimiento movimiento = new CuentaCorrienteProveedorResponse.Movimiento();
                    movimiento.setTipo("PAGO");
                    movimiento.setMonto(BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)));
                    ObraExternalDto obra = obrasPorId.get(tx.getIdObra());
                    movimiento.setObraId(tx.getIdObra());
                    movimiento.setObraNombre(obra != null ? obra.getNombre() : null);
                    String estado = obra != null ? obra.getObraEstado() : null;
                    if ((estado == null || estado.isEmpty()) && tx.getIdObra() != null) {
                        estado = obrasClient.obtenerObra(tx.getIdObra())
                                .map(ObraExternalDto::getObraEstado)
                                .orElse(null);
                    }
                    movimiento.setObraEstado(estado);
                    movimiento.setProveedorId(proveedorId);
                    movimiento.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);
                    movimiento.setConcepto("Pago " + (tx.getId() != null ? tx.getId() : ""));
                    movimiento.setFecha(tx.getFecha());
                    movimientos.add(movimiento);
                    guardarMovimiento("PAGO_PROVEEDOR", movimiento.getMonto(), movimiento.getObraNombre());
                    return movimiento.getMonto();
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Recalcular movimientos ordenados y saldos acumulados
        movimientos.addAll(response.getMovimientos());
        movimientos.sort(Comparator.comparing(
                m -> Optional.ofNullable(m.getFecha()).orElse(LocalDate.MAX)
        ));

        // Calcular saldo neto por obra para filtrar obras con saldo = 0
        Map<Long, BigDecimal> saldoPorObra = new HashMap<>();
        for (CuentaCorrienteProveedorResponse.Movimiento mov : movimientos) {
            Long obraId = mov.getObraId();
            if (obraId != null) {
                BigDecimal saldo = saldoPorObra.getOrDefault(obraId, BigDecimal.ZERO);
                if ("COSTO".equalsIgnoreCase(mov.getTipo())) {
                    saldo = saldo.add(mov.getMonto());
                } else {
                    saldo = saldo.subtract(mov.getMonto());
                }
                saldoPorObra.put(obraId, saldo);
            }
        }

        // Filtrar movimientos: solo mantener los de obras con saldo != 0
        Set<Long> obrasConSaldo = saldoPorObra.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) != 0)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        List<CuentaCorrienteProveedorResponse.Movimiento> movimientosFiltrados = movimientos.stream()
                .filter(mov -> {
                    Long obraId = mov.getObraId();
                    return obraId != null && obrasConSaldo.contains(obraId);
                })
                .collect(Collectors.toList());

        // Recalcular acumulados solo con movimientos filtrados
        BigDecimal costosAcum = BigDecimal.ZERO;
        BigDecimal pagosAcumReCalculados = BigDecimal.ZERO;
        for (CuentaCorrienteProveedorResponse.Movimiento mov : movimientosFiltrados) {
            if ("COSTO".equalsIgnoreCase(mov.getTipo())) {
                costosAcum = costosAcum.add(mov.getMonto());
            } else {
                pagosAcumReCalculados = pagosAcumReCalculados.add(mov.getMonto());
            }
            mov.setCostosAcumulados(costosAcum);
            mov.setPagosAcumulados(pagosAcumReCalculados);
            mov.setSaldoProveedor(saldoPositivo(costosAcum.subtract(pagosAcumReCalculados)));
        }
        response.setMovimientos(movimientosFiltrados);

        response.setCostos(costos);
        response.setPagos(pagos);
        response.setSaldo(saldoPositivo(costos.subtract(pagos)));
        CuentaCorrienteProveedorResponse.ResumenProveedor resumen = new CuentaCorrienteProveedorResponse.ResumenProveedor();
        resumen.setProveedorId(proveedorId);
        resumen.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);
        resumen.setPresupuestado(response.getCostos());
        resumen.setPagos(response.getPagos());
        resumen.setSaldo(response.getSaldo());
        if (tieneSaldoSignificativo(resumen.getSaldo())) {
            response.getResumenProveedores().add(resumen);
        }
        return response;
    }

    public SaldosClienteResponse generarSaldosCliente(Long clienteId) {
        SaldosClienteResponse response = new SaldosClienteResponse();
        response.setClienteId(clienteId);

        // Obtener cliente
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);
        ClienteExternalDto cliente = clientes.get(clienteId);
        if (cliente != null) {
            response.setClienteNombre(cliente.getNombre());
        }

        // Filtrar obras del cliente con deuda
        ReportFilterRequest filtro = new ReportFilterRequest();
        filtro.setClienteId(clienteId);
        List<ObraExternalDto> obras = filtrarObrasConDeuda(filtro);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);

        // Obtener cobros agrupados por obra
        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtro, obrasPorId);
        Map<Long, BigDecimal> cobrosPorObra = transacciones.stream()
                .filter(tx -> tx.getIdObra() != null)
                .filter(tx -> "COBRO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .collect(Collectors.groupingBy(
                        TransaccionExternalDto::getIdObra,
                        Collectors.mapping(
                                tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        // Construir lista de obras con saldos
        BigDecimal totalPresupuestado = BigDecimal.ZERO;
        BigDecimal totalCobrado = BigDecimal.ZERO;

        for (ObraExternalDto obra : obras) {
            BigDecimal presupuestado = presupuestoEfectivo(obra);
            BigDecimal cobrado = cobrosPorObra.getOrDefault(obra.getId(), BigDecimal.ZERO);
            BigDecimal saldo = saldoPositivo(presupuestado.subtract(cobrado));

            if (presupuestado.compareTo(BigDecimal.ZERO) > 0 || cobrado.compareTo(BigDecimal.ZERO) > 0) {
                SaldosClienteResponse.ObraSaldo obraSaldo = new SaldosClienteResponse.ObraSaldo();
                obraSaldo.setObraId(obra.getId());
                obraSaldo.setNombre(obra.getNombre());
                obraSaldo.setEstado(obra.getObraEstado());
                obraSaldo.setPresupuestado(presupuestado);
                obraSaldo.setCobrado(cobrado);
                obraSaldo.setSaldo(saldo);
                response.getObras().add(obraSaldo);

                totalPresupuestado = totalPresupuestado.add(presupuestado);
                totalCobrado = totalCobrado.add(cobrado);
            }
        }

        response.setTotalPresupuestado(totalPresupuestado);
        response.setTotalCobrado(totalCobrado);
        response.setSaldo(saldoPositivo(totalPresupuestado.subtract(totalCobrado)));

        return response;
    }

    public SaldosProveedorResponse generarSaldosProveedor(Long proveedorId) {
        SaldosProveedorResponse response = new SaldosProveedorResponse();
        response.setProveedorId(proveedorId);

        // Obtener proveedor
        Map<Long, ProveedorExternalDto> proveedores = mapearPorId(proveedoresClient.obtenerProveedores(), ProveedorExternalDto::getId);
        ProveedorExternalDto proveedor = proveedores.get(proveedorId);
        if (proveedor != null) {
            response.setProveedorNombre(proveedor.getNombre());
        }

        // Filtrar obras con deuda de proveedor
        List<ObraExternalDto> todasObras = obrasClient.obtenerObras();
        Set<Long> obrasConDeuda = todasObras.stream()
                .filter(obra -> estadoGeneraSaldoProveedor(obra.getObraEstado()))
                .map(ObraExternalDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Obtener costos del proveedor por obra
        Map<Long, BigDecimal> costosPorObra = new HashMap<>();
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(todasObras, ObraExternalDto::getId);

        for (ObraExternalDto obra : todasObras) {
            if (!obrasConDeuda.contains(obra.getId())) continue;
            List<ObraCostoExternalDto> costosObra = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costosObra) {
                if (!Objects.equals(proveedorId, costo.getIdProveedor()) || Boolean.FALSE.equals(costo.getActivo())) {
                    continue;
                }
                BigDecimal total = costoBase(costo);
                costosPorObra.merge(obra.getId(), total, BigDecimal::add);
            }
        }

        // Obtener pagos del proveedor por obra
        Map<Long, BigDecimal> pagosPorObra = obtenerTransaccionesActivas().stream()
                .filter(tx -> Objects.equals(tx.getIdAsociado(), proveedorId))
                .filter(tx -> "PROVEEDOR".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse("")))
                .filter(tx -> "PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .filter(tx -> tx.getIdObra() != null && obrasConDeuda.contains(tx.getIdObra()))
                .collect(Collectors.groupingBy(
                        TransaccionExternalDto::getIdObra,
                        Collectors.mapping(
                                tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        // Construir lista de obras con saldos
        BigDecimal totalCostos = BigDecimal.ZERO;
        BigDecimal totalPagado = BigDecimal.ZERO;

        for (Map.Entry<Long, BigDecimal> entry : costosPorObra.entrySet()) {
            Long obraId = entry.getKey();
            BigDecimal costos = entry.getValue();
            BigDecimal pagado = pagosPorObra.getOrDefault(obraId, BigDecimal.ZERO);
            BigDecimal saldo = saldoPositivo(costos.subtract(pagado));

            ObraExternalDto obra = obrasPorId.get(obraId);
            if (obra != null && (costos.compareTo(BigDecimal.ZERO) > 0 || pagado.compareTo(BigDecimal.ZERO) > 0)) {
                SaldosProveedorResponse.ObraSaldo obraSaldo = new SaldosProveedorResponse.ObraSaldo();
                obraSaldo.setObraId(obraId);
                obraSaldo.setNombre(obra.getNombre());
                obraSaldo.setEstado(obra.getObraEstado());
                obraSaldo.setPresupuestado(costos);
                obraSaldo.setPagado(pagado);
                obraSaldo.setSaldo(saldo);
                response.getObras().add(obraSaldo);

                totalCostos = totalCostos.add(costos);
                totalPagado = totalPagado.add(pagado);
            }
        }

        response.setTotalCostos(totalCostos);
        response.setTotalPagado(totalPagado);
        response.setSaldo(saldoPositivo(totalCostos.subtract(totalPagado)));

        return response;
    }

    public List<CuentaCorrienteProveedorResponse> generarCuentaCorrienteProveedores() {
        return generarCuentaCorrienteProveedores(null);
    }

    public List<CuentaCorrienteProveedorResponse> generarCuentaCorrienteProveedores(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        List<ProveedorExternalDto> proveedores = proveedoresClient.obtenerProveedores();

        Map<Long, CuentaCorrienteProveedorResponse> respuestaPorProveedor = new LinkedHashMap<>();
        for (ProveedorExternalDto proveedor : proveedores) {
            CuentaCorrienteProveedorResponse resp = new CuentaCorrienteProveedorResponse();
            resp.setProveedorId(proveedor.getId());
            resp.setProveedorNombre(proveedor.getNombre());
            resp.setCostos(BigDecimal.ZERO);
            resp.setPagos(BigDecimal.ZERO);
            resp.setSaldo(BigDecimal.ZERO);
            resp.setMovimientos(new ArrayList<>());
            respuestaPorProveedor.put(proveedor.getId(), resp);
        }

        Set<Long> obrasConDeuda = obras.stream()
                .filter(obra -> estadoGeneraSaldoProveedor(obra.getObraEstado()))
                .map(ObraExternalDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (ObraExternalDto obra : obras) {
            if (!obrasConDeuda.contains(obra.getId())) continue;
            List<ObraCostoExternalDto> costosObra = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costosObra) {
                if (Boolean.FALSE.equals(costo.getActivo())) continue;
                Long proveedorId = costo.getIdProveedor();
                if (proveedorId == null) continue;
                if (filtros.getProveedorId() != null && !Objects.equals(filtros.getProveedorId(), proveedorId)) {
                    continue;
                }
                CuentaCorrienteProveedorResponse resp = respuestaPorProveedor.get(proveedorId);
                if (resp == null) continue;

                BigDecimal total = costoBase(costo);
                resp.setCostos(resp.getCostos().add(total));

                CuentaCorrienteProveedorResponse.Movimiento movimiento = new CuentaCorrienteProveedorResponse.Movimiento();
                movimiento.setTipo("COSTO");
                movimiento.setMonto(total);
                movimiento.setObraId(obra.getId());
                movimiento.setObraNombre(obra.getNombre());
                movimiento.setProveedorId(proveedorId);
                movimiento.setProveedorNombre(resp.getProveedorNombre());
                movimiento.setConcepto(costo.getDescripcion());
                movimiento.setFecha(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : null);
                resp.getMovimientos().add(movimiento);
                guardarMovimiento("COSTO_PROVEEDOR", total, obra.getNombre());
            }
        }

        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);
        for (TransaccionExternalDto tx : transacciones) {
            if (!"PROVEEDOR".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse(""))) continue;
            if (!"PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse(""))) continue;
            Long proveedorId = tx.getIdAsociado();
            if (proveedorId == null) continue;
            Long obraId = tx.getIdObra();
            if (obraId != null && !obrasConDeuda.contains(obraId)) continue;

            CuentaCorrienteProveedorResponse resp = respuestaPorProveedor.get(proveedorId);
            if (resp == null) continue;

            BigDecimal monto = BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d));
            resp.setPagos(resp.getPagos().add(monto));

            CuentaCorrienteProveedorResponse.Movimiento movimiento = new CuentaCorrienteProveedorResponse.Movimiento();
            movimiento.setTipo("PAGO");
            movimiento.setMonto(monto);
            ObraExternalDto obra = obraId != null ? obrasPorId.get(obraId) : null;
            movimiento.setObraId(obraId);
            movimiento.setObraNombre(obra != null ? obra.getNombre() : null);
            movimiento.setProveedorId(proveedorId);
            movimiento.setProveedorNombre(resp.getProveedorNombre());
            movimiento.setConcepto("Pago " + (tx.getId() != null ? tx.getId() : ""));
            movimiento.setFecha(tx.getFecha());
            resp.getMovimientos().add(movimiento);
            guardarMovimiento("PAGO_PROVEEDOR", movimiento.getMonto(), movimiento.getObraNombre());
        }

        for (CuentaCorrienteProveedorResponse resp : respuestaPorProveedor.values()) {
            List<CuentaCorrienteProveedorResponse.Movimiento> movimientos = resp.getMovimientos();
            movimientos.sort(Comparator.comparing(
                    m -> Optional.ofNullable(m.getFecha()).orElse(LocalDate.MAX)
            ));

            BigDecimal costosAcum = BigDecimal.ZERO;
            BigDecimal pagosAcum = BigDecimal.ZERO;
            for (CuentaCorrienteProveedorResponse.Movimiento mov : movimientos) {
                if ("COSTO".equalsIgnoreCase(mov.getTipo())) {
                    costosAcum = costosAcum.add(mov.getMonto());
                } else {
                    pagosAcum = pagosAcum.add(mov.getMonto());
                }
                mov.setCostosAcumulados(costosAcum);
                mov.setPagosAcumulados(pagosAcum);
                mov.setSaldoProveedor(saldoPositivo(costosAcum.subtract(pagosAcum)));
            }

            resp.setSaldo(saldoPositivo(resp.getCostos().subtract(resp.getPagos())));
            if (tieneSaldoSignificativo(resp.getSaldo())) {
                CuentaCorrienteProveedorResponse.ResumenProveedor resumen = new CuentaCorrienteProveedorResponse.ResumenProveedor();
                resumen.setProveedorId(resp.getProveedorId());
                resumen.setProveedorNombre(resp.getProveedorNombre());
                resumen.setPresupuestado(resp.getCostos());
                resumen.setPagos(resp.getPagos());
                resumen.setSaldo(resp.getSaldo());
                resp.getResumenProveedores().add(resumen);
            }
        }

        return new ArrayList<>(respuestaPorProveedor.values());
    }

    public CuentaCorrienteProveedorResponse generarCuentaCorrienteProveedorGlobal(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<CuentaCorrienteProveedorResponse> proveedores = generarCuentaCorrienteProveedores(filtros);

        CuentaCorrienteProveedorResponse response = new CuentaCorrienteProveedorResponse();
        response.setProveedorId(null);
        response.setProveedorNombre("Todos los proveedores");

        List<CuentaCorrienteProveedorResponse.Movimiento> movimientos = proveedores.stream()
                .flatMap(p -> p.getMovimientos().stream())
                .collect(Collectors.toList());

        movimientos.sort(Comparator.comparing(
                m -> Optional.ofNullable(m.getFecha()).orElse(LocalDate.MAX)
        ));

        BigDecimal totalCostos = movimientos.stream()
                .filter(m -> "COSTO".equalsIgnoreCase(m.getTipo()))
                .map(CuentaCorrienteProveedorResponse.Movimiento::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPagos = movimientos.stream()
                .filter(m -> "PAGO".equalsIgnoreCase(m.getTipo()))
                .map(CuentaCorrienteProveedorResponse.Movimiento::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        response.setCostos(totalCostos);
        response.setPagos(totalPagos);
        response.setSaldo(saldoPositivo(totalCostos.subtract(totalPagos)));
        response.setMovimientos(movimientos);
        response.setResumenProveedores(construirResumenProveedores(filtros));
        return response;
    }

    public CuentaCorrienteObraResponse generarCuentaCorrienteObraGlobal(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        FlujoCajaResponse flujo = generarFlujoCaja(filtros);
        List<FlujoCajaResponse.Movimiento> movimientos = flujo.getMovimientos() != null
                ? flujo.getMovimientos()
                : new ArrayList<>();

        // Incluir comisiones pendientes como costo en el global
        List<ObraExternalDto> obrasConDeuda = filtrarObrasConDeuda(filtros);
        for (ObraExternalDto obra : obrasConDeuda) {
            BigDecimal comisionPendiente = calcularComisionPendiente(obra);
            if (comisionPendiente.compareTo(BigDecimal.ZERO) <= 0) continue;
            FlujoCajaResponse.Movimiento mov = new FlujoCajaResponse.Movimiento();
            mov.setTipo("COSTO");
            mov.setMonto(comisionPendiente);
            mov.setDetalle("Comision pendiente");
            mov.setObraId(obra.getId());
            mov.setObraNombre(obra.getNombre());
            mov.setFecha(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : LocalDate.now());
            movimientos.add(mov);
        }

        BigDecimal totalIngresos = movimientos.stream()
                .filter(m -> "COBRO".equalsIgnoreCase(m.getTipo()))
                .map(FlujoCajaResponse.Movimiento::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalEgresos = movimientos.stream()
                .filter(m -> {
                    String tipo = Optional.ofNullable(m.getTipo()).orElse("");
                    return "PAGO".equalsIgnoreCase(tipo) || "COSTO".equalsIgnoreCase(tipo);
                })
                .map(FlujoCajaResponse.Movimiento::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CuentaCorrienteObraResponse response = new CuentaCorrienteObraResponse();
        response.setObraId(null);
        response.setObraNombre("Todas las obras");
        response.setPresupuestado(obrasConDeuda.stream()
                .map(this::presupuestoEfectivo)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        response.setCostoTotal(totalEgresos);
        response.setPagosRecibidos(totalIngresos);
        response.setSaldoPendiente(saldoPositivo(response.getPresupuestado().subtract(totalIngresos)));

        for (FlujoCajaResponse.Movimiento mov : movimientos) {
            CuentaCorrienteObraResponse.Movimiento detalle = new CuentaCorrienteObraResponse.Movimiento();
            detalle.setFecha(mov.getFecha());
            detalle.setTipo(mov.getTipo());
            detalle.setMonto(mov.getMonto());
            detalle.setReferencia(mov.getDetalle());
            detalle.setObraId(mov.getObraId());
            detalle.setObraNombre(mov.getObraNombre());
            detalle.setAsociadoTipo(mov.getAsociadoTipo());
            detalle.setAsociadoId(mov.getAsociadoId());
            response.getMovimientos().add(detalle);
        }

        return response;
    }

    public CuentaCorrienteClienteResponse generarCuentaCorrienteCliente(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obrasConDeuda = filtrarObrasConDeuda(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obrasConDeuda, ObraExternalDto::getId);
        BigDecimal totalCostos = obrasConDeuda.stream()
                .map(this::presupuestoEfectivo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);
        List<TransaccionExternalDto> cobros = transacciones.stream()
                .filter(tx -> "COBRO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .sorted(Comparator.comparing(TransaccionExternalDto::getFecha, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        BigDecimal totalCobros = cobros.stream()
                .map(tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CuentaCorrienteClienteResponse response = new CuentaCorrienteClienteResponse();
        response.setClienteId(filtros.getClienteId());
        if (filtros.getClienteId() != null) {
            Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);
            ClienteExternalDto cliente = clientes.get(filtros.getClienteId());
            response.setClienteNombre(cliente != null ? cliente.getNombre() : null);
        } else {
            response.setClienteNombre("Todos los clientes");
        }

        response.setTotalCobros(totalCobros);
        response.setTotalCostos(totalCostos);
        response.setSaldoFinal(saldoPositivo(totalCostos.subtract(totalCobros)));
        response.setResumenClientes(construirResumenClientes(filtros));

        List<CuentaCorrienteClienteResponse.Movimiento> movimientos = new ArrayList<>();
        BigDecimal cobrosAcum = BigDecimal.ZERO;
        for (TransaccionExternalDto tx : cobros) {
            CuentaCorrienteClienteResponse.Movimiento mov = new CuentaCorrienteClienteResponse.Movimiento();
            mov.setFecha(tx.getFecha());
            mov.setTipo("COBRO");
            mov.setMonto(BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)));
            mov.setReferencia("Transaccion " + tx.getId());
            mov.setObraId(tx.getIdObra());
            ObraExternalDto obra = obrasPorId.get(tx.getIdObra());
            mov.setObraNombre(obra != null ? obra.getNombre() : null);
            mov.setAsociadoTipo(tx.getTipoAsociado());
            mov.setAsociadoId(tx.getIdAsociado());
            cobrosAcum = cobrosAcum.add(mov.getMonto());
            mov.setCobrosAcumulados(cobrosAcum);
            mov.setCostosAcumulados(totalCostos);
            mov.setSaldoCliente(saldoPositivo(totalCostos.subtract(cobrosAcum)));
            movimientos.add(mov);
        }

        response.setMovimientos(movimientos);
        return response;
    }
    public ComisionesResponse generarComisionesPorObra(Long obraId) {
        ComisionesResponse response = new ComisionesResponse();
        ObraExternalDto obra = obrasClient.obtenerObra(obraId).orElse(null);
        List<Comision> comisiones = comisionRepository.findByIdObra(obraId);

        BigDecimal totalPagos = BigDecimal.ZERO;
        BigDecimal totalComisiones = BigDecimal.ZERO;
        BigDecimal pagosComision = obtenerPagosComisionPorObra(obraId);
        BigDecimal pagosRestantes = pagosComision;

        for (Comision comision : comisiones) {
            ComisionesResponse.Detalle detalle = new ComisionesResponse.Detalle();
            detalle.setObraId(obraId);
            detalle.setObraNombre(obra != null ? obra.getNombre() : null);
            detalle.setMonto(Optional.ofNullable(comision.getMonto()).orElse(BigDecimal.ZERO));
            detalle.setFecha(comision.getFecha());
            BigDecimal pagosDetalle = pagosRestantes.min(detalle.getMonto());
            detalle.setPagos(pagosDetalle);
            detalle.setSaldo(saldoPositivo(detalle.getMonto().subtract(detalle.getPagos())));
            response.getDetalle().add(detalle);

            totalComisiones = totalComisiones.add(detalle.getMonto());
            totalPagos = totalPagos.add(pagosDetalle);
            pagosRestantes = pagosRestantes.subtract(pagosDetalle);
            guardarMovimiento("COMISION_OBRA", detalle.getMonto(), "Obra " + obraId);
        }

        // Fallback: calcular comisiÃ³n a partir de la obra cuando no existen registros en la tabla
        if (comisiones.isEmpty()
                && obra != null
                && Boolean.TRUE.equals(obra.getTieneComision())) {
            BigDecimal monto = calcularMontoComision(obra);
            if (monto.compareTo(BigDecimal.ZERO) > 0) {
                ComisionesResponse.Detalle detalle = new ComisionesResponse.Detalle();
                detalle.setObraId(obraId);
                detalle.setObraNombre(obra.getNombre());
                detalle.setMonto(monto);
                BigDecimal pagosDetalle = pagosComision.min(monto);
                detalle.setPagos(pagosDetalle);
                detalle.setSaldo(saldoPositivo(monto.subtract(pagosDetalle)));
                response.getDetalle().add(detalle);
                totalComisiones = totalComisiones.add(monto);
                totalPagos = totalPagos.add(pagosDetalle);
            }
        }

        response.setTotalComision(totalComisiones);
        response.setTotalPagos(totalPagos);
        response.setSaldo(saldoPositivo(totalComisiones.subtract(totalPagos)));
        return response;
    }

    public ComisionesResponse generarComisionesGeneral() {
        ComisionesResponse response = new ComisionesResponse();
        List<Comision> comisiones = comisionRepository.findAll();
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obrasClient.obtenerObras(), ObraExternalDto::getId);
        Set<Long> obrasValidas = obrasPorId.values().stream()
                .filter(obra -> estadoGeneraDeuda(obra.getObraEstado()))
                .map(ObraExternalDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal pagos = BigDecimal.ZERO;
        Set<Long> obrasConComisionRegistrada = new HashSet<>();
        Map<Long, BigDecimal> pagosPorObra = obtenerPagosComisionPorObra();
        Map<Long, BigDecimal> pagosRestantes = new HashMap<>(pagosPorObra);

        for (Comision comision : comisiones) {
            if (!obrasValidas.contains(comision.getIdObra())) {
                continue;
            }
            obrasConComisionRegistrada.add(comision.getIdObra());
            ComisionesResponse.Detalle detalle = new ComisionesResponse.Detalle();
            detalle.setObraId(comision.getIdObra());
            ObraExternalDto obra = obrasPorId.get(comision.getIdObra());
            detalle.setObraNombre(obra != null ? obra.getNombre() : null);
            detalle.setMonto(Optional.ofNullable(comision.getMonto()).orElse(BigDecimal.ZERO));
            detalle.setFecha(comision.getFecha());
            BigDecimal pagosDetalle = pagosRestantes
                    .getOrDefault(comision.getIdObra(), BigDecimal.ZERO)
                    .min(detalle.getMonto());
            detalle.setPagos(pagosDetalle);
            detalle.setSaldo(saldoPositivo(detalle.getMonto().subtract(detalle.getPagos())));
            response.getDetalle().add(detalle);
            total = total.add(detalle.getMonto());
            pagos = pagos.add(pagosDetalle);
            pagosRestantes.put(comision.getIdObra(), pagosRestantes.getOrDefault(comision.getIdObra(), BigDecimal.ZERO)
                    .subtract(pagosDetalle));
            guardarMovimiento("COMISION_GENERAL", detalle.getMonto(), detalle.getObraNombre());
        }

        // Incluir comisiones configuradas en las obras que no tengan registros en la tabla local
        for (ObraExternalDto obra : obrasPorId.values()) {
            if (!Boolean.TRUE.equals(obra.getTieneComision())) {
                continue;
            }
            if (!obrasValidas.contains(obra.getId())) {
                continue;
            }
            if (obrasConComisionRegistrada.contains(obra.getId())) {
                continue;
            }
            BigDecimal monto = calcularMontoComision(obra);
            if (monto.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            ComisionesResponse.Detalle detalle = new ComisionesResponse.Detalle();
            detalle.setObraId(obra.getId());
            detalle.setObraNombre(obra.getNombre());
            detalle.setMonto(monto);
            BigDecimal pagosDetalle = pagosPorObra.getOrDefault(obra.getId(), BigDecimal.ZERO).min(monto);
            detalle.setPagos(pagosDetalle);
            detalle.setSaldo(saldoPositivo(monto.subtract(pagosDetalle)));
            response.getDetalle().add(detalle);
            total = total.add(monto);
            pagos = pagos.add(pagosDetalle);
        }

        response.setTotalComision(total);
        response.setTotalPagos(pagos);
        response.setSaldo(saldoPositivo(total.subtract(pagos)));
        return response;
    }

    public ComisionesFrontResponse generarComisiones(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obrasFiltradas = filtrarObras(filtros).stream()
                .filter(obra -> estadoGeneraDeuda(obra.getObraEstado()))
                .collect(Collectors.toList());
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obrasFiltradas, ObraExternalDto::getId);

        Set<Long> obraIds = new HashSet<>(obrasPorId.keySet());
        List<Comision> comisionesDb = comisionRepository.findAll().stream()
                .filter(c -> obraIds.isEmpty() || obraIds.contains(c.getIdObra()))
                .filter(c -> dentroDeRango(c.getFecha(), filtros.getFechaInicio(), filtros.getFechaFin()))
                .toList();

        BigDecimal total = BigDecimal.ZERO;
        Set<Long> obrasConRegistro = new HashSet<>();
        ComisionesFrontResponse response = new ComisionesFrontResponse();

        for (Comision comision : comisionesDb) {
            ObraExternalDto obra = obrasPorId.get(comision.getIdObra());
            if (obra == null) continue;

            obrasConRegistro.add(comision.getIdObra());
            BigDecimal monto = Optional.ofNullable(comision.getMonto()).orElse(BigDecimal.ZERO);

            ComisionesFrontResponse.ComisionItem item = new ComisionesFrontResponse.ComisionItem();
            item.setObraId(obra.getId());
            item.setObraNombre(obra.getNombre());
            item.setPorcentaje(obra.getComision());
            item.setMonto(monto);
            response.getComisiones().add(item);
            total = total.add(monto);
        }

        // Fallback: calcular comisiones configuradas en la obra cuando no hay registros en la tabla
        for (ObraExternalDto obra : obrasPorId.values()) {
            if (!Boolean.TRUE.equals(obra.getTieneComision())) continue;
            if (obrasConRegistro.contains(obra.getId())) continue;

            BigDecimal monto = calcularMontoComision(obra);
            if (monto.compareTo(BigDecimal.ZERO) <= 0) continue;

            ComisionesFrontResponse.ComisionItem item = new ComisionesFrontResponse.ComisionItem();
            item.setObraId(obra.getId());
            item.setObraNombre(obra.getNombre());
            item.setPorcentaje(obra.getComision());
            item.setMonto(monto);
            response.getComisiones().add(item);
            total = total.add(monto);
        }

        response.setTotal(total);
        return response;
    }


    public RankingClientesResponse generarRankingClientes(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);
        List<TransaccionExternalDto> transacciones = filtrarTransacciones(filtros, obrasPorId);

        Map<Long, RankingClientesResponse.ItemRankingCliente> ranking = new HashMap<>();

        for (ObraExternalDto obra : obras) {
            RankingClientesResponse.ItemRankingCliente item = ranking.computeIfAbsent(
                    obra.getIdCliente(),
                    id -> {
                        RankingClientesResponse.ItemRankingCliente nuevo = new RankingClientesResponse.ItemRankingCliente();
                        nuevo.setClienteId(id);
                        ClienteExternalDto cliente = clientes.get(id);
                        nuevo.setClienteNombre(cliente != null ? cliente.getNombre() : null);
                        return nuevo;
                    }
            );
            item.setCantidadObras(item.getCantidadObras() + 1);
        }

        for (TransaccionExternalDto tx : transacciones) {
            if (tx.getMonto() == null || Boolean.FALSE.equals(tx.getActivo())) {
                continue;
            }
            ObraExternalDto obra = obrasPorId.get(tx.getIdObra());
            if (obra == null) {
                continue;
            }
            RankingClientesResponse.ItemRankingCliente item = ranking.get(obra.getIdCliente());
            if (item == null) {
                continue;
            }
            BigDecimal monto = BigDecimal.valueOf(tx.getMonto());
            String tipo = tx.getTipoTransaccion() != null ? tx.getTipoTransaccion() : "";
            if ("COBRO".equalsIgnoreCase(tipo)) {
                item.setTotalIngresos(item.getTotalIngresos().add(monto));
            } else {
                item.setTotalEgresos(item.getTotalEgresos().add(monto));
            }
        }

        RankingClientesResponse response = new RankingClientesResponse();
        response.setClientes(ranking.values().stream()
                .sorted(Comparator.comparing(RankingClientesResponse.ItemRankingCliente::getTotalIngresos).reversed())
                .collect(Collectors.toList()));
        return response;
    }

    public RankingProveedoresResponse generarRankingProveedores(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ProveedorExternalDto> proveedores = mapearPorId(proveedoresClient.obtenerProveedores(), ProveedorExternalDto::getId);

        Map<Long, RankingProveedoresResponse.ItemRankingProveedor> ranking = new HashMap<>();
        Map<Long, Set<Long>> obrasPorProveedor = new HashMap<>();

        for (ObraExternalDto obra : obras) {
            List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costos) {
                if (Boolean.FALSE.equals(costo.getActivo())) {
                    continue;
                }
                if (filtros.getProveedorId() != null && !Objects.equals(filtros.getProveedorId(), costo.getIdProveedor())) {
                    continue;
                }
                RankingProveedoresResponse.ItemRankingProveedor item = ranking.computeIfAbsent(
                        costo.getIdProveedor(),
                        id -> {
                            RankingProveedoresResponse.ItemRankingProveedor nuevo = new RankingProveedoresResponse.ItemRankingProveedor();
                            nuevo.setProveedorId(id);
                            ProveedorExternalDto proveedor = proveedores.get(id);
                            nuevo.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);
                            return nuevo;
                        }
                );
                item.setTotalCostos(item.getTotalCostos().add(costoBase(costo)));
                obrasPorProveedor.computeIfAbsent(costo.getIdProveedor(), k -> new HashSet<>()).add(obra.getId());
            }
        }

        obrasPorProveedor.forEach((proveedorId, obrasProveedor) -> {
            RankingProveedoresResponse.ItemRankingProveedor item = ranking.get(proveedorId);
            if (item != null) {
                item.setCantidadObras(obrasProveedor.size());
            }
        });

        RankingProveedoresResponse response = new RankingProveedoresResponse();
        response.setProveedores(ranking.values().stream()
                .sorted(Comparator.comparing(RankingProveedoresResponse.ItemRankingProveedor::getTotalCostos).reversed())
                .collect(Collectors.toList()));
        return response;
    }

    public List<NotasObraResponse> generarNotasGenerales() {
        List<ObraExternalDto> obras = obrasClient.obtenerObras();
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);
        return obras.stream()
                .map(obra -> construirNotasObra(obra, clientes.get(obra.getIdCliente())))
                .collect(Collectors.toList());
    }

    public NotasObraResponse generarNotasPorObra(Long obraId) {
        ObraExternalDto obra = obrasClient.obtenerObra(obraId)
                .orElseThrow(() -> new NoSuchElementException("Obra no encontrada: " + obraId));
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);
        return construirNotasObra(obra, clientes.get(obra.getIdCliente()));
    }

    // =====================
    // Helpers
    // =====================

    private ReportFilterRequest filtroSeguro(ReportFilterRequest filtro) {
        return filtro != null ? filtro : new ReportFilterRequest();
    }

    private List<ObraExternalDto> filtrarObras(ReportFilterRequest filtro) {
        return obrasClient.obtenerObras().stream()
                .filter(obra -> !Boolean.FALSE.equals(obra.getActivo()))
                .filter(obra -> filtro.getObraId() == null || Objects.equals(obra.getId(), filtro.getObraId()))
                .filter(obra -> filtro.getClienteId() == null || Objects.equals(obra.getIdCliente(), filtro.getClienteId()))
                .filter(obra -> dentroDeRango(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : null,
                        filtro.getFechaInicio(), filtro.getFechaFin()))
                .collect(Collectors.toList());
    }

    private List<ObraExternalDto> filtrarObrasConDeuda(ReportFilterRequest filtro) {
        return filtrarObras(filtro).stream()
                .filter(obra -> estadoGeneraDeuda(obra.getObraEstado()))
                .collect(Collectors.toList());
    }

    private List<ObraExternalDto> filtrarObrasPorEstado(EstadoObraFilterRequest filtro) {
        return obrasClient.obtenerObras().stream()
                .filter(obra -> !Boolean.FALSE.equals(obra.getActivo()))
                .filter(obra -> filtro.getClienteId() == null || Objects.equals(obra.getIdCliente(), filtro.getClienteId()))
                .filter(obra -> filtro.getEstados() == null || filtro.getEstados().isEmpty()
                        || (obra.getObraEstado() != null && filtro.getEstados().stream()
                            .filter(java.util.Objects::nonNull)
                            .map(String::toUpperCase)
                            .anyMatch(e -> e.equals(obra.getObraEstado().toUpperCase()))))
                .filter(obra -> dentroDeRango(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : null,
                        filtro.getFechaInicio(), filtro.getFechaFin()))
                .collect(Collectors.toList());
    }

    private List<TransaccionExternalDto> filtrarTransacciones(ReportFilterRequest filtro,
                                                             Map<Long, ObraExternalDto> obrasPorId) {
        return obtenerTransaccionesActivas().stream()
                .filter(tx -> filtro.getObraId() == null || Objects.equals(tx.getIdObra(), filtro.getObraId()))
                // Si filtro por proveedor, solo excluyo pagos a otros proveedores; dejo pasar los del cliente u otros asociados
                .filter(tx -> {
                    if (filtro.getProveedorId() == null) return true;
                    String tipo = Optional.ofNullable(tx.getTipoAsociado()).orElse("").toUpperCase();
                    if (!"PROVEEDOR".equals(tipo)) return true; // movimientos de cliente u otros siguen
                    return Objects.equals(tx.getIdAsociado(), filtro.getProveedorId());
                })
                .filter(tx -> {
                    if (filtro.getClienteId() == null) {
                        return true;
                    }
                    ObraExternalDto obra = obrasPorId.get(tx.getIdObra());
                    return obra != null && Objects.equals(obra.getIdCliente(), filtro.getClienteId());
                })
                .filter(tx -> dentroDeRango(tx.getFecha(), filtro.getFechaInicio(), filtro.getFechaFin()))
                .collect(Collectors.toList());
    }

    private List<TransaccionExternalDto> filtrarTransaccionesPorObra(Long obraId) {
        return obtenerTransaccionesActivas().stream()
                .filter(tx -> Objects.equals(tx.getIdObra(), obraId))
                .collect(Collectors.toList());
    }

    private <T, K> Map<K, T> mapearPorId(List<T> lista, Function<T, K> extractor) {
        return lista.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(extractor, Function.identity(), (a, b) -> a, LinkedHashMap::new));
    }

    private List<DeudasGlobalesResponse.DetalleDeudaCliente> construirDetalleDeudaClientes(ReportFilterRequest filtro) {
        List<ObraExternalDto> obras = filtrarObrasConDeuda(filtro);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ClienteExternalDto> clientes = mapearPorId(clientesClient.obtenerClientes(), ClienteExternalDto::getId);

        Map<Long, BigDecimal> cobrosPorObra = filtrarTransacciones(filtro, obrasPorId).stream()
                .filter(tx -> tx.getIdObra() != null)
                .filter(tx -> "COBRO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .collect(Collectors.groupingBy(
                        TransaccionExternalDto::getIdObra,
                        Collectors.mapping(
                                tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        return obras.stream()
                .map(obra -> {
                    BigDecimal presupuesto = presupuestoEfectivo(obra);
                    BigDecimal cobrado = cobrosPorObra.getOrDefault(obra.getId(), BigDecimal.ZERO);
                    BigDecimal saldo = saldoPositivo(presupuesto.subtract(cobrado));
                    if (!tieneSaldoSignificativo(saldo)) {
                        return null;
                    }

                    DeudasGlobalesResponse.DetalleDeudaCliente detalle = new DeudasGlobalesResponse.DetalleDeudaCliente();
                    detalle.setObraId(obra.getId());
                    detalle.setObraNombre(obra.getNombre());
                    detalle.setClienteId(obra.getIdCliente());
                    ClienteExternalDto cliente = clientes.get(obra.getIdCliente());
                    detalle.setClienteNombre(cliente != null ? cliente.getNombre() : null);
                    detalle.setPresupuesto(presupuesto);
                    detalle.setCobrado(cobrado);
                    detalle.setSaldo(saldo);
                    return detalle;
                })
                .filter(Objects::nonNull)
                .sorted(comparadorDetalleCliente(obrasPorId))
                .collect(Collectors.toList());
    }

    private List<DeudasGlobalesResponse.DetalleDeudaProveedor> construirDetalleDeudaProveedores(ReportFilterRequest filtro) {
        List<ObraExternalDto> obras = filtrarObrasConDeuda(filtro);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ProveedorExternalDto> proveedores = mapearPorId(proveedoresClient.obtenerProveedores(), ProveedorExternalDto::getId);

        Map<String, BigDecimal> presupuestadoPorObraProveedor = new HashMap<>();
        for (ObraExternalDto obra : obras) {
            List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costos) {
                if (Boolean.FALSE.equals(costo.getActivo()) || !costoTieneProveedor(costo)) {
                    continue;
                }
                if (filtro.getProveedorId() != null && !Objects.equals(filtro.getProveedorId(), costo.getIdProveedor())) {
                    continue;
                }
                String key = claveObraProveedor(obra.getId(), costo.getIdProveedor());
                presupuestadoPorObraProveedor.merge(key, costoBase(costo), BigDecimal::add);
            }
        }

        Map<String, BigDecimal> pagosPorObraProveedor = filtrarTransacciones(filtro, obrasPorId).stream()
                .filter(tx -> "PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .filter(tx -> "PROVEEDOR".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse("")))
                .filter(tx -> tx.getIdObra() != null && tx.getIdAsociado() != null)
                .collect(Collectors.groupingBy(
                        tx -> claveObraProveedor(tx.getIdObra(), tx.getIdAsociado()),
                        Collectors.mapping(
                                tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        return presupuestadoPorObraProveedor.entrySet().stream()
                .map(entry -> {
                    String[] partes = entry.getKey().split(":");
                    Long obraId = Long.parseLong(partes[0]);
                    Long proveedorId = Long.parseLong(partes[1]);
                    BigDecimal presupuestado = entry.getValue();
                    BigDecimal pagado = pagosPorObraProveedor.getOrDefault(entry.getKey(), BigDecimal.ZERO);
                    BigDecimal saldo = saldoPositivo(presupuestado.subtract(pagado));
                    if (!tieneSaldoSignificativo(saldo)) {
                        return null;
                    }

                    ObraExternalDto obra = obrasPorId.get(obraId);
                    ProveedorExternalDto proveedor = proveedores.get(proveedorId);
                    DeudasGlobalesResponse.DetalleDeudaProveedor detalle = new DeudasGlobalesResponse.DetalleDeudaProveedor();
                    detalle.setObraId(obraId);
                    detalle.setObraNombre(obra != null ? obra.getNombre() : null);
                    detalle.setProveedorId(proveedorId);
                    detalle.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);
                    detalle.setPresupuestado(presupuestado);
                    detalle.setPagado(pagado);
                    detalle.setSaldo(saldo);
                    return detalle;
                })
                .filter(Objects::nonNull)
                .sorted(comparadorDetalleProveedor(obrasPorId))
                .collect(Collectors.toList());
    }

    private List<CuentaCorrienteClienteResponse.ResumenCliente> construirResumenClientes(ReportFilterRequest filtro) {
        Map<Long, CuentaCorrienteClienteResponse.ResumenCliente> resumenPorCliente = new LinkedHashMap<>();
        for (DeudasGlobalesResponse.DetalleDeudaCliente detalle : construirDetalleDeudaClientes(filtro)) {
            Long clienteId = detalle.getClienteId();
            if (clienteId == null) {
                continue;
            }
            CuentaCorrienteClienteResponse.ResumenCliente resumen = resumenPorCliente.computeIfAbsent(clienteId, id -> {
                CuentaCorrienteClienteResponse.ResumenCliente nuevo = new CuentaCorrienteClienteResponse.ResumenCliente();
                nuevo.setClienteId(id);
                nuevo.setClienteNombre(detalle.getClienteNombre());
                return nuevo;
            });
            resumen.setPresupuestado(resumen.getPresupuestado().add(detalle.getPresupuesto()));
            resumen.setCobros(resumen.getCobros().add(detalle.getCobrado()));
            resumen.setSaldo(resumen.getSaldo().add(detalle.getSaldo()));
        }

        return resumenPorCliente.values().stream()
                .filter(item -> tieneSaldoSignificativo(item.getSaldo()))
                .collect(Collectors.toList());
    }

    private List<CuentaCorrienteProveedorResponse.ResumenProveedor> construirResumenProveedores(ReportFilterRequest filtro) {
        Map<Long, CuentaCorrienteProveedorResponse.ResumenProveedor> resumenPorProveedor = new LinkedHashMap<>();
        for (DeudasGlobalesResponse.DetalleDeudaProveedor detalle : construirDetalleDeudaProveedores(filtro)) {
            Long proveedorId = detalle.getProveedorId();
            if (proveedorId == null) {
                continue;
            }
            CuentaCorrienteProveedorResponse.ResumenProveedor resumen = resumenPorProveedor.computeIfAbsent(proveedorId, id -> {
                CuentaCorrienteProveedorResponse.ResumenProveedor nuevo = new CuentaCorrienteProveedorResponse.ResumenProveedor();
                nuevo.setProveedorId(id);
                nuevo.setProveedorNombre(detalle.getProveedorNombre());
                return nuevo;
            });
            resumen.setPresupuestado(resumen.getPresupuestado().add(detalle.getPresupuestado()));
            resumen.setPagos(resumen.getPagos().add(detalle.getPagado()));
            resumen.setSaldo(resumen.getSaldo().add(detalle.getSaldo()));
        }

        return resumenPorProveedor.values().stream()
                .filter(item -> tieneSaldoSignificativo(item.getSaldo()))
                .collect(Collectors.toList());
    }

    private BigDecimal sumarSaldosClientes(List<DeudasGlobalesResponse.DetalleDeudaCliente> detalles) {
        return detalles.stream()
                .map(DeudasGlobalesResponse.DetalleDeudaCliente::getSaldo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumarSaldosProveedores(List<DeudasGlobalesResponse.DetalleDeudaProveedor> detalles) {
        return detalles.stream()
                .map(DeudasGlobalesResponse.DetalleDeudaProveedor::getSaldo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String claveObraProveedor(Long obraId, Long proveedorId) {
        return obraId + ":" + proveedorId;
    }

    private Comparator<DeudasGlobalesResponse.DetalleDeudaCliente> comparadorDetalleCliente(Map<Long, ObraExternalDto> obrasPorId) {
        return Comparator
                .comparing(DeudasGlobalesResponse.DetalleDeudaCliente::getObraId,
                        (obraIdA, obraIdB) -> compararOrdenObras(obrasPorId.get(obraIdA), obraIdA, obrasPorId.get(obraIdB), obraIdB))
                .thenComparing(DeudasGlobalesResponse.DetalleDeudaCliente::getClienteNombre,
                        Comparator.nullsLast(String::compareToIgnoreCase));
    }

    private Comparator<DeudasGlobalesResponse.DetalleDeudaProveedor> comparadorDetalleProveedor(Map<Long, ObraExternalDto> obrasPorId) {
        return Comparator
                .comparing(DeudasGlobalesResponse.DetalleDeudaProveedor::getObraId,
                        (obraIdA, obraIdB) -> compararOrdenObras(obrasPorId.get(obraIdA), obraIdA, obrasPorId.get(obraIdB), obraIdB))
                .thenComparing(DeudasGlobalesResponse.DetalleDeudaProveedor::getProveedorNombre,
                        Comparator.nullsLast(String::compareToIgnoreCase));
    }

    private BigDecimal sumarPorTipo(List<TransaccionExternalDto> transacciones, String tipoBuscado) {
        return transacciones.stream()
                .filter(tx -> Boolean.TRUE.equals(tx.getActivo()) || tx.getActivo() == null)
                .filter(tx -> tx.getMonto() != null)
                .filter(tx -> {
                    String tipo = tx.getTipoTransaccion() != null ? tx.getTipoTransaccion() : "";
                    return tipoBuscado.equalsIgnoreCase(tipo);
                })
                .map(tx -> BigDecimal.valueOf(tx.getMonto()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularMontoComision(ObraExternalDto obra) {
        if (obra == null) return BigDecimal.ZERO;

        BigDecimal porcentaje = Optional.ofNullable(obra.getComision()).orElse(BigDecimal.ZERO);
        if (porcentaje.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal comisionMonto = Optional.ofNullable(obra.getComisionMonto()).orElse(BigDecimal.ZERO);
        if (comisionMonto.compareTo(BigDecimal.ZERO) > 0) {
            return comisionMonto;
        }

        // Usar totalConBeneficio como base de cálculo (incluye beneficios)
        BigDecimal base = Optional.ofNullable(obra.getTotalConBeneficio()).orElse(BigDecimal.ZERO);
        if (base.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return base
                .multiply(porcentaje)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal presupuestoEfectivo(ObraExternalDto obra) {
        if (obra == null) return BigDecimal.ZERO;
        BigDecimal totalConBeneficio = Optional.ofNullable(obra.getTotalConBeneficio()).orElse(BigDecimal.ZERO);
        if (totalConBeneficio.compareTo(BigDecimal.ZERO) > 0) {
            return totalConBeneficio;
        }
        return Optional.ofNullable(obra.getPresupuesto()).orElse(BigDecimal.ZERO);
    }

    private BigDecimal calcularComisionPendiente(ObraExternalDto obra) {
        if (obra == null || !Boolean.TRUE.equals(obra.getTieneComision())) {
            return BigDecimal.ZERO;
        }
        BigDecimal monto = calcularMontoComision(obra);
        if (monto.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal pagos = obtenerPagosComisionPorObra(obra.getId());
        BigDecimal pendiente = monto.subtract(pagos);
        return pendiente.compareTo(BigDecimal.ZERO) > 0 ? pendiente : BigDecimal.ZERO;
    }

    private BigDecimal obtenerPagosComisionPorObra(Long obraId) {
        if (obraId == null) return BigDecimal.ZERO;
        return obtenerTransaccionesActivas().stream()
                .filter(tx -> Objects.equals(tx.getIdObra(), obraId))
                .filter(tx -> "COMISION".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse("")))
                .filter(tx -> Objects.equals(Optional.ofNullable(tx.getIdAsociado()).orElse(0L), 0L))
                .filter(tx -> "PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .filter(tx -> tx.getActivo() == null || Boolean.TRUE.equals(tx.getActivo()))
                .map(tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<Long, BigDecimal> obtenerPagosComisionPorObra() {
        Map<Long, BigDecimal> pagos = new HashMap<>();
        for (TransaccionExternalDto tx : obtenerTransaccionesActivas()) {
            if (tx == null) continue;
            if (!"PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse(""))) continue;
            if (!"COMISION".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse(""))) continue;
            Long obraId = tx.getIdObra();
            if (obraId == null) continue;
            Long idAsociado = Optional.ofNullable(tx.getIdAsociado()).orElse(0L);
            if (!Objects.equals(idAsociado, 0L)) continue;
            BigDecimal monto = BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d));
            pagos.put(obraId, pagos.getOrDefault(obraId, BigDecimal.ZERO).add(monto));
        }
        return pagos;
    }

    private List<TransaccionExternalDto> obtenerTransaccionesActivas() {
        return transaccionesClient.obtenerTransacciones().stream()
                .filter(tx -> tx != null && (tx.getActivo() == null || Boolean.TRUE.equals(tx.getActivo())))
                .collect(Collectors.toList());
    }

    private void guardarMovimiento(String tipo, BigDecimal monto, String referencia) {
        MovimientoReporte movimiento = new MovimientoReporte();
        movimiento.setTipo(tipo);
        movimiento.setMonto(monto);
        movimiento.setReferencia(referencia);
        movimiento.setFecha(LocalDate.now());
        movimientoReporteRepository.save(movimiento);
    }

    private BigDecimal saldoPositivo(BigDecimal saldo) {
        // Devuelve el saldo real, positivo o negativo (no clampea a ZERO)
        return saldo != null ? saldo : BigDecimal.ZERO;
    }

    private boolean tieneSaldoSignificativo(BigDecimal saldo) {
        return saldo != null && saldo.compareTo(new BigDecimal("0.01")) > 0;
    }

    private boolean costoTieneProveedor(ObraCostoExternalDto costo) {
        if (costo == null) return false;
        Long idProveedor = costo.getIdProveedor();
        return idProveedor != null && idProveedor > 0;
    }

    private boolean estadoGeneraDeuda(String estado) {
        if (estado == null) return false;
        String normalizado = estado.trim().toUpperCase()
                .replaceAll("\\s+", "_")
                .replaceAll("[^A-Z0-9_]+", "")
                .replaceAll("^_+|_+$", "");
        return ESTADOS_CON_DEUDA.contains(normalizado);
    }

    private boolean estadoGeneraSaldoProveedor(String estado) {
        if (estado == null) return false;
        String normalizado = estado.trim().toUpperCase()
                .replaceAll("\\s+", "_")
                .replaceAll("[^A-Z0-9_]+", "")
                .replaceAll("^_+|_+$", "");
        return ESTADOS_SALDO_PROVEEDOR.contains(normalizado);
    }

    private static final Set<String> ESTADOS_CON_DEUDA = Set.of(
            "ADJUDICADA",
            "EN_PROGRESO",
            "FINALIZADA",
            "FACTURADA",
            "FACTURADA_PARCIAL",
            "COBRADA"
    );

    private static final Set<String> ESTADOS_SALDO_PROVEEDOR = Set.of(
            "ADJUDICADA",
            "EN_PROGRESO",
            "FINALIZADA"
    );

    private static final Set<String> ESTADOS_KPI_FACTURAS = Set.of(
            "ADJUDICADA",
            "EN_PROGRESO",
            "FINALIZADA",
            "COBRADA",
            "FACTURADA",
            "FACTURADA_PARCIAL",
            "FACTURADA_TOTAL"
    );

    private BigDecimal costoBase(ObraCostoExternalDto costo) {
        if (costo == null) return BigDecimal.ZERO;

        // Si tiene monto_real registrado, usar eso para reportes (gasto real)
        if (costo.getMontoReal() != null && costo.getMontoReal().compareTo(BigDecimal.ZERO) >= 0) {
            return costo.getMontoReal();
        }

        // Si no, usar subtotal cotizado (fallback)
        if (costo.getSubtotal() != null) return costo.getSubtotal();
        if (costo.getCantidad() != null && costo.getPrecioUnitario() != null) {
            return costo.getCantidad().multiply(costo.getPrecioUnitario());
        }
        return Optional.ofNullable(costo.getTotal()).orElse(BigDecimal.ZERO);
    }

    private int compararOrdenObras(ObraExternalDto obraA, Long obraIdA, ObraExternalDto obraB, Long obraIdB) {
        long fechaA = getFechaInicioMs(obraA);
        long fechaB = getFechaInicioMs(obraB);
        if (fechaA != fechaB) {
            return Long.compare(fechaB, fechaA);
        }
        return Long.compare(Optional.ofNullable(obraIdB).orElse(0L), Optional.ofNullable(obraIdA).orElse(0L));
    }

    private long getFechaInicioMs(ObraExternalDto obra) {
        if (obra == null || obra.getFechaInicio() == null) {
            return Long.MIN_VALUE;
        }
        return obra.getFechaInicio()
                .atZone(java.time.ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
    }

    private AvanceTareasResponse.AvanceObra construirAvanceParaTareas(ObraExternalDto obra,
                                                                      List<TareaExternalDto> tareas) {
        AvanceTareasResponse.AvanceObra avance = new AvanceTareasResponse.AvanceObra();
        if (obra != null) {
            avance.setObraId(obra.getId());
            avance.setObraNombre(obra.getNombre());
        }

        long total = tareas.stream()
                .filter(t -> filtroPorObra(obra, t))
                .filter(t -> t.getActivo() == null || Boolean.TRUE.equals(t.getActivo()))
                .count();
        long completadas = tareas.stream()
                .filter(t -> filtroPorObra(obra, t))
                .filter(t -> t.getActivo() == null || Boolean.TRUE.equals(t.getActivo()))
                .filter(t -> t.getEstadoTarea() != null && "COMPLETADA".equalsIgnoreCase(t.getEstadoTarea()))
                .count();

        avance.setTotalTareas(total);
        avance.setTareasCompletadas(completadas);
        if (total > 0) {
            avance.setPorcentaje(BigDecimal.valueOf(completadas)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP));
        } else {
            avance.setPorcentaje(BigDecimal.ZERO);
        }

        return avance;
    }

    private boolean filtroPorObra(ObraExternalDto obra, TareaExternalDto tarea) {
        return obra == null || Objects.equals(obra.getId(), tarea.getIdObra());
    }

    private NotasObraResponse construirNotasObra(ObraExternalDto obra, ClienteExternalDto cliente) {
        NotasObraResponse response = new NotasObraResponse();
        response.setObraId(obra.getId());
        response.setObraNombre(obra.getNombre());
        response.setEstado(obra.getObraEstado());
        response.setClienteId(obra.getIdCliente());
        response.setClienteNombre(cliente != null ? cliente.getNombre() : null);
        response.setNotas(obra.getNotas());
        response.setFechaInicio(obra.getFechaInicio());
        response.setFechaFin(obra.getFechaFin());
        return response;
    }

    private boolean dentroDeRango(LocalDate fecha, LocalDate inicio, LocalDate fin) {
        if (fecha == null) {
            return inicio == null && fin == null;
        }
        boolean desde = inicio == null || !fecha.isBefore(inicio);
        boolean hasta = fin == null || !fecha.isAfter(fin);
        return desde && hasta;
    }

    public AvancePagosObraResponse generarAvancePagosObra(Long obraId) {
        AvancePagosObraResponse response = new AvancePagosObraResponse();
        if (obraId == null) return response;

        // Obtener la obra
        List<ObraExternalDto> obras = obrasClient.obtenerObras();
        ObraExternalDto obra = obras.stream()
                .filter(o -> Objects.equals(o.getId(), obraId))
                .findFirst()
                .orElse(null);
        if (obra == null) return response;

        // Obtener costos y tareas
        List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obraId);
        List<TareaExternalDto> tareas = obrasClient.obtenerTareasDeObra(obraId);
        List<TransaccionExternalDto> transacciones = obtenerTransaccionesActivas();

        // Agrupar por proveedor
        Set<Long> proveedorIds = new HashSet<>();
        costos.forEach(c -> {
            if (c.getIdProveedor() != null && c.getIdProveedor() > 0) {
                proveedorIds.add(c.getIdProveedor());
            }
        });
        tareas.forEach(t -> {
            if (t.getIdProveedor() != null && t.getIdProveedor() > 0) {
                proveedorIds.add(t.getIdProveedor());
            }
        });

        // Calcular resumen por proveedor
        proveedorIds.forEach(proveedorId -> {
            ProveedorExternalDto proveedor = obtenerProveedorById(proveedorId);

            BigDecimal costoTotal = costos.stream()
                    .filter(c -> Objects.equals(c.getIdProveedor(), proveedorId))
                    .map(this::costoBase)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Calcular avance: suma de porcentajes de tareas COMPLETADAS
            BigDecimal avancePorcentaje = tareas.stream()
                    .filter(t -> Objects.equals(t.getIdProveedor(), proveedorId))
                    .filter(t -> t.getActivo() == null || Boolean.TRUE.equals(t.getActivo()))
                    .filter(t -> t.getEstadoTarea() != null && "COMPLETADA".equalsIgnoreCase(t.getEstadoTarea()))
                    .map(t -> BigDecimal.valueOf(t.getPorcentaje() != null ? t.getPorcentaje() : 0))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            avancePorcentaje = avancePorcentaje.min(new BigDecimal("100"));

            BigDecimal pagoHabilitado = costoTotal.multiply(avancePorcentaje)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            // Calcular pagado: suma de transacciones PAGO para este proveedor
            BigDecimal pagado = transacciones.stream()
                    .filter(tx -> Objects.equals(tx.getIdObra(), obraId))
                    .filter(tx -> Objects.equals(tx.getIdAsociado(), proveedorId))
                    .filter(tx -> "PROVEEDOR".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse("")))
                    .filter(tx -> "PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                    .map(tx -> BigDecimal.valueOf(Math.abs(tx.getMonto() != null ? tx.getMonto() : 0)))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal saldo = costoTotal.subtract(pagado);
            String estadoPago = calcularEstadoPago(saldo);

            AvancePagosObraResponse.ItemAvancePago item = new AvancePagosObraResponse.ItemAvancePago();
            item.setProveedorId(proveedorId);
            item.setProveedorNombre(proveedor != null ? proveedor.getNombre() : "Proveedor #" + proveedorId);
            item.setCostoTotal(costoTotal);
            item.setAvancePorcentaje(avancePorcentaje);
            item.setPagoHabilitado(pagoHabilitado);
            item.setPagado(pagado);
            item.setSaldo(saldo);
            item.setEstadoPago(estadoPago);

            response.getItems().add(item);
        });

        response.getItems().sort((a, b) -> a.getProveedorNombre().compareTo(b.getProveedorNombre()));
        return response;
    }

    private String calcularEstadoPago(BigDecimal saldo) {
        if (saldo == null) return "SIN_MOVIMIENTO";
        BigDecimal threshold = new BigDecimal("1");
        if (saldo.abs().compareTo(threshold) <= 0) {
            return "AL_DIA";
        } else if (saldo.compareTo(BigDecimal.ZERO) > 0) {
            return "ATRASADO";
        } else {
            return "ADELANTADO";
        }
    }

    private ProveedorExternalDto obtenerProveedorById(Long proveedorId) {
        try {
            List<ProveedorExternalDto> proveedores = proveedoresClient.obtenerProveedores();
            if (proveedores != null) {
                return proveedores.stream()
                        .filter(p -> Objects.equals(p.getId(), proveedorId))
                        .findFirst()
                        .orElse(null);
            }
        } catch (Exception e) {
            // Error al obtener proveedores, retorna null
        }
        return null;
    }

    public FacturasKpiResponse generarKpiFacturas(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);

        // 1. Obtener todas las obras
        List<ObraExternalDto> todasObras = filtrarObras(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(todasObras, ObraExternalDto::getId);

        // 2. Obtener facturas solo de obras que requieren factura
        List<FacturaExternalDto> todasFacturas = new ArrayList<>();
        int contadorFacturas = 0;
        List<ObraExternalDto> obrasQuiereFactura = todasObras.stream()
                .filter(o -> Boolean.TRUE.equals(o.getRequiereFactura()))
                .collect(Collectors.toList());

        log.info("=== KPI FACTURAS DEBUG ===");
        log.info("Total obras: {}", todasObras.size());
        log.info("Obras que requieren factura: {}", obrasQuiereFactura.size());

        for (ObraExternalDto obra : obrasQuiereFactura) {
            List<FacturaExternalDto> facturasPorObra = facturasClient.obtenerFacturasPorObra(obra.getId());
            if (!facturasPorObra.isEmpty()) {
                log.info("Obra {} ({}): {} facturas", obra.getId(), obra.getNombre(), facturasPorObra.size());
                todasFacturas.addAll(facturasPorObra);
                contadorFacturas += facturasPorObra.size();
            }
        }
        log.info("Total de facturas obtenidas: {}", contadorFacturas);

        // Filtrar facturas activas
        todasFacturas = todasFacturas.stream()
                .filter(f -> Boolean.TRUE.equals(f.getActivo()) || f.getActivo() == null)
                .collect(Collectors.toList());

        log.info("Facturas activas después de filtro: {}", todasFacturas.size());

        // 3. Obras facturables: requieren factura Y están en estados KPI
        log.info("Estados KPI permitidos: {}", ESTADOS_KPI_FACTURAS);

        List<ObraExternalDto> obrasFacturables = todasObras.stream()
                .filter(o -> Boolean.TRUE.equals(o.getRequiereFactura()))
                .filter(o -> {
                    String estadoNormalizado = normalizarEstado(o.getObraEstado());
                    boolean esValido = ESTADOS_KPI_FACTURAS.contains(estadoNormalizado);
                    if (!esValido) {
                        log.debug("Obra {} - Estado {} (normalizado: {}) NO está en KPI", o.getId(), o.getObraEstado(), estadoNormalizado);
                    }
                    return esValido;
                })
                .collect(Collectors.toList());

        log.info("Obras facturables (requiere_factura=true + estado en KPI): {}", obrasFacturables.size());
        obrasFacturables.forEach(o -> log.info("  - Obra {} ({}): estado={}", o.getId(), o.getNombre(), o.getObraEstado()));

        Set<Long> obraIdsFacturables = obrasFacturables.stream()
                .map(ObraExternalDto::getId)
                .collect(Collectors.toSet());

        // 2. totalFacturado: suma de facturas solo de obras en estado KPI
        List<FacturaExternalDto> facturasValidas = todasFacturas.stream()
                .filter(f -> f.getIdObra() != null && obraIdsFacturables.contains(f.getIdObra()))
                .collect(Collectors.toList());

        log.info("Facturas de obras validas: {}", facturasValidas.size());
        facturasValidas.forEach(f -> log.info("  - Factura {} (Obra {}): monto={}", f.getId(), f.getIdObra(), f.getMonto()));

        BigDecimal totalFacturado = facturasValidas.stream()
                .map(f -> BigDecimal.valueOf(Optional.ofNullable(f.getMonto()).orElse(0d)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("TOTAL FACTURADO: {}", totalFacturado);

        // 4. Mapa de facturado por obra: suma de facturas de cada obra
        Map<Long, BigDecimal> facturadoPorObra = todasFacturas.stream()
                .filter(f -> f.getIdObra() != null)
                .collect(Collectors.groupingBy(
                    FacturaExternalDto::getIdObra,
                    Collectors.reducing(BigDecimal.ZERO,
                        f -> BigDecimal.valueOf(Optional.ofNullable(f.getMonto()).orElse(0d)),
                        BigDecimal::add)));

        // 5. totalPorFacturar: suma de (presupuesto - facturado) por cada obra facturable
        BigDecimal totalPorFacturar = obrasFacturables.stream()
                .map(o -> {
                    BigDecimal presupuesto = presupuestoEfectivo(o);
                    BigDecimal facturado = facturadoPorObra.getOrDefault(o.getId(), BigDecimal.ZERO);
                    return saldoPositivo(presupuesto.subtract(facturado));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 6. Cobros de obras en estado KPI
        List<TransaccionExternalDto> cobrosObrasFacturables = obtenerTransaccionesActivas().stream()
                .filter(tx -> "COBRO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .filter(tx -> tx.getIdObra() != null && obraIdsFacturables.contains(tx.getIdObra()))
                .collect(Collectors.toList());

        // Mapa de cobrado por obra: suma de cobros de cada obra
        Map<Long, BigDecimal> cobradoPorObra = cobrosObrasFacturables.stream()
                .collect(Collectors.groupingBy(
                    TransaccionExternalDto::getIdObra,
                    Collectors.reducing(BigDecimal.ZERO,
                        tx -> BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)),
                        BigDecimal::add)));

        BigDecimal totalCobrado = cobradoPorObra.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 7. totalPorCobrar: suma de (presupuesto - cobrado) por cada obra facturable
        BigDecimal totalPorCobrar = obrasFacturables.stream()
                .map(o -> {
                    BigDecimal presupuesto = presupuestoEfectivo(o);
                    BigDecimal cobrado = cobradoPorObra.getOrDefault(o.getId(), BigDecimal.ZERO);
                    return saldoPositivo(presupuesto.subtract(cobrado));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new FacturasKpiResponse(totalFacturado, totalPorFacturar, totalCobrado, totalPorCobrar);
    }

    private String normalizarEstado(String estado) {
        if (estado == null) return "";
        return estado.trim().toUpperCase()
                .replaceAll("\\s+", "_")
                .replaceAll("[^A-Z0-9_]+", "")
                .replaceAll("^_+|_+$", "");
    }

    // ===== PDF ACCOUNT STATEMENTS =====

    /**
     * Genera tabla pivotada de cuenta corriente para PDF de Proveedor
     * Retorna movimientos agrupados por obra y fecha para mostrar en tabla dinámica
     */
    public CuentaCorrientePdfResponse generarCuentaCorrienteProveedorPdf(
            Long proveedorId, List<Long> obraIds) {

        List<ObraExternalDto> obras = obrasClient.obtenerObras();
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ProveedorExternalDto> proveedores = mapearPorId(
                proveedoresClient.obtenerProveedores(), ProveedorExternalDto::getId);

        // Filtrar obras válidas
        Set<Long> obrasValidas = obras.stream()
                .filter(obra -> estadoGeneraSaldoProveedor(obra.getObraEstado()))
                .filter(obra -> obraIds == null || obraIds.isEmpty() || obraIds.contains(obra.getId()))
                .map(ObraExternalDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        ProveedorExternalDto proveedor = proveedores.get(proveedorId);

        CuentaCorrientePdfResponse response = new CuentaCorrientePdfResponse();
        response.setAsociadoId(proveedorId);
        response.setAsociadoNombre(proveedor != null ? proveedor.getNombre() : null);
        response.setAsociadoEmail(proveedor != null ? proveedor.getEmail() : null);
        response.setAsociadoTelefono(proveedor != null ? proveedor.getTelefono() : null);

        // Estructura: obra → fecha → sumatoria
        Map<Long, Map<LocalDate, BigDecimal>> movimientosAgrupadosPorObraYFecha = new TreeMap<>();
        Set<LocalDate> fechasUnicas = new TreeSet<>();

        BigDecimal[] costosYPagos = {BigDecimal.ZERO, BigDecimal.ZERO}; // [costos, pagos]

        // Procesar costos (desde costos de obra)
        for (ObraExternalDto obra : obras) {
            if (!obrasValidas.contains(obra.getId())) continue;

            List<ObraCostoExternalDto> costosObra = obrasClient.obtenerCostos(obra.getId());
            for (ObraCostoExternalDto costo : costosObra) {
                if (!Objects.equals(proveedorId, costo.getIdProveedor()) ||
                        Boolean.FALSE.equals(costo.getActivo())) {
                    continue;
                }

                BigDecimal monto = costoBase(costo);
                costosYPagos[0] = costosYPagos[0].add(monto);

                // Usar fecha de actualización del costo, o fecha de inicio de la obra como fallback
                LocalDate fecha = costo.getUltimaActualizacion() != null
                        ? costo.getUltimaActualizacion().atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                        : (obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : LocalDate.now());

                movimientosAgrupadosPorObraYFecha
                        .computeIfAbsent(obra.getId(), k -> new TreeMap<>())
                        .merge(fecha, monto, BigDecimal::add);

                fechasUnicas.add(fecha);
            }
        }

        // Procesar pagos (desde transacciones)
        for (TransaccionExternalDto tx : obtenerTransaccionesActivas()) {
            if (!Objects.equals(tx.getIdAsociado(), proveedorId)) continue;
            if (!"PROVEEDOR".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse(""))) continue;
            if (!"PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse(""))) continue;
            if (!obrasValidas.contains(tx.getIdObra())) continue;

            BigDecimal monto = BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d));
            costosYPagos[1] = costosYPagos[1].add(monto);

            LocalDate fecha = tx.getFecha();
            if (fecha == null) fecha = LocalDate.now();

            Long obraId = tx.getIdObra();
            movimientosAgrupadosPorObraYFecha
                    .computeIfAbsent(obraId, k -> new TreeMap<>())
                    .merge(fecha, monto.negate(), BigDecimal::add); // Negativo para pagos

            fechasUnicas.add(fecha);
        }

        // Construir filas (una por obra)
        List<CuentaCorrientePdfResponse.FilaObra> filas = new ArrayList<>();
        for (Long obraId : movimientosAgrupadosPorObraYFecha.keySet()) {
            ObraExternalDto obra = obrasPorId.get(obraId);
            CuentaCorrientePdfResponse.FilaObra fila = new CuentaCorrientePdfResponse.FilaObra();
            fila.setObraId(obraId);
            fila.setObraNombre(obra != null ? obra.getNombre() : ("Obra #" + obraId));

            // Mapear movimientos por fecha como strings
            Map<String, BigDecimal> movPorFecha = new LinkedHashMap<>();
            BigDecimal saldoObra = BigDecimal.ZERO;
            for (LocalDate fecha : movimientosAgrupadosPorObraYFecha.get(obraId).entrySet()
                    .stream()
                    .sorted(Map.Entry.comparingByKey())
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList())) {
                BigDecimal monto = movimientosAgrupadosPorObraYFecha.get(obraId).get(fecha);
                movPorFecha.put(fecha.toString(), monto);
                saldoObra = saldoObra.add(monto);
            }

            fila.setMovimientosPorFecha(movPorFecha);
            fila.setSaldoObra(saldoObra);
            filas.add(fila);
        }

        response.setFechasUnicas(new ArrayList<>(fechasUnicas));
        response.setFilas(filas);
        response.setTotalCostos(costosYPagos[0]);
        response.setTotalPagos(costosYPagos[1]);
        response.setSaldoFinal(costosYPagos[0].subtract(costosYPagos[1]));

        return response;
    }

    /**
     * Genera tabla pivotada de cuenta corriente para PDF de Cliente
     * Retorna cobros agrupados por obra y fecha para mostrar en tabla dinámica
     */
    public CuentaCorrientePdfResponse generarCuentaCorrienteClientePdf(
            Long clienteId, List<Long> obraIds) {

        List<ObraExternalDto> obras = obrasClient.obtenerObras();
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ClienteExternalDto> clientes = mapearPorId(
                clientesClient.obtenerClientes(), ClienteExternalDto::getId);

        // Filtrar obras válidas (del cliente)
        Set<Long> obrasValidas = obras.stream()
                .filter(obra -> Objects.equals(obra.getIdCliente(), clienteId))
                .filter(obra -> estadoGeneraSaldoCliente(obra.getObraEstado()))
                .filter(obra -> obraIds == null || obraIds.isEmpty() || obraIds.contains(obra.getId()))
                .map(ObraExternalDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        ClienteExternalDto cliente = clientes.get(clienteId);

        CuentaCorrientePdfResponse response = new CuentaCorrientePdfResponse();
        response.setAsociadoId(clienteId);
        response.setAsociadoNombre(cliente != null ? cliente.getNombre() : null);
        response.setAsociadoEmail(cliente != null ? cliente.getEmail() : null);
        response.setAsociadoTelefono(cliente != null ? cliente.getTelefono() : null);

        // Estructura: obra → fecha → sumatoria
        Map<Long, Map<LocalDate, BigDecimal>> cobrosPorObraYFecha = new TreeMap<>();
        Set<LocalDate> fechasUnicas = new TreeSet<>();

        BigDecimal[] totalCobrosFacurado = {BigDecimal.ZERO, BigDecimal.ZERO}; // [cobros, facturado]

        // Procesar cobros (solo transacciones tipo COBRO/INGRESO)
        for (TransaccionExternalDto tx : obtenerTransaccionesActivas()) {
            if (!Objects.equals(tx.getIdAsociado(), clienteId)) continue;
            if (!"CLIENTE".equalsIgnoreCase(Optional.ofNullable(tx.getTipoAsociado()).orElse(""))) continue;
            String tipo = Optional.ofNullable(tx.getTipoTransaccion()).orElse("");
            if (!"COBRO".equalsIgnoreCase(tipo) && !"INGRESO".equalsIgnoreCase(tipo)) continue;
            if (!obrasValidas.contains(tx.getIdObra())) continue;

            BigDecimal monto = BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d));
            totalCobrosFacurado[0] = totalCobrosFacurado[0].add(monto);

            LocalDate fecha = tx.getFecha();
            if (fecha == null) fecha = LocalDate.now();

            Long obraId = tx.getIdObra();
            cobrosPorObraYFecha
                    .computeIfAbsent(obraId, k -> new TreeMap<>())
                    .merge(fecha, monto, BigDecimal::add);

            fechasUnicas.add(fecha);
        }

        // Calcular total facturado (suma de presupuestos de obras)
        for (Long obraId : obrasValidas) {
            ObraExternalDto obra = obrasPorId.get(obraId);
            if (obra != null && obra.getPresupuesto() != null) {
                totalCobrosFacurado[1] = totalCobrosFacurado[1].add(obra.getPresupuesto());
            }
        }

        // Construir filas (una por obra)
        List<CuentaCorrientePdfResponse.FilaObra> filas = new ArrayList<>();
        for (Long obraId : cobrosPorObraYFecha.keySet()) {
            ObraExternalDto obra = obrasPorId.get(obraId);
            CuentaCorrientePdfResponse.FilaObra fila = new CuentaCorrientePdfResponse.FilaObra();
            fila.setObraId(obraId);
            fila.setObraNombre(obra != null ? obra.getNombre() : ("Obra #" + obraId));

            // Mapear cobros por fecha
            Map<String, BigDecimal> cobrosPorFecha = new LinkedHashMap<>();
            BigDecimal saldoObra = BigDecimal.ZERO;
            for (LocalDate fecha : cobrosPorObraYFecha.get(obraId).entrySet()
                    .stream()
                    .sorted(Map.Entry.comparingByKey())
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList())) {
                BigDecimal monto = cobrosPorObraYFecha.get(obraId).get(fecha);
                cobrosPorFecha.put(fecha.toString(), monto);
                saldoObra = saldoObra.add(monto);
            }

            fila.setMovimientosPorFecha(cobrosPorFecha);
            fila.setSaldoObra(saldoObra);
            filas.add(fila);
        }

        response.setFechasUnicas(new ArrayList<>(fechasUnicas));
        response.setFilas(filas);
        response.setTotalCostos(totalCobrosFacurado[1]); // Para cliente, "costos" = facturado
        response.setTotalPagos(totalCobrosFacurado[0]);
        response.setSaldoFinal(totalCobrosFacurado[1].subtract(totalCobrosFacurado[0]));

        return response;
    }

    private boolean estadoGeneraSaldoCliente(String estado) {
        if (estado == null) return false;
        String normalizado = normalizarEstado(estado);
        return new HashSet<>(Arrays.asList(
                "ADJUDICADA", "EN_PROGRESO", "FINALIZADA", "COBRADA", "FACTURADA", "FACTURADA_PARCIAL"
        )).contains(normalizado);
    }

    // Filtros en cascada para deudas globales
    public List<FiltroResponse> obtenerObrasPorCliente(Long clienteId, Long proveedorId, Long obraId) {
        return deudasGlobalesRepository.obtenerObrasPorCliente(clienteId, proveedorId, obraId);
    }

    public List<FiltroResponse> obtenerProveedoresPorCliente(Long clienteId, Long proveedorId, Long obraId) {
        return deudasGlobalesRepository.obtenerProveedoresPorCliente(clienteId, proveedorId, obraId);
    }

    public List<FiltroResponse> obtenerObrasPorProveedor(Long proveedorId, Long clienteId, Long obraId) {
        return deudasGlobalesRepository.obtenerObrasPorProveedor(proveedorId, clienteId, obraId);
    }

    public List<FiltroResponse> obtenerClientesPorProveedor(Long proveedorId, Long clienteId, Long obraId) {
        return deudasGlobalesRepository.obtenerClientesPorProveedor(proveedorId, clienteId, obraId);
    }

    public List<FiltroResponse> obtenerProveedoresPorObra(Long obraId, Long clienteId, Long proveedorId) {
        return deudasGlobalesRepository.obtenerProveedoresPorObra(obraId, clienteId, proveedorId);
    }

    public List<FiltroResponse> obtenerClientesPorObra(Long obraId, Long clienteId, Long proveedorId) {
        return deudasGlobalesRepository.obtenerClientesPorObra(obraId, clienteId, proveedorId);
    }

    // ===== PDF BINARIOS (iText 7) =====

    /**
     * Genera PDF binario de cuenta corriente para cliente.
     */
    public byte[] generarCuentaCorrienteClientePdfBinario(Long clienteId, List<Long> obraIds) throws Exception {
        CuentaCorrientePdfResponse datos = generarCuentaCorrienteClientePdf(clienteId, obraIds);
        return construirPdfCuentaCorriente(datos, "Cliente: " + datos.getAsociadoNombre());
    }

    /**
     * Genera PDF binario de cuenta corriente para proveedor.
     */
    public byte[] generarCuentaCorrienteProveedorPdfBinario(Long proveedorId, List<Long> obraIds) throws Exception {
        CuentaCorrientePdfResponse datos = generarCuentaCorrienteProveedorPdf(proveedorId, obraIds);
        return construirPdfCuentaCorriente(datos, "Proveedor: " + datos.getAsociadoNombre());
    }

    /**
     * Genera PDF binario con ambas tablas (clientes y proveedores) lado a lado.
     */
    public byte[] generarCuentasCorrientesCombinaidasPdfBinario(ReportFilterRequest filtro) throws Exception {
        CuentasCorrientesCombindasResponse datos = generarCuentasCorrientesCombinadas(filtro);
        return construirPdfCuentasCombinadas(datos);
    }

    /**
     * Construye PDF de cuenta corriente genérico (cliente o proveedor).
     */
    private byte[] construirPdfCuentaCorriente(CuentaCorrientePdfResponse datos, String titulo) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        com.lowagie.text.Document doc = pdfBuilder.crearDocumento(baos);

        // Título
        doc.add(pdfBuilder.crearTituloSeccion(titulo));
        com.lowagie.text.Paragraph generado = new com.lowagie.text.Paragraph("Generado: " + pdfBuilder.getFechaHoy());
        generado.setFont(new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9));
        generado.setSpacingAfter(12);
        doc.add(generado);

        // Tabla de movimientos
        List<String> encabezados = new java.util.ArrayList<>();
        encabezados.add("Obra");
        for (LocalDate fecha : datos.getFechasUnicas()) {
            encabezados.add(new java.text.SimpleDateFormat("dd/MM/yyyy").format(
                java.sql.Date.valueOf(fecha)));
        }

        List<List<String>> filas = new java.util.ArrayList<>();
        for (CuentaCorrientePdfResponse.FilaObra fila : datos.getFilas()) {
            List<String> row = new java.util.ArrayList<>();
            row.add(fila.getObraNombre());
            for (LocalDate fecha : datos.getFechasUnicas()) {
                BigDecimal monto = fila.getMovimientosPorFecha().get(fecha.toString());
                row.add(monto != null ? pdfBuilder.formatMoneda(monto) : "—");
            }
            filas.add(row);
        }

        float[] widths = new float[encabezados.size()];
        widths[0] = 3;
        java.util.Arrays.fill(widths, 1, widths.length, 1.5f);

        com.lowagie.text.pdf.PdfPTable tabla = pdfBuilder.crearTabla(widths, encabezados, filas);
        doc.add(tabla);

        // Saldo final
        com.lowagie.text.Paragraph espacio = new com.lowagie.text.Paragraph(" ");
        espacio.setSpacingAfter(8);
        doc.add(espacio);

        List<String[]> filasTotal = java.util.List.of(
            new String[]{"Total costos/ingresos:", pdfBuilder.formatMoneda(datos.getTotalCostos())},
            new String[]{"Total pagos/cobros:", pdfBuilder.formatMoneda(datos.getTotalPagos())},
            new String[]{"SALDO FINAL:", pdfBuilder.formatMoneda(datos.getSaldoFinal())}
        );
        doc.add(pdfBuilder.crearTablaTotales(filasTotal));

        doc.close();
        return baos.toByteArray();
    }

    /**
     * Construye PDF con ambas tablas (clientes y proveedores).
     */
    private byte[] construirPdfCuentasCombinadas(CuentasCorrientesCombindasResponse datos) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        com.lowagie.text.Document doc = pdfBuilder.crearDocumento(baos);

        // Título principal
        com.lowagie.text.Paragraph titulo = new com.lowagie.text.Paragraph("Cuentas Corrientes Combinadas");
        titulo.setFont(new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 14, com.lowagie.text.Font.BOLD));
        titulo.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        titulo.setSpacingAfter(2);
        doc.add(titulo);

        com.lowagie.text.Paragraph generado = new com.lowagie.text.Paragraph("Generado: " + pdfBuilder.getFechaHoy());
        generado.setFont(new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9));
        generado.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        generado.setSpacingAfter(16);
        doc.add(generado);

        // Tabla CLIENTES
        if (!datos.getClientes().isEmpty()) {
            doc.add(pdfBuilder.crearTituloSeccion("Clientes"));
            doc.add(construirTablaResumenCtaCte(datos.getClientes()));
        }

        // Tabla PROVEEDORES
        if (!datos.getProveedores().isEmpty()) {
            doc.add(pdfBuilder.crearTituloSeccion("Proveedores"));
            doc.add(construirTablaResumenCtaCte(datos.getProveedores()));
        }

        doc.close();
        return baos.toByteArray();
    }

    /**
     * Construye una tabla resumida para múltiples cuentas corrientes.
     */
    private com.lowagie.text.pdf.PdfPTable construirTablaResumenCtaCte(
            List<CuentaCorrientePdfResponse> listaCuentas) {

        List<String> encabezados = new java.util.ArrayList<>();
        encabezados.add("Asociado");

        // Recolectar todas las fechas únicas
        java.util.Set<LocalDate> todasLasFechas = new java.util.TreeSet<>();
        for (CuentaCorrientePdfResponse cc : listaCuentas) {
            todasLasFechas.addAll(cc.getFechasUnicas());
        }

        for (LocalDate fecha : todasLasFechas) {
            encabezados.add(new java.text.SimpleDateFormat("dd/MM/yyyy").format(
                java.sql.Date.valueOf(fecha)));
        }
        encabezados.add("Saldo");

        List<List<String>> filas = new java.util.ArrayList<>();
        for (CuentaCorrientePdfResponse cc : listaCuentas) {
            List<String> row = new java.util.ArrayList<>();
            row.add(cc.getAsociadoNombre());
            for (LocalDate fecha : todasLasFechas) {
                BigDecimal monto = cc.getFilas().stream()
                    .flatMap(f -> f.getMovimientosPorFecha().entrySet().stream())
                    .filter(e -> e.getKey().equals(fecha.toString()))
                    .map(Map.Entry::getValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                row.add(monto.compareTo(BigDecimal.ZERO) != 0 ? pdfBuilder.formatMoneda(monto) : "—");
            }
            row.add(pdfBuilder.formatMoneda(cc.getSaldoFinal()));
            filas.add(row);
        }

        float[] widths = new float[encabezados.size()];
        widths[0] = 2;
        java.util.Arrays.fill(widths, 1, widths.length, 1f);

        return pdfBuilder.crearTabla(widths, encabezados, filas);
    }

    public DashboardGraficosResponse generarDashboardGraficos(int topN) {
        List<ObraExternalDto> obras = obrasClient.obtenerObras();
        if (obras == null) obras = java.util.Collections.emptyList();

        // distribucion de estados
        Map<String, Long> cuentaPorEstado = obras.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        o -> o.getObraEstado() != null ? o.getObraEstado() : "SIN_ESTADO",
                        java.util.stream.Collectors.counting()
                ));
        int totalObras = obras.size();
        List<DashboardGraficosResponse.EstadoConteoDto> distribucion = cuentaPorEstado.entrySet().stream()
                .map(e -> DashboardGraficosResponse.EstadoConteoDto.builder()
                        .estado(e.getKey())
                        .cantidad(e.getValue().intValue())
                        .porcentaje(totalObras > 0 ? (e.getValue() * 100.0 / totalObras) : 0)
                        .build())
                .sorted((a, b) -> Integer.compare(b.getCantidad(), a.getCantidad()))
                .collect(java.util.stream.Collectors.toList());

        // top obras financiero desde transacciones-service
        List<TopObraFinancieroExternalDto> topRaw = transaccionesClient.obtenerTopObras(topN);
        Map<Long, ObraExternalDto> obrasPorId = obras.stream()
                .collect(java.util.stream.Collectors.toMap(ObraExternalDto::getId, o -> o, (a, b) -> a));
        List<DashboardGraficosResponse.TopObraDto> topObras = topRaw.stream()
                .map(t -> {
                    ObraExternalDto obra = t.getObraId() != null ? obrasPorId.get(t.getObraId()) : null;
                    return DashboardGraficosResponse.TopObraDto.builder()
                            .obraId(t.getObraId())
                            .obraNombre(obra != null ? obra.getNombre() : "Obra #" + t.getObraId())
                            .presupuesto(obra != null && obra.getPresupuesto() != null ? obra.getPresupuesto() : BigDecimal.ZERO)
                            .totalCobros(t.getTotalCobros() != null ? t.getTotalCobros() : BigDecimal.ZERO)
                            .totalPagos(t.getTotalPagos() != null ? t.getTotalPagos() : BigDecimal.ZERO)
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());

        // kpis
        java.util.Set<String> ESTADOS_ACTIVOS = java.util.Set.of("PENDIENTE", "ADJUDICADA", "EN_PROGRESO");
        int obrasActivas = (int) obras.stream()
                .filter(o -> ESTADOS_ACTIVOS.contains(o.getObraEstado()))
                .count();
        BigDecimal presupuestoTotal = obras.stream()
                .map(o -> o.getPresupuesto() != null ? o.getPresupuesto() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCobros = topRaw.stream()
                .map(t -> t.getTotalCobros() != null ? t.getTotalCobros() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pctCobro = presupuestoTotal.compareTo(BigDecimal.ZERO) > 0
                ? totalCobros.multiply(BigDecimal.valueOf(100)).divide(presupuestoTotal, 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return DashboardGraficosResponse.builder()
                .distribucionEstados(distribucion)
                .topObras(topObras)
                .kpis(DashboardGraficosResponse.KpisGraficosDto.builder()
                        .totalObras(totalObras)
                        .obrasActivas(obrasActivas)
                        .presupuestoTotal(presupuestoTotal)
                        .porcentajeCobroGlobal(pctCobro)
                        .build())
                .build();
    }
}
