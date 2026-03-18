package com.backups.service;

import com.backups.config.BackupDocumentProperties;
import com.backups.config.BackupStorageProperties;
import com.backups.dto.*;
import com.backups.entity.*;
import com.backups.repository.BackupJobRepository;
import com.backups.repository.BackupScheduleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import jakarta.transaction.Transactional;
import com.microsoft.sqlserver.jdbc.SQLServerPreparedStatement;
import microsoft.sql.DateTimeOffset;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.StatementCreatorUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.sql.PreparedStatement;
import java.sql.Types;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
public class BackupService {

    private static final Logger log = LoggerFactory.getLogger(BackupService.class);

    private static final List<String> ALL_SCHEMAS = List.of(
            "clientes", "proveedores", "obras", "transacciones", "documentos", "reportes"
    );
    private static final String BACKUP_JSON_ENTRY = "backup.json";
    private static final DateTimeFormatter BACKUP_FILE_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final BackupJobRepository backupJobRepository;
    private final BackupScheduleRepository backupScheduleRepository;
    private final BackupStorageProperties storageProperties;
    private final BackupDocumentProperties documentProperties;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private MinioClient minioClient;

    public BackupService(
            BackupJobRepository backupJobRepository,
            BackupScheduleRepository backupScheduleRepository,
            BackupStorageProperties storageProperties,
            BackupDocumentProperties documentProperties,
            ObjectMapper objectMapper,
            JdbcTemplate jdbcTemplate
    ) {
        this.backupJobRepository = backupJobRepository;
        this.backupScheduleRepository = backupScheduleRepository;
        this.storageProperties = storageProperties;
        this.documentProperties = documentProperties;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    public BackupSummaryResponse getSummary() {
        BackupJobResponse lastSuccessful = backupJobRepository.findTopByStatusOrderByCompletedAtDesc(BackupStatus.COMPLETED)
                .map(this::toResponse)
                .orElse(null);
        BackupScheduleResponse schedule = toScheduleResponse(getOrCreateSchedule());
        long totalBackups = backupJobRepository.count();
        long totalStorageBytes = backupJobRepository.findAll().stream()
                .mapToLong(job -> job.getFileSizeBytes() == null ? 0L : job.getFileSizeBytes())
                .sum();

        return BackupSummaryResponse.builder()
                .lastSuccessfulBackup(lastSuccessful)
                .schedule(schedule)
                .totalBackups(totalBackups)
                .totalStorageBytes(totalStorageBytes)
                .build();
    }

    public List<BackupJobResponse> listBackups() {
        return backupJobRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public BackupScheduleResponse getSchedule() {
        return toScheduleResponse(getOrCreateSchedule());
    }

    @Transactional
    public BackupScheduleResponse updateSchedule(BackupScheduleRequest request) {
        BackupSchedule schedule = getOrCreateSchedule();
        schedule.setEnabled(Boolean.TRUE.equals(request.getEnabled()));
        schedule.setFrequency(request.getFrequency());
        schedule.setExecutionTime(LocalTime.parse(request.getExecutionTime()));
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setDayOfMonth(request.getDayOfMonth());
        schedule.setRetentionCount(request.getRetentionCount());
        schedule.setScope(request.getScope());
        schedule.setUpdatedBy(blankToDefault(request.getUpdatedBy(), "sistema"));
        schedule.setUpdatedAt(OffsetDateTime.now());
        schedule.setNextRunAt(schedule.isEnabled() ? calculateNextRun(schedule, OffsetDateTime.now()) : null);
        return toScheduleResponse(backupScheduleRepository.save(schedule));
    }

    @Transactional
    public BackupJobResponse createManualBackup(BackupCreateRequest request) {
        BackupJob job = executeBackup(
                BackupTriggerType.MANUAL,
                request.getScope(),
                request.getComment(),
                blankToDefault(request.getRequestedBy(), "usuario")
        );
        return toResponse(job);
    }

    @Transactional
    public BackupJobResponse importBackup(MultipartFile file, String requestedBy, String comment) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar un archivo ZIP.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".zip")) {
            throw new IllegalArgumentException("El archivo importado debe ser un .zip.");
        }

        OffsetDateTime startedAt = OffsetDateTime.now();
        BackupJob job = new BackupJob();
        job.setTriggerType(BackupTriggerType.MANUAL);
        job.setScope(resolveScopeFromImportedBackup(file));
        job.setStatus(BackupStatus.RUNNING);
        job.setRequestedBy(blankToDefault(requestedBy, "usuario"));
        job.setComment(blankToDefault(comment, "Backup importado"));
        job.setCreatedAt(startedAt);
        job = backupJobRepository.save(job);

