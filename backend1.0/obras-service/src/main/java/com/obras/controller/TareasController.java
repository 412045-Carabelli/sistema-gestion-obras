package com.obras.controller;

import com.obras.dto.TareaDTO;
import com.obras.service.TareaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obras/tareas")
@RequiredArgsConstructor
public class TareasController {

    private final TareaService svc;

    @GetMapping("/{idObra}")
    public List<TareaDTO> tareas(@PathVariable("idObra") Long idObra) {
        return svc.tareasDeObra(idObra);
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
}
