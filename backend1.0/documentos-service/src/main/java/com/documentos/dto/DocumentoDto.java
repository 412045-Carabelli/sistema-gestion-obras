package com.documentos.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentoDto {
    private Long id_documento;
    private Long id_obra;
    private String nombre_archivo;
    private String path_archivo;
    private String fecha;
    private String observacion;
    private String creado_en;
    private TipoDocumentoDto tipo_documento;
}
