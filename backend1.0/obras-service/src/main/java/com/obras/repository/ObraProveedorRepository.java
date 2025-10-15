package com.obras.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObraProveedorRepository extends JpaRepository<com.obras.entity.ObraProveedor, Long> {

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO obra_proveedor (id_obra, id_proveedor) VALUES (:idObra, :idProveedor)", nativeQuery = true)
    void insertarRelacion(Long idObra, Long idProveedor);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM obra_proveedor WHERE id_obra = :idObra AND id_proveedor = :idProveedor", nativeQuery = true)
    void eliminarRelacion(Long idObra, Long idProveedor);

    @Query(value = "SELECT * FROM obra_proveedor WHERE id_obra = :idObra", nativeQuery = true)
    List<com.obras.entity.ObraProveedor> findByIdObra(Long idObra);

    boolean existsByIdObraAndIdProveedor(Long idObra, Long idProveedor);
}
