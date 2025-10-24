package com.documentos.mapper;

import com.documentos.dto.DocumentoDto;
import com.documentos.dto.TipoDocumentoDto;
import com.documentos.entity.Documento;
import com.documentos.entity.TipoDocumento;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class DocumentosMapper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static DocumentoDto toDto(Documento entity) {
        DocumentoDto dto = new DocumentoDto();
        dto.setId_documento(entity.getIdDocumento());
        dto.setId_obra(entity.getIdObra());
        dto.setId_asociado(entity.getIdAsociado());
        dto.setTipo_asociado(entity.getTipoAsociado());
        dto.setNombre_archivo(entity.getNombreArchivo());
        dto.setPath_archivo(entity.getPathArchivo());
        dto.setFecha(entity.getFecha().format(DATE_FORMATTER));
        dto.setObservacion(entity.getObservacion());
        dto.setCreado_en(entity.getCreadoEn() != null ? entity.getCreadoEn().format(DATETIME_FORMATTER) : null);

        TipoDocumento tipo = entity.getTipoDocumento();
        if (tipo != null) {
            TipoDocumentoDto tipoDto = new TipoDocumentoDto();
            tipoDto.setId_tipo_documento(tipo.getId());
            tipoDto.setNombre(tipo.getNombre());
            dto.setTipo_documento(tipoDto);
        }

        return dto;
    }

    public static Documento toEntity(DocumentoDto dto, TipoDocumento tipoDocumento) {
        Documento entity = new Documento();
        entity.setIdDocumento(dto.getId_documento());
        entity.setIdObra(dto.getId_obra());
        entity.setIdAsociado(dto.getId_asociado());
        entity.setTipoAsociado(dto.getTipo_asociado());
        entity.setNombreArchivo(dto.getNombre_archivo());
        entity.setPathArchivo(dto.getPath_archivo());
        entity.setFecha(java.time.LocalDate.parse(dto.getFecha(), DATE_FORMATTER));
        entity.setObservacion(dto.getObservacion());
        entity.setTipoDocumento(tipoDocumento);
        return entity;
    }
}
