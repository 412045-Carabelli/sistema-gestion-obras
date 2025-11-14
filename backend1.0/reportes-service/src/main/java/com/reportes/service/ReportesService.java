package com.reportes.service;

import com.reportes.client.ClientesClient;
import com.reportes.client.ObrasClient;
import com.reportes.client.ProveedoresClient;
import com.reportes.client.TransaccionesClient;
import com.reportes.dto.external.*;
import com.reportes.dto.request.EstadoObraFilterRequest;
import com.reportes.dto.request.ReportFilterRequest;
import com.reportes.dto.response.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
                pendiente.setTotal(Optional.ofNullable(costo.getTotal()).orElse(BigDecimal.ZERO));
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
                BigDecimal total = Optional.ofNullable(costo.getTotal()).orElse(BigDecimal.ZERO);
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
                item.setTotalCostos(item.getTotalCostos().add(Optional.ofNullable(costo.getTotal()).orElse(BigDecimal.ZERO)));
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
                .filter(tx -> filtro.getProveedorId() == null || (Objects.equals(tx.getIdAsociado(), filtro.getProveedorId())
                        && "PROVEEDOR".equalsIgnoreCase(tx.getTipoAsociado())))
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
