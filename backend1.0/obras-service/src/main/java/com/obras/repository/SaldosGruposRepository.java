package com.obras.repository;

import com.obras.dto.SaldoGrupoClienteDTO;
import com.obras.dto.SaldoGrupoProveedorDTO;
import com.obras.dto.ResumenObraClienteDTO;
import com.obras.dto.ResumenObraProveedorDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class SaldosGruposRepository {

  @PersistenceContext
  private EntityManager em;

  @SuppressWarnings("unchecked")
  public List<SaldoGrupoClienteDTO> obtenerSaldosGruposClientes() {
    return em.createNativeQuery(
        "EXEC sp_saldos_grupos_clientes",
        SaldoGrupoClienteDTO.class
    ).getResultList();
  }

  @SuppressWarnings("unchecked")
  public List<SaldoGrupoProveedorDTO> obtenerSaldosGruposProveedores() {
    return em.createNativeQuery(
        "EXEC sp_saldos_grupos_proveedores",
        SaldoGrupoProveedorDTO.class
    ).getResultList();
  }

  @SuppressWarnings("unchecked")
  public List<ResumenObraClienteDTO> obtenerResumenObrasClientes() {
    return em.createNativeQuery(
        "EXEC sp_resumen_obras_clientes",
        ResumenObraClienteDTO.class
    ).getResultList();
  }

  @SuppressWarnings("unchecked")
  public List<ResumenObraProveedorDTO> obtenerResumenObrasProveedores() {
    return em.createNativeQuery(
        "EXEC sp_resumen_obras_proveedores",
        ResumenObraProveedorDTO.class
    ).getResultList();
  }
}
