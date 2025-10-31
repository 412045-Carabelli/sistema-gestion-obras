package com.documentos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "documentos")
@Getter
@Setter
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDocumento;

    @Column(name = "id_obra", nullable = false)
    private Long idObra;

    @Column(name = "id_asociado")
    private Long idAsociado;

    @Column(name = "tipo_asociado")
    private String tipoAsociado;

    @Column(name = "nombre_archivo", nullable = false)
    private String nombreArchivo;

    @Column(name = "path_archivo", nullable = false)
    private String pathArchivo;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "observacion")
    private String observacion;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn = LocalDateTime.now();;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_documento", nullable = false)
    private TipoDocumento tipoDocumento;

}
