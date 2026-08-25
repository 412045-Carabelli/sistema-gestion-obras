package com.reportes.dto.external;

import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
public class MovimientosPeriodoPageExternalDto {
    private List<TransaccionConAsociadoExternalDto> content = Collections.emptyList();
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
    private boolean isFirst;
    private boolean isLast;
}
