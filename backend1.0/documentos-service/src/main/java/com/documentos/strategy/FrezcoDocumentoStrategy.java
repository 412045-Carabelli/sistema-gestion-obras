package com.documentos.strategy;

import com.documentos.enums.Producto;
import com.documentos.exception.AccesoDocumentoInvalidoException;
import org.springframework.stereotype.Component;

/** FrezCo es tenant único (organización fija id=1), mismo criterio que su GatewayAuthFilter. */
@Component
public class FrezcoDocumentoStrategy implements DocumentoDestinoStrategy {

  private static final Long ORGANIZACION_FREZCO = 1L;

  @Override
  public Producto producto() {
    return Producto.FRESCO;
  }

  @Override
  public String armarPrefijo(String tipoAsociado, Long idAsociado, Long idObra) {
    return "frezco/" + (tipoAsociado != null ? tipoAsociado.toLowerCase() + "s/" + idAsociado : "otros/" + idAsociado);
  }

  @Override
  public void validarAcceso(Long organizacionId, Long idObra) {
    // Si mandan organizacionId, tiene que ser el tenant fijo de FrezCo — si
    // no lo mandan (nadie lo hace todavía), no bloqueamos.
    if (organizacionId != null && !ORGANIZACION_FREZCO.equals(organizacionId)) {
      throw new AccesoDocumentoInvalidoException("FrezCo es tenant único, organización inválida: " + organizacionId);
    }
  }
}
