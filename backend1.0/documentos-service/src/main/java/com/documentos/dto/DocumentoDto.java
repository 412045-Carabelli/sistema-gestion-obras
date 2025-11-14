package com.documentos.dto;

import com.documentos.enums.TipoDocumentoEnum;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentoDto {
    private Long id_documento;
    private Long id_obra;
    private Long id_asociado;
    private String tipo_asociado;
    private String nombre_archivo;
    private String path_archivo;
    private String fecha;
    private String observacion;
    private String creado_en;
    private TipoDocumentoEnum tipo_documento;
}
