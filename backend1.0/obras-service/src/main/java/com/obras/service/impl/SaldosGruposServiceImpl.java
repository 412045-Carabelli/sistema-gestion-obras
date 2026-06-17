package com.obras.service.impl;

import com.obras.dto.SaldoGrupoClienteDTO;
import com.obras.dto.SaldoGrupoProveedorDTO;
import com.obras.dto.ResumenObraClienteDTO;
import com.obras.dto.ResumenObraProveedorDTO;
import com.obras.repository.SaldosGruposRepository;
import com.obras.service.SaldosGruposService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class SaldosGruposServiceImpl implements SaldosGruposService {

  private final SaldosGruposRepository repository;

  @Override
  public List<SaldoGrupoClienteDTO> obtenerSaldosGruposClientes() {
    try {
      return repository.obtenerSaldosGruposClientes();
    } catch (Exception e) {
      log.error("Error al obtener saldos grupos clientes", e);
      throw new RuntimeException("Error al obtener saldos por grupo", e);
    }
  }

  @Override
  public List<SaldoGrupoProveedorDTO> obtenerSaldosGruposProveedores() {
    try {
      return repository.obtenerSaldosGruposProveedores();
    } catch (Exception e) {
      log.error("Error al obtener saldos grupos proveedores", e);
      throw new RuntimeException("Error al obtener saldos proveedores por grupo", e);
    }
  }

  @Override
  public List<ResumenObraClienteDTO> obtenerResumenObrasClientes() {
    try {
      return repository.obtenerResumenObrasClientes();
    } catch (Exception e) {
      log.error("Error al obtener resumen obras clientes", e);
      throw new RuntimeException("Error al obtener resumen de obras", e);
    }
  }

  @Override
  public List<ResumenObraProveedorDTO> obtenerResumenObrasProveedores() {
    try {
      return repository.obtenerResumenObrasProveedores();
    } catch (Exception e) {
      log.error("Error al obtener resumen obras proveedores", e);
      throw new RuntimeException("Error al obtener resumen de obras", e);
    }
  }
}
