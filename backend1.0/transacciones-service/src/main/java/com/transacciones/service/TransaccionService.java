package com.transacciones.service;

import com.transacciones.dto.ObraCostoDto;
import com.transacciones.dto.ObraResumenDto;
import com.transacciones.dto.TransaccionDto;
import com.transacciones.dto.MovimientoRecenteDTO;
import com.transacciones.dto.ObraNombreDto;
import com.transacciones.dto.TransaccionConAsociadoDto;
import com.transacciones.dto.AsociadoNombreDto;
import com.transacciones.entity.Transaccion;
import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private static final Logger log = LoggerFactory.getLogger(TransaccionService.class);

    private final TransaccionRepository transaccionRepository;
    private final ObraCostoClient obraCostoClient;
    private final RestTemplate restTemplate;

    @Value("${services.obras.url}")
    private String obrasServiceUrl;

    @Value("${services.clientes.url}")
    private String clientesServiceUrl;

    @Value("${services.proveedores.url}")
    private String proveedoresServiceUrl;

    public List<TransaccionDto> listar() {
        return transaccionRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TransaccionDto> listar(Long organizacionId) {
        List<Transaccion> lista = (organizacionId != null && organizacionId > 0)
                ? transaccionRepository.findByOrganizacionId(organizacionId)
                : transaccionRepository.findAll();
        return lista.stream().map(this::toDto).collect(Collectors.toList());
    }

    public TransaccionDto crear(Transaccion dto) {
        if (dto.getTipo_transaccion() == null) {
            throw new IllegalArgumentException("Debe especificarse un tipo de transaccion valido");
        }
        validarTipoAsociado(dto);
        validarMontoContraPresupuesto(dto);

        Transaccion entity = Transaccion.builder()
                .organizacionId(dto.getOrganizacionId())
                .idObra(dto.getIdObra())
                .idAsociado(dto.getIdAsociado())
                .tipoAsociado(dto.getTipoAsociado())
                .tipo_transaccion(dto.getTipo_transaccion())
                .fecha(dto.getFecha())
                .monto(dto.getMonto())
                .forma_pago(dto.getForma_pago())
                .medio_pago(dto.getMedio_pago())
                .concepto(dto.getConcepto())
                .facturaCobrada(dto.getFacturaCobrada())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .bajaObra(Boolean.FALSE)
                .build();

        Transaccion guardado = transaccionRepository.save(entity);
        return toDto(guardado);
    }

    public TransaccionDto obtener(Long id) {
        Transaccion entity = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaccion no encontrada"));
        return toDto(entity);
    }

    public TransaccionDto actualizar(Long id, Transaccion dto) {
        Transaccion entity = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaccion no encontrada"));

        if (dto.getTipo_transaccion() == null) {
            throw new IllegalArgumentException("Debe especificarse un tipo de transaccion valido");
        }
        validarTipoAsociado(dto);
        validarMontoContraPresupuesto(dto, entity);

        entity.setIdObra(dto.getIdObra());
        entity.setIdAsociado(dto.getIdAsociado());
        entity.setTipoAsociado(dto.getTipoAsociado());
        entity.setTipo_transaccion(dto.getTipo_transaccion());
        entity.setFecha(dto.getFecha());
        entity.setMonto(dto.getMonto());
        entity.setForma_pago(dto.getForma_pago());
        entity.setMedio_pago(dto.getMedio_pago());
        entity.setConcepto(dto.getConcepto());
        entity.setFacturaCobrada(dto.getFacturaCobrada());
        entity.setActivo(dto.getActivo());
        if (dto.getActivo() != null && !dto.getActivo()) {
            entity.setBajaObra(Boolean.FALSE);
        }

        Transaccion guardado = transaccionRepository.save(entity);
        return toDto(guardado);
    }

    public void eliminar(Long id) {
        if (!transaccionRepository.existsById(id)) {
            throw new RuntimeException("La transaccion no existe");
        }
        transaccionRepository.deleteById(id);
    }

    @Transactional
    public void desactivarPorObra(Long obraId) {
        transaccionRepository.softDeleteByObraId(obraId);
    }

    @Transactional
    public void activarPorObra(Long obraId) {
        transaccionRepository.activarPorObraId(obraId);
    }

    @Transactional(readOnly = true)
    public List<TransaccionDto> listarPorObra(Long obraId) {
        return transaccionRepository.findByIdObraAndActivoTrue(obraId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransaccionDto> findByTipoAsociado(String tipo, Long idAsociado) {
        return transaccionRepository.findByTipoAsociadoAndIdAsociadoAndActivoTrue(tipo, idAsociado)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TransaccionDto registrarPagoComision(Long obraId, Double monto, LocalDate fecha) {
        if (obraId == null) {
            throw new IllegalArgumentException("obraId es requerido");
        }

        ObraResumenDto obra = obraCostoClient.obtenerObra(obraId);
        if (obra == null) {
            throw new IllegalArgumentException("Obra no encontrada");
        }
        validarEstadoObra(obra);
        if (!Boolean.TRUE.equals(obra.getTiene_comision())) {
            throw new IllegalArgumentException("La obra no tiene comisión configurada");
        }

        double montoFinal = monto != null ? monto : (obra.getComision_monto() != null ? obra.getComision_monto() : 0d);
        if (montoFinal <= 0) {
            throw new IllegalArgumentException("Monto de comisión inválido");
        }

        boolean yaPagada = transaccionRepository
                .findByIdObraAndTipoAsociadoAndIdAsociado(obraId, "COMISION", 0L)
                .stream()
                .anyMatch(t -> t.getTipo_transaccion() == TipoTransaccionEnum.PAGO && Boolean.TRUE.equals(t.getActivo()));
        if (yaPagada) {
            throw new IllegalStateException("La comisión ya fue pagada");
        }

        Transaccion entity = Transaccion.builder()
                .idObra(obraId)
                .idAsociado(0L)
                .tipoAsociado("COMISION")
                .tipo_transaccion(TipoTransaccionEnum.PAGO)
                .fecha(fecha != null ? fecha : LocalDate.now())
                .monto(montoFinal)
                .forma_pago("TOTAL")
                .medio_pago(null)
                .facturaCobrada(null)
                .activo(true)
                .build();

        Transaccion guardado = transaccionRepository.save(entity);
        return toDto(guardado);
    }

    private TransaccionDto toDto(Transaccion transaccion) {
        if (transaccion == null) return null;

        TransaccionDto dto = TransaccionDto.builder()
                .id(transaccion.getId())
                .id_obra(transaccion.getIdObra())
                .id_asociado(transaccion.getIdAsociado())
                .tipo_asociado(transaccion.getTipoAsociado())
                .tipo_transaccion(transaccion.getTipo_transaccion())
                .fecha(transaccion.getFecha())
                .monto(transaccion.getMonto())
                .forma_pago(transaccion.getForma_pago())
                .medio_pago(transaccion.getMedio_pago())
                .concepto(transaccion.getConcepto())
                .factura_cobrada(transaccion.getFacturaCobrada())
                .activo(transaccion.getActivo())
                .ultima_actualizacion(transaccion.getUltimaActualizacion())
                .tipo_actualizacion(transaccion.getTipoActualizacion())
                .build();

        completarPagadoRestante(transaccion, dto);
        return dto;
    }

    private void completarPagadoRestante(Transaccion transaccion, TransaccionDto dto) {
        if (transaccion == null || dto == null) return;
        if (transaccion.getTipo_transaccion() == null) return;

        String tipoAsociado = transaccion.getTipoAsociado() == null ? "" : transaccion.getTipoAsociado().toUpperCase();
        if (transaccion.getTipo_transaccion() == TipoTransaccionEnum.COBRO
                && "CLIENTE".equals(tipoAsociado)
                && transaccion.getIdObra() != null) {
            try {
                ObraResumenDto obra = obraCostoClient.obtenerObra(transaccion.getIdObra());
                if (obra == null || obra.getPresupuesto() == null) return;
                Double cobrado = transaccionRepository.sumarCobrosPorObra(transaccion.getIdObra());
                double cobradoVal = cobrado != null ? cobrado : 0d;
                dto.setPagado(cobradoVal);
                dto.setRestante(Math.max(0d, obra.getPresupuesto() - cobradoVal));
            } catch (Exception ex) {
                log.debug("No se pudo calcular pagado/restante para obra {}", transaccion.getIdObra(), ex);
            }
        }
    }

    private Long mapTipoTransaccionToId(TipoTransaccionEnum e) {
        return (long) (e.ordinal() + 1);
    }

    private void validarTipoAsociado(Transaccion dto) {
        if (dto == null) return;
        String tipoAsociado = dto.getTipoAsociado() == null ? "" : dto.getTipoAsociado().toUpperCase();
        if ("COMISION".equals(tipoAsociado)) {
            throw new IllegalArgumentException("Las comisiones deben registrarse desde el endpoint dedicado");
        }
        if ("CLIENTE".equals(tipoAsociado) && dto.getTipo_transaccion() != TipoTransaccionEnum.COBRO) {
            throw new IllegalArgumentException("Para clientes solo se permite COBRO");
        }
        if ("PROVEEDOR".equals(tipoAsociado) && dto.getTipo_transaccion() != TipoTransaccionEnum.PAGO) {
            throw new IllegalArgumentException("Para proveedores solo se permite PAGO");
        }
    }

    private void validarMontoContraPresupuesto(Transaccion dto) {
        validarMontoContraPresupuesto(dto, null);
    }

    private void validarMontoContraPresupuesto(Transaccion dto, Transaccion existente) {
        if (dto == null) return;
        if (dto.getIdObra() == null) return;

        String tipoAsociado = dto.getTipoAsociado() == null ? "" : dto.getTipoAsociado().toUpperCase();
        String formaPago = dto.getForma_pago() == null ? "" : dto.getForma_pago().toUpperCase();
        if (!"TOTAL".equals(formaPago) && !"PARCIAL".equals(formaPago)) {
            throw new IllegalArgumentException("Debe especificarse la condicion de pago (TOTAL o PARCIAL)");
        }

        if ("CLIENTE".equals(tipoAsociado) && dto.getTipo_transaccion() == TipoTransaccionEnum.COBRO) {
            validarMontoCobroCliente(dto, existente, formaPago);
            return;
        }

        if ("PROVEEDOR".equals(tipoAsociado) && dto.getTipo_transaccion() == TipoTransaccionEnum.PAGO) {
            validarMontoPagoProveedor(dto, existente, formaPago);
        }
    }

    private void validarMontoCobroCliente(Transaccion dto, Transaccion existente, String formaPago) {

        ObraResumenDto obra = obraCostoClient.obtenerObra(dto.getIdObra());
        if (obra == null || obra.getPresupuesto() == null) {
            throw new IllegalArgumentException("Presupuesto de la obra no encontrado para validar el cobro");
        }
        validarEstadoObra(obra);

        double monto = dto.getMonto() != null ? dto.getMonto() : 0;
        double presupuesto = obra.getPresupuesto();
        double cobrosPrevios = Optional.ofNullable(transaccionRepository.sumarCobrosPorObra(dto.getIdObra()))
                .orElse(0d);
        if (existente != null
                && existente.getIdObra() != null
                && existente.getIdObra().equals(dto.getIdObra())
                && existente.getTipo_transaccion() == TipoTransaccionEnum.COBRO
                && "CLIENTE".equalsIgnoreCase(existente.getTipoAsociado())) {
            cobrosPrevios -= Optional.ofNullable(existente.getMonto()).orElse(0d);
        }
        double totalDespues = cobrosPrevios + monto;
        double diferencia = Math.abs(totalDespues - presupuesto);
        double restante = Math.max(0d, presupuesto - cobrosPrevios);

        if (monto - restante > 0.01) {
            throw new IllegalArgumentException("El monto no puede superar el restante de la obra");
        }
        if ("TOTAL".equals(formaPago) && diferencia >= 0.01) {
            throw new IllegalArgumentException("Para cobro total, el monto debe completar el presupuesto total de la obra");
        }
        if ("PARCIAL".equals(formaPago) && totalDespues >= presupuesto) {
            throw new IllegalArgumentException("Para cobro parcial, el monto no debe completar el presupuesto total de la obra");
        }
    }

    private void validarMontoPagoProveedor(Transaccion dto, Transaccion existente, String formaPago) {
        if (dto.getIdAsociado() == null) return;

        ObraResumenDto obra = obraCostoClient.obtenerObra(dto.getIdObra());
        if (obra == null) {
            throw new IllegalArgumentException("Obra no encontrada para validar el pago");
        }
        validarEstadoObra(obra);

        List<ObraCostoDto> costos = obraCostoClient.obtenerCostos(dto.getIdObra());
        double totalProveedor = costos.stream()
                .filter(c -> c != null && c.getId_proveedor() != null)
                .filter(c -> c.getId_proveedor().equals(dto.getIdAsociado()))
                .mapToDouble(this::getMontoBaseCosto)
                .sum();

        double pagosPrevios = transaccionRepository
                .findByIdObraAndTipoAsociadoAndIdAsociado(dto.getIdObra(), "PROVEEDOR", dto.getIdAsociado())
                .stream()
                .filter(t -> t.getTipo_transaccion() == TipoTransaccionEnum.PAGO)
                .mapToDouble(t -> Optional.ofNullable(t.getMonto()).orElse(0d))
                .sum();

        if (existente != null
                && existente.getIdObra() != null
                && existente.getIdObra().equals(dto.getIdObra())
                && existente.getTipo_transaccion() == TipoTransaccionEnum.PAGO
                && "PROVEEDOR".equalsIgnoreCase(existente.getTipoAsociado())
                && existente.getIdAsociado() != null
                && existente.getIdAsociado().equals(dto.getIdAsociado())) {
            pagosPrevios -= Optional.ofNullable(existente.getMonto()).orElse(0d);
        }

        double restante = Math.max(0d, totalProveedor - pagosPrevios);
        double monto = dto.getMonto() != null ? dto.getMonto() : 0d;
        double diferencia = Math.abs(monto - restante);

        if (monto - restante > 0.01) {
            throw new IllegalArgumentException("El monto no puede superar el saldo del proveedor");
        }
        if ("TOTAL".equals(formaPago) && diferencia >= 0.01) {
            throw new IllegalArgumentException("Para pago total, el monto debe completar el saldo del proveedor");
        }
        if ("PARCIAL".equals(formaPago) && monto >= restante) {
            throw new IllegalArgumentException("Para pago parcial, el monto debe ser menor al saldo del proveedor");
        }
    }

    private double getMontoBaseCosto(ObraCostoDto costo) {
        if (costo == null) return 0d;

        // Priorizar monto_real si está registrado
        if (costo.getMonto_real() != null && costo.getMonto_real() > 0) {
            return costo.getMonto_real();
        }

        // Si no, usar subtotal
        if (costo.getSubtotal() != null) return costo.getSubtotal();

        // Si no hay subtotal, calcular
        double cantidad = costo.getCantidad() != null ? costo.getCantidad() : 0d;
        double precio = costo.getPrecio_unitario() != null ? costo.getPrecio_unitario() : 0d;
        return cantidad * precio;
    }

    private void validarEstadoObra(ObraResumenDto obra) {
        String estado = obra.getObra_estado() == null ? "" : obra.getObra_estado().trim().toUpperCase().replaceAll("\\s+", "_");
        if (!"ADJUDICADA".equals(estado) && !"EN_PROGRESO".equals(estado) && !"FINALIZADA".equals(estado)) {
            throw new IllegalArgumentException("La obra debe estar Adjudicada, En progreso o Finalizada para registrar movimientos");
        }
    }

    @Transactional(readOnly = true)
    public List<MovimientoRecenteDTO> obtenerUltimos10Movimientos(Long organizacionId) {
        List<Transaccion> movimientos = (organizacionId != null && organizacionId > 0
                ? transaccionRepository.obtenerMovimientosActivosPorOrganizacion(organizacionId)
                : transaccionRepository.obtenerMovimientosActivos())
                .stream()
                .limit(10)
                .collect(Collectors.toList());

        // Recolectar IDs únicos de obras para bulk loading (evita N+1)
        Set<Long> obraIds = movimientos.stream()
                .map(Transaccion::getIdObra)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Obtener nombres en bulk si hay obras
        Map<Long, String> obraNombres = obraIds.isEmpty()
            ? new HashMap<>()
            : obtenerNombresObrasPorBatch(new ArrayList<>(obraIds));

        // Mapear transacciones con nombres precargados
        return movimientos.stream()
                .map(t -> toMovimientoRecenteDTO(t, obraNombres.getOrDefault(t.getIdObra(), null)))
                .collect(Collectors.toList());
    }

    private MovimientoRecenteDTO toMovimientoRecenteDTO(Transaccion transaccion) {
        return toMovimientoRecenteDTO(transaccion, null);
    }

    private MovimientoRecenteDTO toMovimientoRecenteDTO(Transaccion transaccion, String obraNombre) {
        if (transaccion == null) return null;

        return MovimientoRecenteDTO.builder()
                .id(transaccion.getId())
                .obraId(transaccion.getIdObra())
                .obraNombre(obraNombre)
                .asociadoId(transaccion.getIdAsociado())
                .asociadoTipo(transaccion.getTipoAsociado())
                .tipoTransaccion(transaccion.getTipo_transaccion() != null ? transaccion.getTipo_transaccion().toString() : null)
                .fecha(transaccion.getFecha())
                .monto(transaccion.getMonto())
                .formaPago(transaccion.getForma_pago())
                .medioPago(transaccion.getMedio_pago())
                .concepto(transaccion.getConcepto())
                .build();
    }

    /**
     * Obtiene el nombre de una obra con caché para evitar múltiples llamadas.
     * Útil cuando se necesita el nombre de forma individual.
     */
    @Cacheable(value = "obraNombres", key = "#obraId")
    public String obtenerNombreObra(Long obraId) {
        try {
            String url = String.format("%s/%s", obrasServiceUrl, obraId);
            ObraNombreDto obra = restTemplate.getForObject(url, ObraNombreDto.class);
            return obra != null ? obra.getNombre() : null;
        } catch (Exception e) {
            log.warn("Error obteniendo nombre de obra {}", obraId, e);
            return null;
        }
    }

    /**
     * Obtiene múltiples nombres de obras en una sola llamada (bulk).
     * Evita N+1 problem cuando se necesitan nombres de varias obras.
     * Fallback: si el endpoint no existe, obtiene uno a uno con caché.
     */
    private Map<Long, String> obtenerNombresObrasPorBatch(List<Long> obraIds) {
        Map<Long, String> resultado = new HashMap<>();

        if (obraIds == null || obraIds.isEmpty()) {
            return resultado;
        }

        try {
            // Intenta llamada bulk si el endpoint existe
            // TODO: agregar endpoint en obras-service: GET /api/obras/bulk?ids=1,2,3
            // String url = obrasServiceUrl + "/bulk?ids=" + String.join(",", obraIds.stream().map(String::valueOf).collect(Collectors.toList()));
            // List<ObraNombreDto> obras = restTemplate.exchange(url, HttpMethod.GET, null,
            //         new ParameterizedTypeReference<List<ObraNombreDto>>() {}).getBody();
            // if (obras != null) {
            //     obras.forEach(o -> resultado.put(o.getId(), o.getNombre()));
            //     return resultado;
            // }

            // Fallback: obtener de uno en uno con caché
            for (Long id : obraIds) {
                String nombre = obtenerNombreObra(id); // Usa caché
                if (nombre != null) {
                    resultado.put(id, nombre);
                }
            }
        } catch (Exception e) {
            log.warn("Error en bulk loading de obras, usando fallback", e);
            // Fallback: obtener de uno en uno con caché
            for (Long id : obraIds) {
                String nombre = obtenerNombreObra(id);
                if (nombre != null) {
                    resultado.put(id, nombre);
                }
            }
        }

        return resultado;
    }

    /**
     * Lista transacciones paginadas enriquecidas con nombres de asociados (cliente o proveedor).
     * Devuelve un Map con contenido paginado compatible con frontend.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listarConAsociadosPaginado(Pageable pageable) {
        Page<Transaccion> page = transaccionRepository.findAll(pageable);
        List<Transaccion> txList = page.getContent();

        // Pre-warm cache: fetch unique IDs first, then map uses cached values (no N+1)
        txList.stream().map(Transaccion::getIdObra).filter(Objects::nonNull).distinct()
                .forEach(this::obtenerNombreObra);
        txList.stream()
                .filter(t -> "CLIENTE".equals(t.getTipoAsociado()) && t.getIdAsociado() != null)
                .map(Transaccion::getIdAsociado).distinct()
                .forEach(this::obtenerNombreCliente);
        txList.stream()
                .filter(t -> "PROVEEDOR".equals(t.getTipoAsociado()) && t.getIdAsociado() != null)
                .map(Transaccion::getIdAsociado).distinct()
                .forEach(this::obtenerNombreProveedor);

        List<TransaccionConAsociadoDto> content = txList.stream()
                .map(this::toTransaccionConAsociadoDto)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("currentPage", page.getNumber());
        response.put("pageSize", page.getSize());
        response.put("isFirst", page.isFirst());
        response.put("isLast", page.isLast());
        return response;
    }

    /**
     * Convierte una Transaccion a TransaccionConAsociadoDto enriquecido con nombre del asociado y obra.
     */
    private TransaccionConAsociadoDto toTransaccionConAsociadoDto(Transaccion transaccion) {
        if (transaccion == null) return null;

        TransaccionConAsociadoDto dto = TransaccionConAsociadoDto.builder()
                .id(transaccion.getId())
                .id_obra(transaccion.getIdObra())
                .nombre_obra(obtenerNombreObra(transaccion.getIdObra()))
                .id_asociado(transaccion.getIdAsociado())
                .tipo_asociado(transaccion.getTipoAsociado())
                .tipo_transaccion(transaccion.getTipo_transaccion())
                .fecha(transaccion.getFecha())
                .monto(transaccion.getMonto())
                .forma_pago(transaccion.getForma_pago())
                .medio_pago(transaccion.getMedio_pago())
                .concepto(transaccion.getConcepto())
                .factura_cobrada(transaccion.getFacturaCobrada())
                .activo(transaccion.getActivo())
                .ultima_actualizacion(transaccion.getUltimaActualizacion())
                .tipo_actualizacion(transaccion.getTipoActualizacion())
                .build();

        // Enriquecer con nombre del asociado
        dto.setNombre_asociado(obtenerNombreAsociado(transaccion.getTipoAsociado(), transaccion.getIdAsociado()));

        // Completar pagado/restante
        completarPagadoRestante(transaccion, dto);

        return dto;
    }

    /**
     * Obtiene el nombre del cliente o proveedor según el tipo.
     */
    private String obtenerNombreAsociado(String tipo, Long id) {
        if (tipo == null || id == null) return null;
        if ("COMISION".equals(tipo)) return "Comisión";

        try {
            if ("CLIENTE".equals(tipo)) {
                return obtenerNombreCliente(id);
            } else if ("PROVEEDOR".equals(tipo)) {
                return obtenerNombreProveedor(id);
            }
        } catch (Exception e) {
            log.warn("Error obteniendo nombre de asociado tipo {} id {}", tipo, id, e);
        }
        return null;
    }

    /**
     * Obtiene el nombre del cliente por ID con caché.
     */
    @Cacheable(value = "clienteNombres", key = "#id")
    public String obtenerNombreCliente(Long id) {
        try {
            String url = String.format("%s/%d", clientesServiceUrl, id);
            AsociadoNombreDto cliente = restTemplate.getForObject(url, AsociadoNombreDto.class);
            return cliente != null ? cliente.getNombre() : null;
        } catch (Exception e) {
            log.debug("Error obteniendo nombre de cliente {}", id, e);
            return null;
        }
    }

    /**
     * Obtiene el nombre del proveedor por ID con caché.
     */
    @Cacheable(value = "proveedorNombres", key = "#id")
    public String obtenerNombreProveedor(Long id) {
        try {
            String url = String.format("%s/%d", proveedoresServiceUrl, id);
            AsociadoNombreDto proveedor = restTemplate.getForObject(url, AsociadoNombreDto.class);
            return proveedor != null ? proveedor.getNombre() : null;
        } catch (Exception e) {
            log.debug("Error obteniendo nombre de proveedor {}", id, e);
            return null;
        }
    }

    /**
     * Variante de completarPagadoRestante que acepta TransaccionConAsociadoDto.
     */
    private void completarPagadoRestante(Transaccion transaccion, TransaccionConAsociadoDto dto) {
        if (transaccion == null || dto == null) return;
        if (transaccion.getTipo_transaccion() == null) return;

        String tipoAsociado = transaccion.getTipoAsociado() == null ? "" : transaccion.getTipoAsociado().toUpperCase();
        if (transaccion.getTipo_transaccion() == TipoTransaccionEnum.COBRO
                && "CLIENTE".equals(tipoAsociado)
                && transaccion.getIdObra() != null) {
            try {
                ObraResumenDto obra = obraCostoClient.obtenerObra(transaccion.getIdObra());
                if (obra == null || obra.getPresupuesto() == null) return;
                Double cobrado = transaccionRepository.sumarCobrosPorObra(transaccion.getIdObra());
                double cobradoVal = cobrado != null ? cobrado : 0d;
                dto.setPagado(cobradoVal);
                dto.setRestante(Math.max(0d, obra.getPresupuesto() - cobradoVal));
            } catch (Exception ex) {
                log.debug("No se pudo calcular pagado/restante para obra {}", transaccion.getIdObra(), ex);
            }
        }
    }
}
