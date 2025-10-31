package com.usuarios.service.impl;

import com.usuarios.dto.UsuarioRequest;
import com.usuarios.dto.UsuarioResponse;
import com.usuarios.entity.Usuario;
import com.usuarios.repository.UsuarioRepository;
import com.usuarios.service.UsuarioService;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Default implementation for {@link UsuarioService}.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> findAll() {
        return usuarioRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse findById(Long id) {
        return usuarioRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }

    @Override
    public UsuarioResponse create(UsuarioRequest request) {
        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .email(request.email())
                .telefono(request.telefono())
                .activo(Boolean.TRUE.equals(request.activo()) || request.activo() == null)
                .build();
        return toResponse(usuarioRepository.save(usuario));
    }

    @Override
    public UsuarioResponse update(Long id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        usuario.setNombre(request.nombre());
        usuario.setEmail(request.email());
        usuario.setTelefono(request.telefono());
        if (Objects.nonNull(request.activo())) {
            usuario.setActivo(request.activo());
        }
        return toResponse(usuarioRepository.save(usuario));
    }

    @Override
    public void delete(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new EntityNotFoundException("Usuario no encontrado");
        }
        usuarioRepository.deleteById(id);
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getActivo(),
                usuario.getCreatedAt(),
                usuario.getUpdatedAt(),
                usuario.getCreatedBy(),
                usuario.getUpdatedBy());
    }
}
