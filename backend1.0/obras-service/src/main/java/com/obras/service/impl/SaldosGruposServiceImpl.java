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
  public List<SaldoGrupoClienteDTO> obtenerSaldosGruposClientes(Long organizacionId) {
    try {
      return repository.obtenerSaldosGruposClientes(organizacionId);
    } catch (Exception e) {
      log.error("Error al obtener saldos grupos clientes", e);
      throw new RuntimeException("Error al obtener saldos por grupo", e);
    }
  }

  @Override
  public List<SaldoGrupoProveedorDTO> obtenerSaldosGruposProveedores(Long organizacionId) {
    try {
      return repository.obtenerSaldosGruposProveedores(organizacionId);
    } catch (Exception e) {
      log.error("Error al obtener saldos grupos proveedores", e);
      throw new RuntimeException("Error al obtener saldos proveedores por grupo", e);
    }
  }

  @Override
  public List<ResumenObraClienteDTO> obtenerResumenObrasClientes(Long organizacionId) {
    try {
      return repository.obtenerResumenObrasClientes(organizacionId);
    } catch (Exception e) {
      log.error("Error al obtener resumen obras clientes", e);
      throw new RuntimeException("Error al obtener resumen de obras", e);
    }
  }

  @Override
  public List<ResumenObraProveedorDTO> obtenerResumenObrasProveedores(Long organizacionId) {
    try {
      return repository.obtenerResumenObrasProveedores(organizacionId);
    } catch (Exception e) {
      log.error("Error al obtener resumen obras proveedores", e);
      throw new RuntimeException("Error al obtener resumen de obras", e);
    }
  }
}
