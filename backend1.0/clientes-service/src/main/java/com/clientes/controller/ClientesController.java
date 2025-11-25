package com.clientes.controller;

import com.clientes.dto.ClienteRequest;
import com.clientes.dto.ClienteResponse;
import com.clientes.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClientesController {
    private final ClienteService service;

    @PostMapping
    public ResponseEntity<ClienteResponse> save(@RequestBody @Valid ClienteRequest request){
        ClienteResponse response = service.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<ClienteResponse> all(){ return service.listar(); }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponse> one(@PathVariable("id") Long id){
        return ResponseEntity.ok(service.obtener(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponse> upd(@PathVariable("id") Long id,@RequestBody @Valid ClienteRequest request){
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @GetMapping("/{id}/obras")
    public ResponseEntity<ClienteResponse> obras(@PathVariable("id") Long id){
        return ResponseEntity.ok(service.obtenerConObras(id));
    }
}

