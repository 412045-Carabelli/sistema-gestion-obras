package com.reportes.service;

import com.reportes.client.ClientesClient;
import com.reportes.client.ObrasClient;
import com.reportes.client.ProveedoresClient;
import com.reportes.client.TransaccionesClient;
import com.reportes.dto.external.*;
import com.reportes.dto.request.EstadoObraFilterRequest;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.*;
import com.reportes.entity.Comision;
import com.reportes.entity.MovimientoReporte;
import com.reportes.repository.ComisionRepository;
import com.reportes.repository.MovimientoReporteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportesService {

    private final ObrasClient obrasClient;
    private final TransaccionesClient transaccionesClient;
    private final ClientesClient clientesClient;
    private final ProveedoresClient proveedoresClient;
    private final ComisionRepository comisionRepository;
    private final MovimientoReporteRepository movimientoReporteRepository;

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
                .map(obra -> Optional.ofNullable(obra.getPresupuesto()).orElse(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCostos = BigDecimal.ZERO;
        if (filtros.getClienteId() == null) {
            for (ObraExternalDto obra : obrasFiltradas) {
                List<ObraCostoExternalDto> costos = obrasClient.obtenerCostos(obra.getId());
                for (ObraCostoExternalDto costo : costos) {
                    if (Boolean.FALSE.equals(costo.getActivo())) continue;
                    if (filtros.getProveedorId() != null
                            && !Objects.equals(filtros.getProveedorId(), costo.getIdProveedor())) {
                        continue;
                    }
                    totalCostos = totalCostos.add(costoBase(costo));
                }
            }
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
        response.setPresupuesto(Optional.ofNullable(obra.getPresupuesto()).orElse(BigDecimal.ZERO));
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
        List<ObraExternalDto> obras = filtrarObras(filtros);
        Map<Long, ObraExternalDto> obrasPorId = mapearPorId(obras, ObraExternalDto::getId);
        Map<Long, ProveedorExternalDto> proveedores = mapearPorId(proveedoresClient.obtenerProveedores(), ProveedorExternalDto::getId);
        Map<Long, EstadoPagoExternalDto> estadosPago = mapearPorId(obrasClient.obtenerEstadosPago(), EstadoPagoExternalDto::getId);

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

                String estadoNombre = Optional.ofNullable(costo.getIdEstadoPago())
                        .map(estadosPago::get)
                        .map(EstadoPagoExternalDto::getEstado)
                        .orElse("Pendiente");

                if ("PAGADO".equalsIgnoreCase(estadoNombre)) {
                    continue;
                }

                PendientesResponse.Pendiente pendiente = new PendientesResponse.Pendiente();
                pendiente.setObraId(obra.getId());
                pendiente.setObraNombre(obra.getNombre());
                pendiente.setDescripcion(costo.getDescripcion());
                pendiente.setTotal(costoBase(costo));
                pendiente.setEstadoPago(estadoNombre);

                ProveedorExternalDto proveedor = proveedores.get(costo.getIdProveedor());
                if (proveedor != null) {
                    pendiente.setProveedorId(proveedor.getId());
                    pendiente.setProveedorNombre(proveedor.getNombre());
                }

                response.getPendientes().add(pendiente);
            }
        }

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
        List<TransaccionExternalDto> transacciones = transaccionesClient.obtenerTransacciones();

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
        response.setCostoTotal(totalCostos);
        response.setPagosRecibidos(pagosRecibidos);
        response.setSaldoPendiente(saldoPositivo(totalCostos.subtract(pagosRecibidos)));

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

        BigDecimal costos = BigDecimal.ZERO;
        BigDecimal pagosAcum = BigDecimal.ZERO;
        CuentaCorrienteProveedorResponse response = new CuentaCorrienteProveedorResponse();
        response.setProveedorId(proveedorId);
        ProveedorExternalDto proveedor = proveedores.get(proveedorId);
        response.setProveedorNombre(proveedor != null ? proveedor.getNombre() : null);

        List<CuentaCorrienteProveedorResponse.Movimiento> movimientos = new ArrayList<>();

        for (ObraExternalDto obra : obras) {
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
                movimiento.setConcepto(costo.getDescripcion());
                movimiento.setFecha(obra.getFechaInicio() != null ? obra.getFechaInicio().toLocalDate() : null);
                movimientos.add(movimiento);
                guardarMovimiento("COSTO_PROVEEDOR", total, obra.getNombre());
            }
        }

        BigDecimal pagos = transaccionesClient.obtenerTransacciones().stream()
                .filter(tx -> Objects.equals(tx.getIdAsociado(), proveedorId))
                .filter(tx -> "PAGO".equalsIgnoreCase(Optional.ofNullable(tx.getTipoTransaccion()).orElse("")))
                .map(tx -> {
                    CuentaCorrienteProveedorResponse.Movimiento movimiento = new CuentaCorrienteProveedorResponse.Movimiento();
                    movimiento.setTipo("PAGO");
                    movimiento.setMonto(BigDecimal.valueOf(Optional.ofNullable(tx.getMonto()).orElse(0d)));
                    ObraExternalDto obra = obrasPorId.get(tx.getIdObra());
                    movimiento.setObraId(tx.getIdObra());
                    movimiento.setObraNombre(obra != null ? obra.getNombre() : null);
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

        BigDecimal costosAcum = BigDecimal.ZERO;
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
        response.setMovimientos(movimientos);

        response.setCostos(costos);
        response.setPagos(pagos);
        response.setSaldo(saldoPositivo(costos.subtract(pagos)));
        return response;
    }

    public ComisionesResponse generarComisionesPorObra(Long obraId) {
        ComisionesResponse response = new ComisionesResponse();
        ObraExternalDto obra = obrasClient.obtenerObra(obraId).orElse(null);
        List<Comision> comisiones = comisionRepository.findByIdObra(obraId);

        BigDecimal totalPagos = BigDecimal.ZERO;
        BigDecimal totalComisiones = BigDecimal.ZERO;

        for (Comision comision : comisiones) {
            ComisionesResponse.Detalle detalle = new ComisionesResponse.Detalle();
            detalle.setObraId(obraId);
            detalle.setObraNombre(obra != null ? obra.getNombre() : null);
            detalle.setMonto(Optional.ofNullable(comision.getMonto()).orElse(BigDecimal.ZERO));
            detalle.setPagos(Boolean.TRUE.equals(comision.getPagado()) ? detalle.getMonto() : BigDecimal.ZERO);
            detalle.setSaldo(saldoPositivo(detalle.getMonto().subtract(detalle.getPagos())));
            response.getDetalle().add(detalle);

            totalComisiones = totalComisiones.add(detalle.getMonto());
            totalPagos = totalPagos.add(detalle.getPagos());
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
                detalle.setPagos(BigDecimal.ZERO);
                detalle.setSaldo(monto);
                response.getDetalle().add(detalle);
                totalComisiones = totalComisiones.add(monto);
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

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal pagos = BigDecimal.ZERO;
        Set<Long> obrasConComisionRegistrada = new HashSet<>();

        for (Comision comision : comisiones) {
            obrasConComisionRegistrada.add(comision.getIdObra());
            ComisionesResponse.Detalle detalle = new ComisionesResponse.Detalle();
            detalle.setObraId(comision.getIdObra());
            ObraExternalDto obra = obrasPorId.get(comision.getIdObra());
            detalle.setObraNombre(obra != null ? obra.getNombre() : null);
            detalle.setMonto(Optional.ofNullable(comision.getMonto()).orElse(BigDecimal.ZERO));
            detalle.setPagos(Boolean.TRUE.equals(comision.getPagado()) ? detalle.getMonto() : BigDecimal.ZERO);
            detalle.setSaldo(saldoPositivo(detalle.getMonto().subtract(detalle.getPagos())));
            response.getDetalle().add(detalle);
            total = total.add(detalle.getMonto());
            pagos = pagos.add(detalle.getPagos());
            guardarMovimiento("COMISION_GENERAL", detalle.getMonto(), detalle.getObraNombre());
        }

        // Incluir comisiones configuradas en las obras que no tengan registros en la tabla local
        for (ObraExternalDto obra : obrasPorId.values()) {
            if (!Boolean.TRUE.equals(obra.getTieneComision())) {
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
            detalle.setPagos(BigDecimal.ZERO);
            detalle.setSaldo(monto);
            response.getDetalle().add(detalle);
            total = total.add(monto);
        }

        response.setTotalComision(total);
        response.setTotalPagos(pagos);
        response.setSaldo(saldoPositivo(total.subtract(pagos)));
        return response;
    }

    public ComisionesFrontResponse generarComisiones(ReportFilterRequest filtro) {
        ReportFilterRequest filtros = filtroSeguro(filtro);
        List<ObraExternalDto> obrasFiltradas = filtrarObras(filtros);
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
                .collect(Collectors.toList());
    }

    private List<ObraExternalDto> filtrarObrasConDeuda(ReportFilterRequest filtro) {
        return filtrarObras(filtro).stream()
                .filter(obra -> !estadoExcluido(obra.getObraEstado()))
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
        return transaccionesClient.obtenerTransacciones().stream()
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
        return transaccionesClient.obtenerTransacciones().stream()
                .filter(tx -> Objects.equals(tx.getIdObra(), obraId))
                .collect(Collectors.toList());
    }

    private <T, K> Map<K, T> mapearPorId(List<T> lista, Function<T, K> extractor) {
        return lista.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(extractor, Function.identity(), (a, b) -> a, LinkedHashMap::new));
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
        BigDecimal porcentaje = Optional.ofNullable(obra.getComision()).orElse(BigDecimal.ZERO);
        BigDecimal presupuesto = Optional.ofNullable(obra.getPresupuesto()).orElse(BigDecimal.ZERO);
        if (porcentaje.compareTo(BigDecimal.ZERO) <= 0 || presupuesto.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return presupuesto
                .multiply(porcentaje)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
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
        return saldo.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldo;
    }

    private boolean estadoExcluido(String estado) {
        if (estado == null) return false;
        String normalizado = estado.trim().toUpperCase();
        return "PRESUPUESTADA".equals(normalizado)
                || "PERDIDA".equals(normalizado)
                || "COTIZADA".equals(normalizado);
    }

    private BigDecimal costoBase(ObraCostoExternalDto costo) {
        if (costo == null) return BigDecimal.ZERO;
        if (costo.getSubtotal() != null) return costo.getSubtotal();
        if (costo.getCantidad() != null && costo.getPrecioUnitario() != null) {
            return costo.getCantidad().multiply(costo.getPrecioUnitario());
        }
        return Optional.ofNullable(costo.getTotal()).orElse(BigDecimal.ZERO);
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
                .count();
        long completadas = tareas.stream()
                .filter(t -> filtroPorObra(obra, t))
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
}
