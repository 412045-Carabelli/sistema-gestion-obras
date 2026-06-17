package com.obras.repository;

import com.obras.entity.Obra;
import com.obras.enums.EstadoObraEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ObraRepository extends JpaRepository<Obra, Long> {
    Page<Obra> findAll(Pageable pageable);
    Page<Obra> findByIdCliente(Long idCliente, Pageable pageable);

    @Query("""
        select o from Obra o
        where (:estado is null or o.estadoObra = :estado)
        and (:activo is null or o.activo = :activo)
        and (:empresaId is null or o.empresaId = :empresaId)
        and (:q is null
             or lower(o.nombre) like lower(concat('%', :q, '%'))
             or lower(o.direccion) like lower(concat('%', :q, '%')))
        """)
    Page<Obra> findByFiltros(
        @Param("estado") EstadoObraEnum estado,
        @Param("activo") Boolean activo,
        @Param("empresaId") Long empresaId,
        @Param("q") String q,
        Pageable pageable
    );

    Page<Obra> findByEmpresaId(Long empresaId, Pageable pageable);
    Page<Obra> findByIdClienteAndEmpresaId(Long idCliente, Long empresaId, Pageable pageable);

    @Query("""
            select o from Obra o
            where (coalesce(o.condicionesPresupuesto, '') <> '' or coalesce(o.observacionesPresupuesto, '') <> '')
            order by o.ultimaActualizacion desc, o.id desc
            """)
    List<Obra> findUltimaConCondiciones(Pageable pageable);
}
