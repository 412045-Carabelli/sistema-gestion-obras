package com.obras.controller;

import com.obras.dto.TareaDTO;
import com.obras.entity.Obra;
import com.obras.enums.EstadoObraEnum;
import com.obras.repository.ObraRepository;
import com.obras.service.TareaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/obras/tareas")
@RequiredArgsConstructor
public class TareasController {

    private final TareaService svc;
    private final ObraRepository obraRepository;
    private static final Set<EstadoObraEnum> ESTADOS_VALIDOS = EnumSet.of(
            EstadoObraEnum.ADJUDICADA,
            EstadoObraEnum.EN_PROGRESO,
            EstadoObraEnum.FINALIZADA
    );

    @GetMapping("/{idObra}")
    public List<TareaDTO> tareas(
            @PathVariable("idObra") Long idObra,
            @RequestParam(name = "soloActivas", defaultValue = "false") boolean soloActivas,
            @RequestParam(name = "ordenAntiguas", defaultValue = "false") boolean ordenAntiguas
    ) {
        if (soloActivas && !obraCumpleEstado(idObra)) {
            return List.of();
        }
        List<TareaDTO> tareas = svc.tareasDeObra(idObra);
        if (ordenAntiguas && tareas != null && !tareas.isEmpty()) {
            return ordenarAntiguas(tareas);
        }
        return tareas;
    }

    @PostMapping("/{idObra}")
    public TareaDTO crearTarea(@PathVariable("idObra") Long idObra, @RequestBody TareaDTO dto) {
        dto.setId_obra(idObra);
        return svc.crear(dto);
    }

    @PutMapping("/{id}")
    public TareaDTO actualizarTarea(@PathVariable("id") Long id, @RequestBody TareaDTO dto) {
        return svc.actualizar(id, dto);
    }

    @PutMapping("/{id}/completar")
    public TareaDTO completarTarea(@PathVariable("id") Long id) {
        return svc.completarTarea(id);
    }

    @DeleteMapping("/{id}")
    public void delTarea(@PathVariable("id") Long id) {
        svc.borrar(id);
    }

    @GetMapping("/proveedor/{idProveedor}")
    public List<TareaDTO> tareasPorProveedor(@PathVariable("idProveedor") Long idProveedor) {
        return svc.tareasDeProveedor(idProveedor);
    }

    private boolean obraCumpleEstado(Long idObra) {
        if (idObra == null) return false;
        return obraRepository.findById(idObra)
                .map(Obra::getEstadoObra)
                .map(ESTADOS_VALIDOS::contains)
                .orElse(false);
    }

    private List<TareaDTO> ordenarAntiguas(List<TareaDTO> tareas) {
        List<TareaDTO> ordenadas = new ArrayList<>(tareas);
        ordenadas.sort(
                Comparator
                        .comparing(
                                (TareaDTO t) -> t.getEstado_tarea() == null ? 99 : t.getEstado_tarea().ordinal()
                        )
                        .thenComparing(
                                TareaDTO::getFecha_inicio,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        )
                        .thenComparing(
                                TareaDTO::getCreado_en,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        )
                        .thenComparing(
                                TareaDTO::getNumero_orden,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        )
                        .thenComparing(
                                TareaDTO::getId,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        )
        );
        return ordenadas;
    }
}
