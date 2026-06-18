package com.obras.service;

import com.obras.dto.SaldoGrupoClienteDTO;
import com.obras.dto.SaldoGrupoProveedorDTO;
import com.obras.dto.ResumenObraClienteDTO;
import com.obras.dto.ResumenObraProveedorDTO;
import java.util.List;

public interface SaldosGruposService {
  List<SaldoGrupoClienteDTO> obtenerSaldosGruposClientes(Long organizacionId);
  List<SaldoGrupoProveedorDTO> obtenerSaldosGruposProveedores(Long organizacionId);
  List<ResumenObraClienteDTO> obtenerResumenObrasClientes(Long organizacionId);
  List<ResumenObraProveedorDTO> obtenerResumenObrasProveedores(Long organizacionId);
}
