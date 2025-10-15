package com.obras.service;

import com.obras.dto.EstadoTareaDTO;
import com.obras.repository.EstadoTareaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EstadosTareasService {
    private final EstadoTareaRepository repo;

    public List<EstadoTareaDTO> listarEstados() {
        return repo.findAll()
                .stream()
                .map(x -> new EstadoTareaDTO(x.getId(), x.getNombre()))
                .collect(Collectors.toList());
    }
}
