package com.clientes.service.impl;

import com.clientes.client.ObrasClient;
import com.clientes.client.TransaccionesClient;
import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.dto.ObraClienteResponse;
import com.clientes.dto.TransaccionExternalDto;
import com.clientes.entity.Cliente;
import com.clientes.entity.CondicionIva;
import com.clientes.exception.ClienteNotFoundException;
import com.clientes.exception.InvalidClienteException;
import com.clientes.repository.ClienteRepository;
import com.clientes.service.ClienteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.text.Normalizer;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClienteServiceImpl implements ClienteService {

    private static final Map<String, CondicionIva> CONDICIONES_IVA_VALIDAS = Map.of(
            "MONOTRIBUTO", CondicionIva.MONOTRIBUTO,
            "RESPONSABLE_INSCRIPTO", CondicionIva.RESPONSABLE_INSCRIPTO,
            "EXENTO", CondicionIva.EXENTO,
            "CONSUMIDOR_FINAL", CondicionIva.CONSUMIDOR_FINAL
    );

    private final ClienteRepository repository;
    private final ObrasClient obrasClient;
    private final TransaccionesClient transaccionesClient;

    @Override
    public ClienteResponse crear(ClienteRequest request) {
        validarCondicionIVA(request.getCondicionIVA());
        Cliente entity = mapearEntidad(request);
        entity.setCreadoEn(Instant.now());
        Cliente guardado = repository.save(entity);
        return mapearRespuesta(guardado, null, null, null, null);
    }

    @Override
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        validarCondicionIVA(request.getCondicionIVA());
        Cliente existente = repository.findById(id).orElseThrow(() -> new ClienteNotFoundException(id));
        actualizarEntidad(existente, request);
        Cliente guardado = repository.save(existente);
        return mapearRespuesta(guardado, null, null, null, null);
    }

    @Override
    public ClienteResponse obtener(Long id) {
        Cliente cliente = repository.findById(id).orElseThrow(() -> new ClienteNotFoundException(id));
        return mapearRespuesta(cliente, null, null, null, null);
    }

    @Override
    public ClienteResponse obtenerConObras(Long id) {
        Cliente cliente = repository.findById(id).orElseThrow(() -> new ClienteNotFoundException(id));
        List<ObraClienteResponse> obras;
        try {
            obras = obrasClient.obtenerObrasPorCliente(id);
        } catch (Exception ex) {
            log.warn("No se pudieron obtener las obras para el cliente {}", id, ex);
            obras = Collections.emptyList();
        }
        List<TransaccionExternalDto> transacciones = Collections.emptyList();
        try {
            transacciones = transaccionesClient.obtenerTransaccionesPorAsociado("CLIENTE", id);
        } catch (Exception ex) {
            log.warn("No se pudieron obtener transacciones del cliente {}", id, ex);
        }

        TotalesCliente totales = calcularTotalesCliente(obras, transacciones, true);
        return mapearRespuesta(cliente, obras, totales.totalCliente, totales.cobrosRealizados, totales.saldoCliente);
    }

    @Override
    public List<ClienteResponse> listar() {
        return repository.findAll().stream()
                .map(cliente -> {
                    List<ObraClienteResponse> obras;
                    try {
                        obras = obrasClient.obtenerObrasPorCliente(cliente.getId());
                    } catch (Exception ex) {
                        log.warn("No se pudieron obtener las obras para el cliente {}", cliente.getId(), ex);
                        obras = Collections.emptyList();
                    }

                    List<TransaccionExternalDto> transacciones;
                    try {
                        transacciones = transaccionesClient.obtenerTransaccionesPorAsociado("CLIENTE", cliente.getId());
                    } catch (Exception ex) {
                        log.warn("No se pudieron obtener transacciones del cliente {}", cliente.getId(), ex);
                        transacciones = Collections.emptyList();
                    }

                    TotalesCliente totales = calcularTotalesCliente(obras, transacciones, false);
                    return mapearRespuesta(cliente, null, totales.totalCliente, totales.cobrosRealizados, totales.saldoCliente);
                })
                .toList();
    }

    @Override
    public List<String> listarCondicionesIva() {
        return CONDICIONES_IVA_VALIDAS.keySet().stream().toList();
    }

    @Override
    public void activar(Long id) {
        repository.findById(id).ifPresent(c -> {
            c.setActivo(true);
            repository.save(c);
        });
    }

    @Override
    public void desactivar(Long id) {
        repository.findById(id).ifPresent(c -> {
            c.setActivo(false);
            repository.save(c);
        });
    }

    @Override
    public void eliminar(Long id) {
        repository.deleteById(id);
    }

    private Cliente mapearEntidad(ClienteRequest request) {
        Cliente entity = new Cliente();
        entity.setNombre(request.getNombre());
        entity.setId_empresa(request.getIdEmpresa());
        entity.setContacto(request.getContacto());
        entity.setDireccion(request.getDireccion());
        entity.setCuit(request.getCuit());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        entity.setCondicionIva(request.getCondicionIVA());
        entity.setActivo(request.getActivo() != null ? request.getActivo() : Boolean.TRUE);
        return entity;
    }

    private void actualizarEntidad(Cliente existente, ClienteRequest request) {
        existente.setNombre(request.getNombre());
        existente.setId_empresa(request.getIdEmpresa());
        existente.setContacto(request.getContacto());
        existente.setDireccion(request.getDireccion());
        existente.setCuit(request.getCuit());
        existente.setTelefono(request.getTelefono());
        existente.setEmail(request.getEmail());
        existente.setCondicionIva(request.getCondicionIVA());
        if (request.getActivo() != null) {
            existente.setActivo(request.getActivo());
        }
    }

    private ClienteResponse mapearRespuesta(
            Cliente cliente,
            List<ObraClienteResponse> obras,
            BigDecimal totalCliente,
            BigDecimal cobrosRealizados,
            BigDecimal saldoCliente
    ) {
        ClienteResponse response = new ClienteResponse();
        response.setId(cliente.getId());
        response.setNombre(cliente.getNombre());
        response.setIdEmpresa(cliente.getId_empresa());
        response.setContacto(cliente.getContacto());
        response.setDireccion(cliente.getDireccion());
        response.setCuit(cliente.getCuit());
        response.setTelefono(cliente.getTelefono());
        response.setEmail(cliente.getEmail());
        String condicion = null;
        if (cliente.getCondicionIVA() != null) {
            condicion = cliente.getCondicionIVA();
        } else if (cliente.getCondicionIVA() != null) {
            condicion = cliente.getCondicionIVA();
        }
        response.setCondicionIVA(condicion != null ? condicion : CondicionIva.CONSUMIDOR_FINAL.name());
        response.setActivo(cliente.getActivo() != null ? cliente.getActivo() : Boolean.TRUE);
        response.setCreadoEn(cliente.getCreadoEn());
        response.setUltimaActualizacion(cliente.getUltimaActualizacion());
        response.setTipoActualizacion(cliente.getTipoActualizacion());

        if (obras != null) {
            response.setObras(obras);
        }
        if (totalCliente != null) {
            response.setTotalCliente(totalCliente);
        }
        if (cobrosRealizados != null) {
            response.setCobrosRealizados(cobrosRealizados);
        }
        if (saldoCliente != null) {
            response.setSaldoCliente(saldoCliente);
        }

        return response;
    }

    private void validarCondicionIVA(String condicion) {
        if (!StringUtils.hasText(condicion)) {
            throw new InvalidClienteException("La condición IVA es obligatoria");
        }
        CondicionIva valor = mapearCondicionIVA(condicion);
        if (valor == null) {
            throw new InvalidClienteException("Condición IVA inválida. Valores permitidos: " + Arrays.toString(CONDICIONES_IVA_VALIDAS.keySet().toArray()));
        }
    }

    private CondicionIva mapearCondicionIVA(String condicion) {
        if (!StringUtils.hasText(condicion)) return null;
        String normalizado = condicion.trim().toUpperCase(Locale.ROOT);
        return CONDICIONES_IVA_VALIDAS.get(normalizado);
    }

    private boolean obraGeneraDeuda(String estadoRaw) {
        String estado = normalizarEstado(estadoRaw);
        if (estado.isEmpty()) return false;
        return ESTADOS_CON_DEUDA.contains(estado);
    }

    private String normalizarEstado(String raw) {
        if (!StringUtils.hasText(raw)) return "";
        String sinTildes = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return sinTildes.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }

    private BigDecimal saldoPositivo(BigDecimal saldo) {
        if (saldo == null) return BigDecimal.ZERO;
        return saldo.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldo;
    }

    private TotalesCliente calcularTotalesCliente(
            List<ObraClienteResponse> obras,
            List<TransaccionExternalDto> transacciones,
            boolean actualizarSaldoObra
    ) {
        if (obras == null) obras = Collections.emptyList();
        if (transacciones == null) transacciones = Collections.emptyList();

        Map<Long, BigDecimal> cobrosPorObra = new HashMap<>();
        for (TransaccionExternalDto tx : transacciones) {
            if (tx == null || Boolean.FALSE.equals(tx.getActivo()) || tx.getMonto() == null) continue;
            if (!"COBRO".equalsIgnoreCase(tx.getTipo_transaccion())) continue;
            Long obraId = tx.getId_obra();
            if (obraId == null) continue;
            BigDecimal monto = BigDecimal.valueOf(tx.getMonto());
            cobrosPorObra.merge(obraId, monto, BigDecimal::add);
        }

        BigDecimal totalCliente = BigDecimal.ZERO;
        BigDecimal cobrosRealizados = BigDecimal.ZERO;
        for (ObraClienteResponse obra : obras) {
            if (obra == null || obra.getId() == null) continue;
            BigDecimal presupuesto = obra.getPresupuesto() != null ? obra.getPresupuesto() : BigDecimal.ZERO;
            BigDecimal cobros = cobrosPorObra.getOrDefault(obra.getId(), BigDecimal.ZERO);
            boolean generaDeuda = obraGeneraDeuda(obra.getObra_estado());
            if (generaDeuda) {
                totalCliente = totalCliente.add(presupuesto);
                cobrosRealizados = cobrosRealizados.add(cobros);
            }
            if (actualizarSaldoObra) {
                obra.setSaldo_pendiente(generaDeuda ? saldoPositivo(presupuesto.subtract(cobros)) : BigDecimal.ZERO);
            }
        }

        BigDecimal saldoCliente = saldoPositivo(totalCliente.subtract(cobrosRealizados));
        return new TotalesCliente(totalCliente, cobrosRealizados, saldoCliente);
    }

    private record TotalesCliente(
            BigDecimal totalCliente,
            BigDecimal cobrosRealizados,
            BigDecimal saldoCliente
    ) { }

    private static final Set<String> ESTADOS_CON_DEUDA = Set.of(
            "ADJUDICADA",
            "EN_PROGRESO",
            "FINALIZADA"
    );
}
