package com.empresas.service.impl;

import com.empresas.dto.EmpresaRequest;
import com.empresas.dto.EmpresaResponse;
import com.empresas.entity.Empresa;
import com.empresas.repository.EmpresaRepository;
import com.empresas.service.EmpresaService;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Default implementation for {@link EmpresaService}.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class EmpresaServiceImpl implements EmpresaService {

    private final EmpresaRepository empresaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<EmpresaResponse> findAll() {
        return empresaRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmpresaResponse> findByUsuario(Long usuarioId) {
        return empresaRepository.findByUsuarioId(usuarioId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EmpresaResponse findById(Long id) {
        return empresaRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Empresa no encontrada"));
    }

    @Override
    public EmpresaResponse create(EmpresaRequest request) {
        Empresa empresa = Empresa.builder()
                .razonSocial(request.razonSocial())
                .usuarioId(request.usuarioId())
                .activa(Boolean.TRUE.equals(request.activa()) || request.activa() == null)
                .obras(request.obras() != null ? request.obras() : List.of())
                .build();
        return toResponse(empresaRepository.save(empresa));
    }

    @Override
    public EmpresaResponse update(Long id, EmpresaRequest request) {
        Empresa empresa = empresaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Empresa no encontrada"));
        empresa.setRazonSocial(request.razonSocial());
        empresa.setUsuarioId(request.usuarioId());
        if (Objects.nonNull(request.activa())) {
            empresa.setActiva(request.activa());
        }
        if (Objects.nonNull(request.obras())) {
            empresa.setObras(request.obras());
        }
        return toResponse(empresaRepository.save(empresa));
    }

    @Override
    public void delete(Long id) {
        if (!empresaRepository.existsById(id)) {
            throw new EntityNotFoundException("Empresa no encontrada");
        }
        empresaRepository.deleteById(id);
    }

    private EmpresaResponse toResponse(Empresa empresa) {
        return new EmpresaResponse(
                empresa.getId(),
                empresa.getRazonSocial(),
                empresa.getUsuarioId(),
                empresa.getActiva(),
                empresa.getObras(),
                empresa.getCreatedAt(),
                empresa.getUpdatedAt(),
                empresa.getCreatedBy(),
                empresa.getUpdatedBy());
    }
}
