package com.documentos.repository;

import com.documentos.entity.Documento;
import io.netty.handler.codec.http2.Http2Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    @Query("SELECT d FROM Documento d JOIN FETCH d.tipoDocumento WHERE d.idObra = :obraId")
    List<Documento> findByIdObra(@Param("obraId") Long obraId);
    List<Documento> findByTipoAsociadoAndIdAsociado(String tipo, Long idAsociado);
}
