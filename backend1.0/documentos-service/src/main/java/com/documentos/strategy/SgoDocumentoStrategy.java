package com.documentos.strategy;

import com.documentos.enums.Producto;
import org.springframework.stereotype.Component;

/**
 * SGO es multi-organización real, pero hoy ni el BFF ni el frontend mandan
 * organizacionId a este servicio (deuda conocida — ver docs). No bloqueamos
 * por eso: mismo comportamiento que tenía el servicio antes de esta clase,
 * solo namespaceado por producto.
 */
@Component
public class SgoDocumentoStrategy implements DocumentoDestinoStrategy {

  @Override
  public Producto producto() {
    return Producto.SGO;
  }

  @Override
  public String armarPrefijo(String tipoAsociado, Long idAsociado, Long idObra) {
    return (tipoAsociado != null && !tipoAsociado.isEmpty())
        ? "sgo/" + tipoAsociado.toLowerCase() + "s/" + idAsociado
        : "sgo/obras/" + (idObra != null ? idObra : "sin-obra");
  }

  @Override
  public void validarAcceso(Long organizacionId, Long idObra) {
    // Sin chequeo — ver comentario de clase.
  }
}
