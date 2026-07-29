package com.auth.service;

import com.auth.dto.DescuentoRequest;
import com.auth.dto.DescuentoResponse;
import com.auth.entity.Descuento;

import java.math.BigDecimal;
import java.util.List;

public interface DescuentoService {
    List<DescuentoResponse> listar();
    List<DescuentoResponse> listarVigentes();
    DescuentoResponse obtenerPorId(Long id);
    DescuentoResponse obtenerPorCodigo(String codigo);
    DescuentoResponse crear(DescuentoRequest request, String creadoPor);
    DescuentoResponse actualizar(Long id, DescuentoRequest request);
    void desactivar(Long id);

    // Valida y calcula el descuento sobre un precio base
    BigDecimal calcularDescuento(String codigoCupon, BigDecimal precioBase, Long planId, String ciclo);

    // Registra un uso del cupón (se llama al confirmar suscripción)
    void registrarUso(String codigoCupon);
}
