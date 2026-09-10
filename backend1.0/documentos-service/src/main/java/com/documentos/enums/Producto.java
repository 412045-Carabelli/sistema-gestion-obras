package com.documentos.enums;

/**
 * Qué aplicación del ecosistema Buildr es dueña del documento — determina el
 * prefijo de almacenamiento y la regla de acceso (ver strategy/). Default
 * SGO por compatibilidad: los llamados existentes (frontend de SGO) nunca
 * mandan este campo.
 */
public enum Producto {
  SGO,
  FRESCO,
  BUILDRR_FEEDBACK
}
