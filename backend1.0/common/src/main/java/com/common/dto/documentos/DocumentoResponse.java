package com.common.dto.documentos;

import lombok.Data;
import java.time.Instant;

@Data
public class DocumentoResponse {
    private Long id;
    private String nombre;
    private String tipo;
    private String url;
    private Long tamanio;
    private String estado;
    private Instant creadoEn;
    private Instant ultimaActualizacion;
}
