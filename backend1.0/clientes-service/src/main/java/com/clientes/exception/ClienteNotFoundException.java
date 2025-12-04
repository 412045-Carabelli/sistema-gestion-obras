package com.clientes.exception;

public class ClienteNotFoundException extends RuntimeException {
    public ClienteNotFoundException(Long id) {
        super("Cliente no encontrado: " + id);
    }
}
