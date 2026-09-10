package com.documentos.strategy;

import com.documentos.enums.Producto;
import org.springframework.stereotype.Component;

/** La tiquetera no tiene organizacionId (usa producto + usuario_aplicacion, no multi-org por id). */
@Component
public class BuildrrFeedbackDocumentoStrategy implements DocumentoDestinoStrategy {

  @Override
  public Producto producto() {
    return Producto.BUILDRR_FEEDBACK;
  }

  @Override
  public String armarPrefijo(String tipoAsociado, Long idAsociado, Long idObra) {
    return "buildrr-feedback/" + (tipoAsociado != null ? tipoAsociado.toLowerCase() + "s/" + idAsociado : "otros/" + idAsociado);
  }

  @Override
  public void validarAcceso(Long organizacionId, Long idObra) {
    // Sin organización — no aplica.
  }
}
