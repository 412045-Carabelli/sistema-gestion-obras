package com.clientes.service.impl;

import com.clientes.client.ObrasClient;
import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.dto.ObraClienteResponse;
import com.clientes.entity.Cliente;
import com.clientes.exception.ClienteNotFoundException;
import com.clientes.exception.InvalidClienteException;
import com.clientes.repository.ClienteRepository;
import com.clientes.service.ClienteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClienteServiceImpl implements ClienteService {

    private static final Set<String> CONDICIONES_IVA_VALIDAS = Set.of(
            "Monotributo",
            "Responsable Inscripto",
            "Exento",
            "Consumidor Final"
    );

    private final ClienteRepository repository;
    private final ObrasClient obrasClient;

    @Override
    public ClienteResponse crear(ClienteRequest request) {
        validarCondicionIVA(request.getCondicionIVA());
        Cliente entity = mapearEntidad(request);
        entity.setCreadoEn(Instant.now());
        Cliente guardado = repository.save(entity);
        return mapearRespuesta(guardado, null);
    }

    @Override
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        validarCondicionIVA(request.getCondicionIVA());
        Cliente existente = repository.findById(id).orElseThrow(() -> new ClienteNotFoundException(id));
        actualizarEntidad(existente, request);
        Cliente guardado = repository.save(existente);
        return mapearRespuesta(guardado, null);
    }

    @Override
    public ClienteResponse obtener(Long id) {
        Cliente cliente = repository.findById(id).orElseThrow(() -> new ClienteNotFoundException(id));
        return mapearRespuesta(cliente, null);
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
        return mapearRespuesta(cliente, obras);
    }

    @Override
    public List<ClienteResponse> listar() {
        return repository.findAll().stream()
                .map(c -> mapearRespuesta(c, null))
                .toList();
    }

    @Override
    public List<String> listarCondicionesIva() {
        return CONDICIONES_IVA_VALIDAS.stream().toList();
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

    private Cliente mapearEntidad(ClienteRequest request) {
        Cliente entity = new Cliente();
        entity.setNombre(request.getNombre());
        entity.setIdEmpresa(request.getIdEmpresa());
        entity.setContacto(request.getContacto());
        entity.setCuit(request.getCuit());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        entity.setCondicionIVA(normalizarCondicion(request.getCondicionIVA()));
        entity.setActivo(request.getActivo() != null ? request.getActivo() : Boolean.TRUE);
        return entity;
    }

    private void actualizarEntidad(Cliente existente, ClienteRequest request) {
        existente.setNombre(request.getNombre());
        existente.setIdEmpresa(request.getIdEmpresa());
        existente.setContacto(request.getContacto());
        existente.setCuit(request.getCuit());
        existente.setTelefono(request.getTelefono());
        existente.setEmail(request.getEmail());
        existente.setCondicionIVA(normalizarCondicion(request.getCondicionIVA()));
        if (request.getActivo() != null) {
            existente.setActivo(request.getActivo());
        }
    }

    private ClienteResponse mapearRespuesta(Cliente cliente, List<ObraClienteResponse> obras) {
        ClienteResponse response = new ClienteResponse();
        response.setId(cliente.getId());
        response.setNombre(cliente.getNombre());
        response.setIdEmpresa(cliente.getIdEmpresa());
        response.setContacto(cliente.getContacto());
        response.setCuit(cliente.getCuit());
        response.setTelefono(cliente.getTelefono());
        response.setEmail(cliente.getEmail());
        response.setCondicionIVA(cliente.getCondicionIVA() != null ? cliente.getCondicionIVA() : "Consumidor Final");
        response.setActivo(cliente.getActivo() != null ? cliente.getActivo() : Boolean.TRUE);
        response.setCreadoEn(cliente.getCreadoEn());
        response.setUltimaActualizacion(cliente.getUltimaActualizacion());
        response.setTipoActualizacion(cliente.getTipoActualizacion());

        if (obras != null) {
            response.setObras(obras);
        }

        return response;
    }

    private void validarCondicionIVA(String condicion) {
        if (!StringUtils.hasText(condicion)) {
            throw new InvalidClienteException("La condición IVA es obligatoria");
        }
        String valor = mapearCondicionIVA(condicion);
        if (valor == null) {
            throw new InvalidClienteException("Condición IVA inválida. Valores permitidos: " + Arrays.toString(CONDICIONES_IVA_VALIDAS.toArray()));
        }
    }

    private String normalizarCondicion(String condicion) {
        return mapearCondicionIVA(condicion);
    }

    private String mapearCondicionIVA(String condicion) {
        if (condicion == null) return null;
        String normalizado = condicion.trim().toUpperCase(Locale.ROOT);
        return CONDICIONES_IVA_VALIDAS.stream()
                .filter(v -> v.toUpperCase(Locale.ROOT).equals(normalizado))
                .findFirst()
                .orElse(null);
    }
}
