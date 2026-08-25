package com.reportes.dto.response;

import com.reportes.dto.external.DashboardCuentaCorrienteExternalDto;
import com.reportes.dto.external.TareaVencimientoExternalDto;
import com.reportes.dto.external.TransaccionConAsociadoExternalDto;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Reporte consolidado para la pantalla de Reportes v2: kpis de cuenta corriente,
 * facturacion del periodo, movimientos del periodo y tareas de agenda por vencer.
 * Comisiones queda fuera: el frontend sigue llamando su endpoint dedicado.
 */
@Data
public class ReportesConsolidadoResponse {
    private DashboardCuentaCorrienteExternalDto kpisCuentaCorriente = new DashboardCuentaCorrienteExternalDto();
    private FacturacionPeriodoResponse facturacionPeriodo = new FacturacionPeriodoResponse();
    private List<TransaccionConAsociadoExternalDto> movimientosPeriodo = new ArrayList<>();
    private long movimientosPeriodoTotal;
    private List<TareaVencimientoExternalDto> vencimientosAgenda = new ArrayList<>();
}
