package com.documentos.repository;

import com.documentos.entity.Documento;
import io.netty.handler.codec.http2.Http2Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    List<Documento> findByIdObra(Long obraId);
    List<Documento> findByTipoAsociadoAndIdAsociado(String tipo, Long idAsociado);
}
