package com.obras.service;

import com.obras.dto.ObraDTO;
import com.obras.dto.ObraEstadoDTO;
import com.obras.entity.EstadoObra;
import com.obras.entity.Obra;
import com.obras.repository.EstadoObraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstadoObraService {

    private final EstadoObraRepository estadoObraRepository;

    private ObraEstadoDTO toDto(EstadoObra entity) {
        return new ObraEstadoDTO(entity.getId(), entity.getNombre(), entity.getActivo());
    }

    public List<ObraEstadoDTO> listarEstados() {
        return estadoObraRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}
