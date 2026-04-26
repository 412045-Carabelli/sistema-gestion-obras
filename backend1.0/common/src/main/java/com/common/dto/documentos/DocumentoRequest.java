package com.common.dto.documentos;

import lombok.Data;

@Data
public class DocumentoRequest {
    private String nombre;
    private String tipo;
    private String url;
    private Long tamanio;
    private String estado;
}
