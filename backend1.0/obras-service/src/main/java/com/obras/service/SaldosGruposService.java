package com.obras.service;

import com.obras.dto.SaldoGrupoClienteDTO;
import com.obras.dto.SaldoGrupoProveedorDTO;
import com.obras.dto.ResumenObraClienteDTO;
import com.obras.dto.ResumenObraProveedorDTO;
import java.util.List;

public interface SaldosGruposService {
  List<SaldoGrupoClienteDTO> obtenerSaldosGruposClientes();
  List<SaldoGrupoProveedorDTO> obtenerSaldosGruposProveedores();
  List<ResumenObraClienteDTO> obtenerResumenObrasClientes();
  List<ResumenObraProveedorDTO> obtenerResumenObrasProveedores();
}