        try {
            Path artifact = storeImportedBackup(job, file);
            job.setStatus(BackupStatus.COMPLETED);
            job.setFileName(artifact.getFileName().toString());
            job.setFilePath(artifact.toString());
            job.setFileSizeBytes(Files.size(artifact));
            job.setCompletedAt(OffsetDateTime.now());
            job.setDurationMillis(Duration.between(startedAt, job.getCompletedAt()).toMillis());
            job = backupJobRepository.save(job);
            return toResponse(job);
        } catch (Exception ex) {
            job.setStatus(BackupStatus.FAILED);
            job.setErrorMessage(ex.getMessage());
            job.setCompletedAt(OffsetDateTime.now());
            job.setDurationMillis(Duration.between(startedAt, job.getCompletedAt()).toMillis());
            backupJobRepository.save(job);
            throw new IllegalStateException("No se pudo importar el backup: " + ex.getMessage(), ex);
        }
    }

    public Resource getArtifact(Long backupId) {
        BackupJob job = backupJobRepository.findById(backupId)
                .orElseThrow(() -> new IllegalArgumentException("Backup no encontrado: " + backupId));
        if (job.getFilePath() == null || job.getFilePath().isBlank()) {
            throw new IllegalStateException("El backup no tiene archivo asociado.");
        }
        FileSystemResource resource = new FileSystemResource(job.getFilePath());
        if (!resource.exists()) {
            throw new IllegalStateException("No existe el archivo del backup.");
        }
        return resource;
    }

    @Transactional
    public BackupRestoreResponse restoreBackup(Long backupId) {
        BackupJob job = backupJobRepository.findById(backupId)
                .orElseThrow(() -> new IllegalArgumentException("Backup no encontrado: " + backupId));
        if (job.getFilePath() == null || job.getFilePath().isBlank()) {
            throw new IllegalStateException("El backup no tiene artefacto asociado.");
        }

        Path zipPath = Path.of(job.getFilePath());
        if (!Files.exists(zipPath)) {
            throw new IllegalStateException("No existe el archivo del backup a restaurar.");
        }

        try (ZipFile zipFile = new ZipFile(zipPath.toFile())) {
            ZipEntry entry = zipFile.getEntry(BACKUP_JSON_ENTRY);
            if (entry == null) {
                throw new IllegalStateException("El archivo backup.json no existe dentro del ZIP.");
            }

            Map<String, Object> snapshot;
            try (InputStream inputStream = zipFile.getInputStream(entry)) {
                snapshot = objectMapper.readValue(inputStream, new TypeReference<>() {});
            }

            int tablesRestored = restoreTables(snapshot);
            int documentsRestored = restoreDocumentFiles(snapshot, zipFile);

            return BackupRestoreResponse.builder()
                    .backupId(backupId)
                    .backupFileName(job.getFileName())
                    .tablesRestored(tablesRestored)
                    .documentFilesRestored(documentsRestored)
                    .message("Backup restaurado correctamente.")
                    .build();
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo restaurar el backup: " + ex.getMessage(), ex);
        }
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void runAutomaticBackups() {
        BackupSchedule schedule = getOrCreateSchedule();
        if (!schedule.isEnabled() || schedule.getNextRunAt() == null) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (schedule.getNextRunAt().isAfter(now)) {
            return;
        }

        executeBackup(
                BackupTriggerType.AUTOMATIC,
                schedule.getScope(),
                "Backup automatico programado",
                blankToDefault(schedule.getUpdatedBy(), "scheduler")
        );

        schedule.setNextRunAt(calculateNextRun(schedule, now.plusSeconds(1)));
        schedule.setUpdatedAt(now);
        backupScheduleRepository.save(schedule);
        applyRetention(schedule.getRetentionCount());
    }

    private BackupJob executeBackup(BackupTriggerType triggerType, BackupScope scope, String comment, String requestedBy) {
        OffsetDateTime startedAt = OffsetDateTime.now();
        BackupJob job = new BackupJob();
        job.setTriggerType(triggerType);
        job.setScope(scope);
        job.setStatus(BackupStatus.RUNNING);
        job.setRequestedBy(requestedBy);
        job.setComment(comment);
        job.setCreatedAt(startedAt);
        job = backupJobRepository.save(job);

        try {
            Path artifact = writeArtifact(job);
            job.setStatus(BackupStatus.COMPLETED);
            job.setFileName(artifact.getFileName().toString());
            job.setFilePath(artifact.toString());
            job.setFileSizeBytes(Files.size(artifact));
            job.setCompletedAt(OffsetDateTime.now());
            job.setDurationMillis(Duration.between(startedAt, job.getCompletedAt()).toMillis());
            return backupJobRepository.save(job);
        } catch (Exception ex) {
            job.setStatus(BackupStatus.FAILED);
            job.setErrorMessage(ex.getMessage());
            job.setCompletedAt(OffsetDateTime.now());
            job.setDurationMillis(Duration.between(startedAt, job.getCompletedAt()).toMillis());
            return backupJobRepository.save(job);
        }
    }

    private Path writeArtifact(BackupJob job) throws IOException {
        Path directory = Path.of(storageProperties.getRootDir(), storageProperties.getEnvironment());
        Files.createDirectories(directory);

        String timestamp = BACKUP_FILE_TIMESTAMP.format(job.getCreatedAt());
        String fileName = "backup-" + job.getTriggerType().name().toLowerCase() +
                "-" + job.getScope().name().toLowerCase() +
                "-" + timestamp +
                "-" + job.getId() + ".zip";
        Path artifactPath = directory.resolve(fileName);

        Map<String, Object> snapshot = buildSnapshot(job);
        List<Map<String, Object>> documents = extractDocuments(snapshot);

        try (OutputStream fileOut = Files.newOutputStream(artifactPath);
             ZipOutputStream zipOut = new ZipOutputStream(fileOut)) {
            zipOut.putNextEntry(new ZipEntry(BACKUP_JSON_ENTRY));
            zipOut.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(snapshot));
            zipOut.closeEntry();

            for (Map<String, Object> document : documents) {
                String relativePath = String.valueOf(document.get("pathArchivo"));
                if (relativePath == null || relativePath.isBlank() || "null".equals(relativePath)) {
                    continue;
                }
                String entryName = "documents/" + sanitizeZipPath(relativePath);
                byte[] content = readDocumentContent(relativePath);
                if (content == null) {
                    continue;
                }
                zipOut.putNextEntry(new ZipEntry(entryName));
                zipOut.write(content);
                zipOut.closeEntry();
            }
        }

        return artifactPath;
    }

    private Path storeImportedBackup(BackupJob job, MultipartFile file) throws IOException {
        validateImportedBackup(file);

        Path directory = Path.of(storageProperties.getRootDir(), storageProperties.getEnvironment(), "imported");
        Files.createDirectories(directory);

        String timestamp = BACKUP_FILE_TIMESTAMP.format(job.getCreatedAt());
        String sanitizedOriginalName = sanitizeImportedFileName(file.getOriginalFilename());
        String fileName = "backup-imported-" + timestamp + "-" + job.getId() + "-" + sanitizedOriginalName;
        Path artifactPath = directory.resolve(fileName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, artifactPath, StandardCopyOption.REPLACE_EXISTING);
        }

        return artifactPath;
    }

    private void validateImportedBackup(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             java.util.zip.ZipInputStream zipInputStream = new java.util.zip.ZipInputStream(inputStream)) {
            ZipEntry entry;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (BACKUP_JSON_ENTRY.equals(entry.getName())) {
                    return;
                }
            }
        }
        throw new IllegalArgumentException("El ZIP no contiene el archivo backup.json.");
    }

    private BackupScope resolveScopeFromImportedBackup(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream();
             ZipInputStream zipInputStream = new ZipInputStream(inputStream)) {
            ZipEntry entry;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (!BACKUP_JSON_ENTRY.equals(entry.getName())) {
                    continue;
                }
                Map<String, Object> snapshot = objectMapper.readValue(zipInputStream, new TypeReference<>() {});
                Object rawMeta = snapshot.get("meta");
                if (rawMeta instanceof Map<?, ?> meta) {
                    Object rawScope = meta.get("scope");
                    if (rawScope instanceof String scopeValue) {
                        try {
                            return BackupScope.valueOf(scopeValue);
                        } catch (IllegalArgumentException ignored) {
                            return BackupScope.FULL;
                        }
                    }
                }
                break;
            }
        } catch (IOException ignored) {
            return BackupScope.FULL;
        }
        return BackupScope.FULL;
    }

    private String sanitizeImportedFileName(String originalFilename) {
        String sanitized = originalFilename == null ? "backup.zip" : originalFilename.replaceAll("[^A-Za-z0-9._-]", "_");
        return sanitized.isBlank() ? "backup.zip" : sanitized;
    }

    private Map<String, Object> buildSnapshot(BackupJob job) {
        List<String> schemas = schemasForScope(job.getScope());
        List<Map<String, Object>> tables = new ArrayList<>();
        for (String schema : schemas) {
            for (String table : listTables(schema)) {
                tables.add(exportTable(schema, table));
            }
        }

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("version", "1.0");
        meta.put("backupId", job.getId());
        meta.put("triggerType", job.getTriggerType());
        meta.put("scope", job.getScope());
        meta.put("createdAt", job.getCreatedAt());
        meta.put("requestedBy", job.getRequestedBy());
        meta.put("comment", job.getComment());
        meta.put("environment", storageProperties.getEnvironment());

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("meta", meta);
        snapshot.put("tables", tables);
        snapshot.put("documents", extractDocumentsFromTables(tables));
        return snapshot;
    }

    private List<Map<String, Object>> extractDocuments(Map<String, Object> snapshot) {
        Object raw = snapshot.get("documents");
        if (raw instanceof List<?> list) {
            return list.stream()
                    .filter(Map.class::isInstance)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return List.of();
    }

    private List<Map<String, Object>> extractDocumentsFromTables(List<Map<String, Object>> tables) {
        return tables.stream()
                .filter(table -> "documentos".equals(table.get("schema")) && "documentos".equals(table.get("table")))
                .findFirst()
                .map(table -> {
                    Object rawRows = table.get("rows");
                    if (rawRows instanceof List<?> list) {
                        return list.stream()
                                .filter(Map.class::isInstance)
                                .map(row -> {
                                    Map<String, Object> source = (Map<String, Object>) row;
                                    Map<String, Object> doc = new LinkedHashMap<>();
                                    doc.put("idDocumento", source.get("idDocumento"));
                                    doc.put("nombreArchivo", source.get("nombreArchivo"));
                                    doc.put("pathArchivo", source.get("pathArchivo"));
                                    return doc;
                                })
                                .toList();
                    }
                    return List.<Map<String, Object>>of();
                })
                .orElse(List.of());
    }

    private Map<String, Object> exportTable(String schema, String table) {
        List<Map<String, Object>> columns = listColumns(schema, table);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM [" + schema + "].[" + table + "]");
        List<Map<String, Object>> normalizedRows = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            for (Map<String, Object> column : columns) {
                String name = String.valueOf(column.get("name"));
                Object value = row.get(name);
                normalized.put(name, normalizeValueForJson(value));
            }
            normalizedRows.add(normalized);
        }

        Map<String, Object> tableMap = new LinkedHashMap<>();
        tableMap.put("schema", schema);
        tableMap.put("table", table);
        tableMap.put("identityColumn", identityColumn(schema, table));
        tableMap.put("columns", columns);
        tableMap.put("rows", normalizedRows);
        return tableMap;
    }

    private Object normalizeValueForJson(Object value) {
        if (value == null) return null;
        if (value instanceof java.sql.Timestamp ts) return ts.toInstant().toString();
        if (value instanceof java.sql.Date dt) return dt.toLocalDate().toString();
        if (value instanceof java.sql.Time tm) return tm.toLocalTime().toString();
        if (value instanceof DateTimeOffset dto) return dto.getOffsetDateTime().toString();
        if (value instanceof OffsetDateTime odt) return odt.toString();
        if (value instanceof LocalDateTime ldt) return ldt.toString();
        if (value instanceof LocalDate ld) return ld.toString();
        if (value instanceof LocalTime lt) return lt.toString();
        if (value instanceof byte[] bytes) return Base64.getEncoder().encodeToString(bytes);
        return value;
    }

    private int restoreTables(Map<String, Object> snapshot) {
        List<Map<String, Object>> tables = extractTableEntries(snapshot);
        List<Map<String, Object>> orderedTables = tables.stream()
                .sorted(Comparator.comparing(map -> String.valueOf(map.get("schema")) + "." + map.get("table")))
                .toList();

        disableConstraintsForSchemas(schemasFromSnapshot(orderedTables));
        try {
            for (int i = orderedTables.size() - 1; i >= 0; i--) {
                Map<String, Object> table = orderedTables.get(i);
                jdbcTemplate.execute("DELETE FROM [" + table.get("schema") + "].[" + table.get("table") + "]");
            }

            for (Map<String, Object> table : orderedTables) {
                insertRows(table);
            }
        } finally {
            enableConstraintsForSchemas(schemasFromSnapshot(orderedTables));
        }
        return orderedTables.size();
    }

    private int restoreDocumentFiles(Map<String, Object> snapshot, ZipFile zipFile) throws IOException {
        List<Map<String, Object>> documents = extractDocuments(snapshot);
        int restored = 0;
        for (Map<String, Object> document : documents) {
            String relativePath = String.valueOf(document.get("pathArchivo"));
            if (relativePath == null || relativePath.isBlank() || "null".equals(relativePath)) {
                continue;
            }
            String entryName = "documents/" + sanitizeZipPath(relativePath);
            ZipEntry entry = zipFile.getEntry(entryName);
            if (entry == null) {
                continue;
            }
            try (InputStream inputStream = zipFile.getInputStream(entry)) {
                byte[] bytes = inputStream.readAllBytes();
                writeDocumentContent(relativePath, bytes);
            }
            restored++;
        }
        return restored;
    }

    private void insertRows(Map<String, Object> tableEntry) {
        String schema = String.valueOf(tableEntry.get("schema"));
        String table = String.valueOf(tableEntry.get("table"));
        String identityColumn = tableEntry.get("identityColumn") != null ? String.valueOf(tableEntry.get("identityColumn")) : null;
        List<Map<String, Object>> columns = (List<Map<String, Object>>) tableEntry.get("columns");
        List<Map<String, Object>> rows = (List<Map<String, Object>>) tableEntry.get("rows");
        if (rows == null || rows.isEmpty()) {
            return;
        }

        List<String> columnNames = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .toList();
        String insertSql = buildInsertSql(schema, table, columnNames);
        boolean useIdentityInsert = identityColumn != null && columnNames.contains(identityColumn);

        if (useIdentityInsert) {
            jdbcTemplate.execute("SET IDENTITY_INSERT [" + schema + "].[" + table + "] ON");
        }
        try {
            int rowIndex = 0;
            for (Map<String, Object> row : rows) {
                rowIndex++;
                jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(insertSql);
                    for (int i = 0; i < columnNames.size(); i++) {
                        String columnName = columnNames.get(i);
                        Map<String, Object> columnMetadata = columns.get(i);
                        String sqlTypeName = String.valueOf(columnMetadata.get("type"));
                        Object value = convertValueForDatabase(row.get(columnName), sqlTypeName);
                        int jdbcType = jdbcTypeFromSqlType(sqlTypeName);
                        if (value == null) {
                            ps.setNull(i + 1, jdbcType);
                        } else if (jdbcType == microsoft.sql.Types.DATETIMEOFFSET) {
                            setDateTimeOffsetValue(ps, i + 1, value, schema, table, columnName);
                        } else {
                            StatementCreatorUtils.setParameterValue(ps, i + 1, jdbcType, value);
                        }
                    }
                    return ps;
                });
            }
            if (identityColumn != null) {
                jdbcTemplate.execute("DBCC CHECKIDENT ('[" + schema + "].[" + table + "]', RESEED)");
            }
        } catch (Exception ex) {
            logRestoreError(schema, table, columns, rows, ex);
            throw ex;
        } finally {
            if (useIdentityInsert) {
                jdbcTemplate.execute("SET IDENTITY_INSERT [" + schema + "].[" + table + "] OFF");
            }
        }
    }

    private Object convertValueForDatabase(Object value, String type) {
        if (value == null) return null;
        String normalizedType = type == null ? "" : type.toLowerCase();
        if (normalizedType.contains("date") && !normalizedType.contains("time") && value instanceof String str) {
            return java.sql.Date.valueOf(LocalDate.parse(str));
        }
        if (normalizedType.contains("time") && !normalizedType.contains("date") && value instanceof String str) {
            return java.sql.Time.valueOf(LocalTime.parse(str));
        }
        if ((normalizedType.contains("datetime") || normalizedType.contains("smalldatetime") || normalizedType.contains("datetime2"))
                && value instanceof String str) {
            return java.sql.Timestamp.from(Instant.parse(normalizeInstantString(str)));
        }
        if (normalizedType.contains("datetimeoffset") && value instanceof String str) {
            OffsetDateTime odt = OffsetDateTime.parse(str);
            return DateTimeOffset.valueOf(
                    java.sql.Timestamp.valueOf(odt.toLocalDateTime()),
                    odt.getOffset().getTotalSeconds() / 60
            );
        }
        if ((normalizedType.contains("binary") || normalizedType.contains("varbinary")) && value instanceof String str) {
            return Base64.getDecoder().decode(str);
        }
        if (normalizedType.equals("bit")) {
            if (value instanceof Boolean bool) return bool;
            return Boolean.parseBoolean(String.valueOf(value));
        }
        return value;
    }

    private void setDateTimeOffsetValue(
            PreparedStatement ps,
            int parameterIndex,
            Object value,
            String schema,
            String table,
            String columnName
    ) throws java.sql.SQLException {
        DateTimeOffset dateTimeOffset = toDateTimeOffset(value);
        if (dateTimeOffset == null) {
            ps.setNull(parameterIndex, microsoft.sql.Types.DATETIMEOFFSET);
            return;
        }

        if (ps instanceof SQLServerPreparedStatement sqlServerPreparedStatement) {
            sqlServerPreparedStatement.setDateTimeOffset(parameterIndex, dateTimeOffset);
            return;
        }

        log.warn(
                "PreparedStatement no expone SQLServerPreparedStatement para {}.{}.{}; se usa fallback string.",
                schema,
                table,
                columnName
        );
        ps.setString(parameterIndex, dateTimeOffset.toString());
    }

    private DateTimeOffset toDateTimeOffset(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof DateTimeOffset dto) {
            return dto;
        }
        if (value instanceof OffsetDateTime odt) {
            return DateTimeOffset.valueOf(
                    java.sql.Timestamp.valueOf(odt.toLocalDateTime()),
                    odt.getOffset().getTotalSeconds() / 60
            );
        }
        if (value instanceof Instant instant) {
            return toDateTimeOffset(instant.atOffset(ZoneOffset.UTC));
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return DateTimeOffset.valueOf(timestamp, 0);
        }
        if (value instanceof String str) {
            return toDateTimeOffset(OffsetDateTime.parse(str));
        }
        if (value instanceof Map<?, ?> map) {
            Object offsetDateTime = map.get("offsetDateTime");
            if (offsetDateTime instanceof String offsetDateTimeStr && !offsetDateTimeStr.isBlank()) {
                return toDateTimeOffset(offsetDateTimeStr);
            }

            Object timestamp = map.get("timestamp");
            Object minutesOffset = map.get("minutesOffset");
            if (timestamp instanceof String timestampStr && minutesOffset instanceof Number offsetMinutes) {
                OffsetDateTime parsedTimestamp = OffsetDateTime.parse(timestampStr);
                ZoneOffset zoneOffset = ZoneOffset.ofTotalSeconds(offsetMinutes.intValue() * 60);
                return toDateTimeOffset(parsedTimestamp.withOffsetSameInstant(zoneOffset));
            }
        }
        throw new IllegalArgumentException("Valor no soportado para DATETIMEOFFSET: " + value.getClass().getName());
    }

    private int jdbcTypeFromSqlType(String type) {
        String normalizedType = type == null ? "" : type.toLowerCase();
        return switch (normalizedType) {
            case "bigint" -> Types.BIGINT;
            case "int" -> Types.INTEGER;
            case "smallint" -> Types.SMALLINT;
            case "tinyint" -> Types.TINYINT;
            case "bit" -> Types.BIT;
            case "decimal", "numeric", "money", "smallmoney" -> Types.DECIMAL;
            case "float" -> Types.DOUBLE;
            case "real" -> Types.REAL;
            case "date" -> Types.DATE;
            case "time" -> Types.TIME;
            case "datetime", "datetime2", "smalldatetime" -> Types.TIMESTAMP;
            case "datetimeoffset" -> microsoft.sql.Types.DATETIMEOFFSET;
            case "binary", "varbinary", "image" -> Types.VARBINARY;
            case "uniqueidentifier" -> Types.VARCHAR;
            case "char", "nchar", "varchar", "nvarchar", "text", "ntext" -> Types.VARCHAR;
            default -> Types.OTHER;
        };
    }

    private void logRestoreError(
            String schema,
            String table,
            List<Map<String, Object>> columns,
            List<Map<String, Object>> rows,
            Exception ex
    ) {
        Throwable cause = rootCause(ex);
        String message = cause.getMessage() == null ? ex.getMessage() : cause.getMessage();
        log.error("Error restaurando tabla {}.{}: {}", schema, table, message, ex);

        if (message == null) {
            return;
        }

        String lowerMessage = message.toLowerCase();
        if (!lowerMessage.contains("date") && !lowerMessage.contains("time") && !lowerMessage.contains("conversion")) {
            return;
        }

        for (Map<String, Object> row : rows) {
            for (Map<String, Object> column : columns) {
                String columnName = String.valueOf(column.get("name"));
                String sqlType = String.valueOf(column.get("type"));
                Object value = row.get(columnName);
                try {
                    convertValueForDatabase(value, sqlType);
                } catch (Exception conversionEx) {
                    log.error(
                            "Valor conflictivo detectado en {}.{} columna={} tipo={} valor={}",
                            schema,
                            table,
                            columnName,
                            sqlType,
                            value,
                            conversionEx
                    );
                    return;
                }
            }
        }

        log.error("No se pudo identificar la columna exacta con analisis local. Revisar valores de fecha/hora del backup para {}.{}", schema, table);
    }

    private Throwable rootCause(Throwable ex) {
        Throwable current = ex;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current;
    }

    private String normalizeInstantString(String value) {
        if (value.endsWith("Z")) return value;
        if (value.contains("+") || value.matches(".*-\\d\\d:\\d\\d$")) {
            return OffsetDateTime.parse(value).toInstant().toString();
        }
        return LocalDateTime.parse(value).toInstant(ZoneOffset.UTC).toString();
    }

    private List<Map<String, Object>> listColumns(String schema, String table) {
        return jdbcTemplate.query(
                "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
                (rs, rowNum) -> {
                    Map<String, Object> column = new LinkedHashMap<>();
                    column.put("name", rs.getString("COLUMN_NAME"));
                    column.put("type", rs.getString("DATA_TYPE"));
                    return column;
                },
                schema,
                table
        );
    }

    private List<String> listTables(String schema) {
        return jdbcTemplate.query(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
                (rs, rowNum) -> rs.getString("TABLE_NAME"),
                schema
        );
    }

    private String identityColumn(String schema, String table) {
        List<String> columns = jdbcTemplate.query(
                "SELECT c.name FROM sys.columns c " +
                        "JOIN sys.tables t ON c.object_id = t.object_id " +
                        "JOIN sys.schemas s ON t.schema_id = s.schema_id " +
                        "WHERE s.name = ? AND t.name = ? AND c.is_identity = 1",
                (rs, rowNum) -> rs.getString(1),
                schema,
                table
        );
        return columns.isEmpty() ? null : columns.get(0);
    }

    private List<String> schemasForScope(BackupScope scope) {
        if (scope == BackupScope.DOCUMENTS) {
            return List.of("documentos");
        }
        return ALL_SCHEMAS;
    }

    private void disableConstraintsForSchemas(List<String> schemas) {
        for (String schema : schemas) {
            for (String table : listTables(schema)) {
                jdbcTemplate.execute("ALTER TABLE [" + schema + "].[" + table + "] NOCHECK CONSTRAINT ALL");
            }
        }
    }

    private void enableConstraintsForSchemas(List<String> schemas) {
        for (String schema : schemas) {
            for (String table : listTables(schema)) {
                jdbcTemplate.execute("ALTER TABLE [" + schema + "].[" + table + "] WITH CHECK CHECK CONSTRAINT ALL");
            }
        }
    }

    private List<Map<String, Object>> extractTableEntries(Map<String, Object> snapshot) {
        Object raw = snapshot.get("tables");
        if (raw instanceof List<?> list) {
            return list.stream()
                    .filter(Map.class::isInstance)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return List.of();
    }

    private List<String> schemasFromSnapshot(List<Map<String, Object>> tables) {
        return tables.stream()
                .map(table -> String.valueOf(table.get("schema")))
                .distinct()
                .toList();
    }

    private String buildInsertSql(String schema, String table, List<String> columns) {
        String joinedColumns = columns.stream().map(col -> "[" + col + "]").reduce((a, b) -> a + ", " + b).orElse("");
        String joinedParams = columns.stream().map(col -> "?").reduce((a, b) -> a + ", " + b).orElse("");
        return "INSERT INTO [" + schema + "].[" + table + "] (" + joinedColumns + ") VALUES (" + joinedParams + ")";
    }

    private byte[] readDocumentContent(String relativePath) {
        if (documentProperties.getMinio().isEnabled()) {
            try {
                try (InputStream inputStream = getMinioClient().getObject(
                        GetObjectArgs.builder()
                                .bucket(documentProperties.getMinio().getBucket())
                                .object(relativePath)
                                .build()
                )) {
                    return inputStream.readAllBytes();
                }
            } catch (Exception ignored) {
                return null;
            }
        }

        try {
            Path filePath = Path.of(documentProperties.getRootDir(), relativePath).normalize();
            return Files.exists(filePath) ? Files.readAllBytes(filePath) : null;
        } catch (IOException ex) {
            return null;
        }
    }

    private void writeDocumentContent(String relativePath, byte[] bytes) throws IOException {
        if (documentProperties.getMinio().isEnabled()) {
            try (ByteArrayInputStream inputStream = new ByteArrayInputStream(bytes)) {
                getMinioClient().putObject(
                        PutObjectArgs.builder()
                                .bucket(documentProperties.getMinio().getBucket())
                                .object(relativePath)
                                .stream(inputStream, bytes.length, -1)
                                .build()
                );
            } catch (Exception ex) {
                throw new IOException("No se pudo restaurar el documento en MinIO: " + relativePath, ex);
            }
            return;
        }

        Path destination = Path.of(documentProperties.getRootDir(), relativePath).normalize();
        Files.createDirectories(destination.getParent());
        Files.write(destination, bytes);
    }

    private MinioClient getMinioClient() {
        if (minioClient == null) {
            minioClient = MinioClient.builder()
                    .endpoint(documentProperties.getMinio().getUrl())
                    .credentials(documentProperties.getMinio().getAccessKey(), documentProperties.getMinio().getSecretKey())
                    .build();
        }
        return minioClient;
    }

    private String sanitizeZipPath(String path) {
        return path.replace("\\", "/");
    }

    private void applyRetention(int retentionCount) {
        List<BackupJob> completedJobs = backupJobRepository.findByStatusOrderByCreatedAtDesc(BackupStatus.COMPLETED);
        if (completedJobs.size() <= retentionCount) {
            return;
        }

        completedJobs.stream()
                .skip(retentionCount)
                .forEach(job -> {
                    deleteArtifact(job.getFilePath());
                    backupJobRepository.delete(job);
                });
    }

    private void deleteArtifact(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(Path.of(filePath));
        } catch (IOException ignored) {
        }
    }

    private BackupSchedule getOrCreateSchedule() {
        return backupScheduleRepository.findById(1L).orElseGet(() -> {
            BackupSchedule schedule = new BackupSchedule();
            schedule.setId(1L);
            schedule.setEnabled(false);
            schedule.setFrequency(BackupFrequency.DAILY);
            schedule.setExecutionTime(LocalTime.of(2, 0));
            schedule.setDayOfWeek(1);
            schedule.setDayOfMonth(1);
            schedule.setRetentionCount(15);
            schedule.setScope(BackupScope.FULL);
            schedule.setUpdatedBy("sistema");
            schedule.setUpdatedAt(OffsetDateTime.now());
            return backupScheduleRepository.save(schedule);
        });
    }

    private OffsetDateTime calculateNextRun(BackupSchedule schedule, OffsetDateTime reference) {
        ZoneId zoneId = ZoneId.systemDefault();
        ZonedDateTime base = reference.atZoneSameInstant(zoneId).withSecond(0).withNano(0);
        LocalTime executionTime = schedule.getExecutionTime();
        LocalDate date = base.toLocalDate();

        ZonedDateTime candidate;
        switch (schedule.getFrequency()) {
            case WEEKLY -> {
                int targetDay = schedule.getDayOfWeek() == null ? 1 : schedule.getDayOfWeek();
                candidate = date.atTime(executionTime).atZone(zoneId)
                        .with(TemporalAdjusters.nextOrSame(DayOfWeek.of(targetDay)));
                if (!candidate.isAfter(base)) {
                    candidate = candidate.plusWeeks(1);
                }
            }
            case MONTHLY -> {
                int targetDay = schedule.getDayOfMonth() == null ? 1 : schedule.getDayOfMonth();
                int day = Math.min(targetDay, YearMonth.from(date).lengthOfMonth());
                candidate = date.withDayOfMonth(1).atTime(executionTime).atZone(zoneId).withDayOfMonth(day);
                if (!candidate.isAfter(base)) {
                    LocalDate nextMonth = date.plusMonths(1).withDayOfMonth(1);
                    int nextDay = Math.min(targetDay, YearMonth.from(nextMonth).lengthOfMonth());
                    candidate = nextMonth.atTime(executionTime).atZone(zoneId).withDayOfMonth(nextDay);
                }
            }
            default -> {
                candidate = date.atTime(executionTime).atZone(zoneId);
                if (!candidate.isAfter(base)) {
                    candidate = candidate.plusDays(1);
                }
            }
        }

        return candidate.toOffsetDateTime();
    }

    private BackupJobResponse toResponse(BackupJob job) {
        return BackupJobResponse.builder()
                .id(job.getId())
                .triggerType(job.getTriggerType())
                .scope(job.getScope())
                .status(job.getStatus())
                .requestedBy(job.getRequestedBy())
                .comment(job.getComment())
                .fileName(job.getFileName())
                .filePath(job.getFilePath())
                .fileSizeBytes(job.getFileSizeBytes())
                .durationMillis(job.getDurationMillis())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .completedAt(job.getCompletedAt())
                .build();
    }

    private BackupScheduleResponse toScheduleResponse(BackupSchedule schedule) {
        return BackupScheduleResponse.builder()
                .enabled(schedule.isEnabled())
                .frequency(schedule.getFrequency())
                .executionTime(schedule.getExecutionTime().toString())
                .dayOfWeek(schedule.getDayOfWeek())
                .dayOfMonth(schedule.getDayOfMonth())
                .retentionCount(schedule.getRetentionCount())
                .scope(schedule.getScope())
                .nextRunAt(schedule.getNextRunAt())
                .updatedBy(schedule.getUpdatedBy())
                .updatedAt(schedule.getUpdatedAt())
                .build();
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
