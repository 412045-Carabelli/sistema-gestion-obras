package com.obras.controller;

import com.obras.entity.ObraProveedor;
import com.obras.service.ObraProveedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obras/obra-proveedor")
@RequiredArgsConstructor
public class ObrasProveedoresController {

    private final ObraProveedorService svc;

    @GetMapping("/{idObra}") public List<ObraProveedor> proveedores(@PathVariable("idObra") Long idObra){ return svc.proveedoresDeObra(idObra); }
    @PostMapping("/{idObra}/link/{idProveedor}") public void vincular(@PathVariable("idObra") Long idObra, @PathVariable("idProveedor") Long idProveedor){ svc.vincularProveedor(idObra,idProveedor); }
    @DeleteMapping("/{idObra}/unlink/{idProveedor}") public void desvincular(@PathVariable Long idObra, @PathVariable Long idProveedor){ svc.desvincularProveedor(idObra,idProveedor); }

}

