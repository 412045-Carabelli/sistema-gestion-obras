package com.transacciones.service;

import com.transacciones.dto.FacturaDto;
import com.transacciones.dto.ObraResumenDto;
import com.transacciones.entity.Factura;
import com.transacciones.entity.Transaccion;
import com.transacciones.enums.TipoTransaccionEnum;
import com.transacciones.repository.FacturaRepository;
import com.transacciones.repository.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final TransaccionRepository transaccionRepository;
    private final ObraCostoClient obraCostoClient;

    @Value("${file.upload-dir}")
    private String uploadDirBase;

    @Transactional(readOnly = true)
    public List<FacturaDto> listar() {
        return facturaRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FacturaDto> listarPorCliente(Long idCliente) {
        return facturaRepository.findByIdCliente(idCliente)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FacturaDto> listarPorObra(Long idObra) {
        return facturaRepository.findByIdObra(idObra)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FacturaDto obtener(Long id) {
        Factura entity = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
        return toDto(entity);
    }

    @Transactional
    public FacturaDto crear(FacturaDto dto, MultipartFile file) {
        validarMontoContraPresupuesto(dto.getId_obra(), dto.getMonto(), null);
        Boolean impactaCtaCte = dto.getImpacta_cta_cte() != null ? dto.getImpacta_cta_cte() : false;
        String relativePath = null;
        String nombreArchivo = null;

        if (file != null && !file.isEmpty()) {
            relativePath = guardarArchivo(dto.getId_cliente(), file);
            nombreArchivo = file.getOriginalFilename();
        }

        Factura entity = Factura.builder()
                .idCliente(dto.getId_cliente())
                .idObra(dto.getId_obra())
                .monto(dto.getMonto())
                .montoRestante(dto.getMonto_restante() != null ? dto.getMonto_restante() : 0d)
                .fecha(dto.getFecha() != null ? dto.getFecha() : LocalDate.now())
                .descripcion(dto.getDescripcion())
                .estado(normalizarEstado(dto.getEstado()))
                .nombreArchivo(nombreArchivo)
                .pathArchivo(relativePath)
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .impactaCtaCte(impactaCtaCte)
                .build();

        if (impactaCtaCte) {
            Transaccion movimiento = crearOActualizarMovimiento(entity, null);
            entity.setIdTransaccion(movimiento.getId());
        }

        return toDto(facturaRepository.save(entity));
    }

    @Transactional
    public FacturaDto actualizar(Long id, FacturaDto dto, MultipartFile file) {
        Factura entity = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));

        validarMontoContraPresupuesto(dto.getId_obra(), dto.getMonto(), id);

        Boolean impactaCtaCte = dto.getImpacta_cta_cte() != null ? dto.getImpacta_cta_cte() : false;

        entity.setIdCliente(dto.getId_cliente());
        entity.setIdObra(dto.getId_obra());
        entity.setMonto(dto.getMonto());
        if (dto.getMonto_restante() != null) {
            entity.setMontoRestante(dto.getMonto_restante());
        }
        entity.setFecha(dto.getFecha() != null ? dto.getFecha() : entity.getFecha());
        if (dto.getDescripcion() != null) {
            entity.setDescripcion(dto.getDescripcion());
        }
        if (dto.getEstado() != null) {
            entity.setEstado(normalizarEstado(dto.getEstado()));
        }
        entity.setActivo(dto.getActivo() != null ? dto.getActivo() : entity.getActivo());
        entity.setImpactaCtaCte(impactaCtaCte);

        if (file != null && !file.isEmpty()) {
            eliminarArchivoSiExiste(entity.getPathArchivo());
            String relativePath = guardarArchivo(dto.getId_cliente(), file);
            entity.setPathArchivo(relativePath);
            entity.setNombreArchivo(file.getOriginalFilename());
        }

        if (impactaCtaCte) {
            Transaccion movimiento = crearOActualizarMovimiento(entity, entity.getIdTransaccion());
            entity.setIdTransaccion(movimiento.getId());
        } else if (entity.getIdTransaccion() != null) {
            transaccionRepository.deleteById(entity.getIdTransaccion());
            entity.setIdTransaccion(null);
        }

        return toDto(facturaRepository.save(entity));
    }

    @Transactional
    public void eliminar(Long id) {
        Factura entity = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
        eliminarArchivoSiExiste(entity.getPathArchivo());
        if (entity.getIdTransaccion() != null) {
            transaccionRepository.deleteById(entity.getIdTransaccion());
        }
        facturaRepository.deleteById(id);
    }

    public ResponseEntity<Resource> descargarArchivo(Long id) {
        Factura entity = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));

        if (entity.getPathArchivo() == null || entity.getPathArchivo().isEmpty()) {
            throw new RuntimeException("La factura no tiene archivo adjunto");
        }

        Path filePath = Paths.get(uploadDirBase, entity.getPathArchivo()).normalize();
        FileSystemResource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            throw new RuntimeException("Archivo no encontrado: " + entity.getPathArchivo());
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + (entity.getNombreArchivo() != null ? entity.getNombreArchivo() : "factura") + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    private String guardarArchivo(Long idCliente, MultipartFile file) {
        String cleanName = sanitizeFilename(file.getOriginalFilename());
        String fileName = System.currentTimeMillis() + "_" + cleanName;
        Path folder = Paths.get(uploadDirBase, "facturas", String.valueOf(idCliente));
        Path destPath = folder.resolve(fileName).normalize();

        try {
            Files.createDirectories(destPath.getParent());
            Files.copy(file.getInputStream(), destPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo guardar el archivo de factura", e);
        }

        return Paths.get("facturas", String.valueOf(idCliente), fileName)
                .toString()
                .replace('\\', '/');
    }

    private void eliminarArchivoSiExiste(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return;
        }
        try {
            Path path = Paths.get(uploadDirBase, relativePath).normalize();
            Files.deleteIfExists(path);
        } catch (IOException e) {
            // No interrumpir la eliminacion por fallas en el filesystem
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "factura";
        }
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private FacturaDto toDto(Factura factura) {
        if (factura == null) return null;

        return FacturaDto.builder()
                .id(factura.getId())
                .id_cliente(factura.getIdCliente())
                .id_obra(factura.getIdObra())
                .monto(factura.getMonto())
                .monto_restante(factura.getMontoRestante())
                .fecha(factura.getFecha())
                .descripcion(factura.getDescripcion())
                .estado(factura.getEstado())
                .nombre_archivo(factura.getNombreArchivo())
                .path_archivo(factura.getPathArchivo())
                .activo(factura.getActivo())
                .impacta_cta_cte(factura.getImpactaCtaCte())
                .id_transaccion(factura.getIdTransaccion())
                .ultima_actualizacion(factura.getUltimaActualizacion())
                .tipo_actualizacion(factura.getTipoActualizacion())
                .build();
    }

    private Transaccion crearOActualizarMovimiento(Factura factura, Long transaccionId) {
        if (factura.getIdObra() == null) {
            throw new RuntimeException("La factura debe tener obra para impactar en cuenta corriente.");
        }
        if (factura.getIdCliente() == null) {
            throw new RuntimeException("La factura debe tener cliente para impactar en cuenta corriente.");
        }
        Double monto = factura.getMonto();
        if (monto == null) {
            throw new RuntimeException("La factura debe tener monto para impactar en cuenta corriente.");
        }

        String formaPago = calcularFormaPagoCliente(factura.getIdObra(), monto, transaccionId);
        Transaccion movimiento = transaccionId != null
                ? transaccionRepository.findById(transaccionId).orElse(new Transaccion())
                : new Transaccion();

        movimiento.setIdObra(factura.getIdObra());
        movimiento.setIdAsociado(factura.getIdCliente());
        movimiento.setTipoAsociado("CLIENTE");
        movimiento.setTipo_transaccion(TipoTransaccionEnum.COBRO);
        movimiento.setFecha(factura.getFecha());
        movimiento.setMonto(monto);
        movimiento.setForma_pago(formaPago);
        movimiento.setMedio_pago("Factura");
        movimiento.setFacturaCobrada(false);
        movimiento.setActivo(true);

        return transaccionRepository.save(movimiento);
    }

    private String calcularFormaPagoCliente(Long idObra, Double monto, Long transaccionId) {
        ObraResumenDto obra = obraCostoClient.obtenerObra(idObra);
        if (obra == null || obra.getPresupuesto() == null) {
            throw new RuntimeException("No se pudo obtener el presupuesto de la obra.");
        }

        double presupuesto = obra.getPresupuesto();
        Double cobrosRaw = transaccionRepository.sumarCobrosPorObra(idObra);
        double cobrosPrevios = cobrosRaw != null ? cobrosRaw : 0d;
        if (transaccionId != null) {
            Transaccion existente = transaccionRepository.findById(transaccionId).orElse(null);
            if (existente != null && existente.getIdObra() != null && existente.getIdObra().equals(idObra)) {
                cobrosPrevios -= existente.getMonto() != null ? existente.getMonto() : 0d;
            }
        }

        double restante = presupuesto - cobrosPrevios;
        if (monto > restante + 0.01) {
            throw new RuntimeException("El monto supera el saldo pendiente del cliente en la obra.");
        }

        return Math.abs(monto - restante) < 0.01 ? "TOTAL" : "PARCIAL";
    }

    private void validarMontoContraPresupuesto(Long idObra, Double monto, Long facturaId) {
        if (idObra == null || monto == null) return;

        ObraResumenDto obra = obraCostoClient.obtenerObra(idObra);
        if (obra == null || obra.getPresupuesto() == null) {
            throw new RuntimeException("No se pudo obtener el presupuesto de la obra.");
        }

        double presupuesto = obra.getPresupuesto();
        double facturado = facturaRepository.findByIdObra(idObra).stream()
                .filter(f -> facturaId == null || !f.getId().equals(facturaId))
                .mapToDouble(f -> f.getMonto() != null ? f.getMonto() : 0d)
                .sum();
        double restante = presupuesto - facturado;

        if (monto > restante + 0.01) {
            throw new RuntimeException("El monto supera el presupuesto disponible de la obra.");
        }
    }

    private String normalizarEstado(String estado) {
        if (estado == null || estado.isBlank()) return "EMITIDA";
        String normalizado = estado.trim().toUpperCase();
        if (!normalizado.equals("EMITIDA") && !normalizado.equals("COBRADA")) {
            throw new RuntimeException("Estado de factura invalido.");
        }
        return normalizado;
    }
}
