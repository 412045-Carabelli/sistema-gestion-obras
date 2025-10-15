package com.clientes.controller;

import com.clientes.entity.Cliente;
import com.clientes.repository.ClienteRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClientesController {
    private final ClienteRepository repo;

    @PostMapping
    public Cliente save(@RequestBody @Valid Cliente c){ return repo.save(c); }
    @GetMapping
    public List<Cliente> all(){ return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Cliente> one(@PathVariable("id") Long id){ return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}") public Cliente upd(@PathVariable("id") Long id,@RequestBody Cliente c){ c.setId(id); return repo.save(c); }
    @DeleteMapping("/{id}") public void del(@PathVariable("id") Long id){ repo.deleteById(id); }
}

