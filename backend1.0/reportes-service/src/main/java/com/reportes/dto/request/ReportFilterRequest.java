package com.reportes.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ReportFilterRequest {
    private Long grupoId;
    private Long obraId;
    private List<Long> obraIds;
    private Long clienteId;
    private Long proveedorId;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaInicio;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaFin;
}
