package com.documentos.strategy;

import com.documentos.enums.Producto;

/**
 * Strategy: cada producto (SGO, FRESCO, BUILDRR_FEEDBACK) sabe armar su
 * propio prefijo de almacenamiento y validar el acceso con sus propias
 * reglas — sin esto, DocumentoService terminaría con un if/switch por
 * producto que crece cada vez que se suma una app nueva al ecosistema.
 * Mismo criterio que TicketFactory/UsuarioAplicacionFactory en
 * buildrr-feedback (Factory Method) — acá es Strategy porque no se crea un
 * objeto nuevo, se elige comportamiento sobre datos que ya vienen armados.
 */
public interface DocumentoDestinoStrategy {

  Producto producto();

  /** Prefijo de carpeta dentro del bucket/filesystem — namespaced por producto para no pisar rutas entre apps. */
  String armarPrefijo(String tipoAsociado, Long idAsociado, Long idObra);

  /**
   * Valida que el documento pertenezca a donde dice pertenecer, según las
   * reglas de tenant de ese producto. No revalida identidad (eso lo hace el
   * gateway/BFF antes de llegar acá) — solo la coherencia producto/organización.
   */
  void validarAcceso(Long organizacionId, Long idObra);
}
