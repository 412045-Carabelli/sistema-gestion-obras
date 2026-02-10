package com.obras;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Time;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class SqliteToSqlServerMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SqliteToSqlServerMigrator.class);

    private final DataSource dataSource;
    private final Environment env;

    @org.springframework.beans.factory.annotation.Value("${app.migration.enabled:false}")
    private boolean enabled;

    @org.springframework.beans.factory.annotation.Value("${app.migration.sqlite-url:}")
    private String sqliteUrl;

    @org.springframework.beans.factory.annotation.Value("${app.migration.schema:dbo}")
    private String schema;

    @org.springframework.beans.factory.annotation.Value("${app.migration.marker-table:migration_history}")
    private String markerTable;

    @org.springframework.beans.factory.annotation.Value("${app.migration.batch-size:500}")
    private int batchSize;

    public SqliteToSqlServerMigrator(DataSource dataSource, Environment env) {
        this.dataSource = dataSource;
        this.env = env;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!enabled) {
            return;
        }
        String effectiveSqliteUrl = sqliteUrl;
        if (effectiveSqliteUrl == null || effectiveSqliteUrl.isBlank()) {
            effectiveSqliteUrl = resolveSqliteUrl();
        }
        if (effectiveSqliteUrl == null || effectiveSqliteUrl.isBlank()) {
            log.warn("Migration enabled but app.migration.sqlite-url is empty. Skipping.");
            return;
        }
        if (!legacyFileExists(effectiveSqliteUrl)) {
            log.warn("Legacy SQLite file not found for url {}. Skipping migration.", effectiveSqliteUrl);
            return;
        }

        log.info("SQLite migration enabled. sqliteUrl={}, schema={}, markerTable={}, batchSize={}",
                effectiveSqliteUrl, schema, markerTable, batchSize);

        try (Connection sqlConn = dataSource.getConnection();
             Connection sqliteConn = java.sql.DriverManager.getConnection(effectiveSqliteUrl)) {

            if (alreadyMigrated(sqlConn)) {
                log.info("SQLite migration already completed. Skipping.");
                return;
            }

            sqlConn.setAutoCommit(false);
            disableConstraints(sqlConn);
            migrateTables(sqlConn, sqliteConn);
            enableConstraints(sqlConn);
            markMigrated(sqlConn);
            sqlConn.commit();
            log.info("SQLite migration completed.");
        }
    }

    private boolean legacyFileExists(String url) {
        if (!url.startsWith("jdbc:sqlite:")) {
            return true;
        }
        String path = url.substring("jdbc:sqlite:".length());
        File file = new File(path);
        return file.exists();
    }

    private String resolveSqliteUrl() {
        String dir = env.getProperty("app.migration.sqlite-dir", "data");
        String file = env.getProperty("app.migration.sqlite-file");
        if (file == null || file.isBlank()) {
            String appName = env.getProperty("spring.application.name", "");
            file = defaultSqliteFile(appName);
        }
        if (file == null || file.isBlank()) {
            return null;
        }
        String sep = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";
        return "jdbc:sqlite:" + dir + sep + file;
    }

    private String defaultSqliteFile(String appName) {
        String name = appName == null ? "" : appName.toLowerCase();
        if (name.contains("documentos")) return "documentos-dev.db";
        if (name.contains("obras")) return "obras.db";
        if (name.contains("clientes")) return "clientes.db";
        if (name.contains("proveedores")) return "proveedores.db";
        if (name.contains("transacciones")) return "transacciones.db";
        if (name.contains("reportes")) return "reportes.db";
        if (name.endsWith("-service")) {
            name = name.substring(0, name.indexOf("-service"));
        }
        return name.isBlank() ? null : name + ".db";
    }

    private boolean alreadyMigrated(Connection sqlConn) throws SQLException {
        ensureMarkerTable(sqlConn);
        String sql = "SELECT COUNT(1) FROM [" + schema + "].[" + markerTable + "] WHERE migration_key = 'sqlite'";
        try (Statement st = sqlConn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            return rs.next() && rs.getInt(1) > 0;
        }
    }

    private void markMigrated(Connection sqlConn) throws SQLException {
        String sql = "IF NOT EXISTS (SELECT 1 FROM [" + schema + "].[" + markerTable + "] WHERE migration_key = 'sqlite') " +
                "INSERT INTO [" + schema + "].[" + markerTable + "] (migration_key, migrated_at) VALUES ('sqlite', SYSDATETIME())";
        try (Statement st = sqlConn.createStatement()) {
            st.execute(sql);
        }
    }

    private void ensureMarkerTable(Connection sqlConn) throws SQLException {
        String sql = "IF OBJECT_ID('" + schema + "." + markerTable + "', 'U') IS NULL " +
                "CREATE TABLE [" + schema + "].[" + markerTable + "] (" +
                "migration_key NVARCHAR(100) NOT NULL PRIMARY KEY," +
                "migrated_at DATETIME2 NOT NULL" +
                ")";
        try (Statement st = sqlConn.createStatement()) {
            st.execute(sql);
        }
    }

    private void migrateTables(Connection sqlConn, Connection sqliteConn) throws SQLException {
        List<String> tables = sqliteTables(sqliteConn);
        log.info("SQLite tables found: {}", tables.size());
        if (tables.isEmpty()) {
            log.warn("No tables found in SQLite. Nothing to migrate.");
        }
        for (String table : tables) {
            if (!tableExists(sqlConn, table)) {
                log.warn("Target table {} does not exist in SQL Server. Skipping.", table);
                continue;
            }
            migrateTable(sqlConn, sqliteConn, table);
        }
    }

    private List<String> sqliteTables(Connection sqliteConn) throws SQLException {
        List<String> tables = new ArrayList<>();
        String sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
        try (Statement st = sqliteConn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                tables.add(rs.getString(1));
            }
        }
        return tables;
    }

    private boolean tableExists(Connection sqlConn, String table) throws SQLException {
        String sql = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?";
        try (PreparedStatement ps = sqlConn.prepareStatement(sql)) {
            ps.setString(1, schema);
            ps.setString(2, table);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private Map<String, String> targetColumnTypes(Connection sqlConn, String table) throws SQLException {
        Map<String, String> types = new HashMap<>();
        String sql = "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?";
        try (PreparedStatement ps = sqlConn.prepareStatement(sql)) {
            ps.setString(1, schema);
            ps.setString(2, table);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    types.put(rs.getString(1).toLowerCase(), rs.getString(2).toLowerCase());
                }
            }
        }
        return types;
    }

    private void migrateTable(Connection sqlConn, Connection sqliteConn, String table) throws SQLException {
        String selectSqlite = "SELECT * FROM [" + table + "]";
        try (Statement sqliteStmt = sqliteConn.createStatement();
             ResultSet rs = sqliteStmt.executeQuery(selectSqlite)) {

            ResultSetMetaData md = rs.getMetaData();
            int colCount = md.getColumnCount();
            if (colCount == 0) {
                return;
            }

            log.info("Migrating table {} ({} columns)...", table, colCount);

            List<String> columns = new ArrayList<>();
            for (int i = 1; i <= colCount; i++) {
                columns.add(md.getColumnName(i));
            }

            Map<String, String> targetTypes = targetColumnTypes(sqlConn, table);
            String insertSql = buildInsertSql(table, columns);
            String identityColumn = identityColumn(sqlConn, table);
            boolean useIdentityInsert = identityColumn != null && columns.contains(identityColumn);

            int rows = 0;
            try (Statement sqlStmt = sqlConn.createStatement();
                 PreparedStatement insertStmt = sqlConn.prepareStatement(insertSql)) {

                if (useIdentityInsert) {
                    sqlStmt.execute("SET IDENTITY_INSERT [" + schema + "].[" + table + "] ON");
                }

                int batch = 0;
                while (rs.next()) {
                    for (int i = 1; i <= colCount; i++) {
                        String col = columns.get(i - 1);
                        String targetType = targetTypes.get(col.toLowerCase());
                        Object value = rs.getObject(i);
                        Object converted = convertValue(value, targetType);
                        insertStmt.setObject(i, converted);
                    }
                    insertStmt.addBatch();
                    batch++;
                    rows++;
                    if (batch % batchSize == 0) {
                        insertStmt.executeBatch();
                    }
                }
                insertStmt.executeBatch();

                if (useIdentityInsert) {
                    sqlStmt.execute("SET IDENTITY_INSERT [" + schema + "].[" + table + "] OFF");
                }
            }
            sqlConn.commit();
            log.info("Migrated table {} ({} rows).", table, rows);
        }
    }

    private Object convertValue(Object value, String targetType) {
        if (value == null || targetType == null) {
            return value;
        }
        String type = targetType.toLowerCase();
        if (type.contains("datetimeoffset")) {
            return toOffsetDateTime(value);
        }
        if (type.equals("datetime") || type.equals("datetime2") || type.equals("smalldatetime")) {
            OffsetDateTime odt = toOffsetDateTime(value);
            return odt != null ? Timestamp.from(odt.toInstant()) : value;
        }
        if (type.equals("date")) {
            LocalDate ld = toLocalDate(value);
            return ld != null ? Date.valueOf(ld) : value;
        }
        if (type.equals("time")) {
            LocalTime lt = toLocalTime(value);
            return lt != null ? Time.valueOf(lt) : value;
        }
        return value;
    }

    private OffsetDateTime toOffsetDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof OffsetDateTime) return (OffsetDateTime) value;
        if (value instanceof Timestamp ts) return ts.toInstant().atOffset(ZoneOffset.UTC);
        if (value instanceof java.util.Date dt) return dt.toInstant().atOffset(ZoneOffset.UTC);
        if (value instanceof Number num) {
            long n = num.longValue();
            Instant instant = n > 100000000000L ? Instant.ofEpochMilli(n) : Instant.ofEpochSecond(n);
            return instant.atOffset(ZoneOffset.UTC);
        }
        if (value instanceof String s) {
            try { return OffsetDateTime.parse(s); } catch (DateTimeParseException ignored) {}
            try { return LocalDateTime.parse(s).atOffset(ZoneOffset.UTC); } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof Date d) return d.toLocalDate();
        if (value instanceof java.util.Date dt) return dt.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        if (value instanceof Number num) {
            long n = num.longValue();
            Instant instant = n > 100000000000L ? Instant.ofEpochMilli(n) : Instant.ofEpochSecond(n);
            return instant.atZone(ZoneOffset.UTC).toLocalDate();
        }
        if (value instanceof String s) {
            try { return LocalDate.parse(s); } catch (DateTimeParseException ignored) {}
            try { return LocalDateTime.parse(s).toLocalDate(); } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private LocalTime toLocalTime(Object value) {
        if (value == null) return null;
        if (value instanceof Time t) return t.toLocalTime();
        if (value instanceof String s) {
            try { return LocalTime.parse(s); } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private String buildInsertSql(String table, List<String> columns) {
        StringBuilder sb = new StringBuilder();
        sb.append("INSERT INTO [").append(schema).append("].[" ).append(table).append("] (");
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("[").append(columns.get(i)).append("]");
        }
        sb.append(") VALUES (");
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("?");
        }
        sb.append(")");
        return sb.toString();
    }

    private String identityColumn(Connection sqlConn, String table) throws SQLException {
        String sql = "SELECT c.name FROM sys.columns c " +
                "JOIN sys.tables t ON c.object_id = t.object_id " +
                "JOIN sys.schemas s ON t.schema_id = s.schema_id " +
                "WHERE s.name = ? AND t.name = ? AND c.is_identity = 1";
        try (PreparedStatement ps = sqlConn.prepareStatement(sql)) {
            ps.setString(1, schema);
            ps.setString(2, table);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private void disableConstraints(Connection sqlConn) {
        try (Statement st = sqlConn.createStatement()) {
            st.execute("EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'");
        } catch (SQLException ex) {
            log.warn("Failed to disable constraints: {}", ex.getMessage());
        }
    }

    private void enableConstraints(Connection sqlConn) {
        try (Statement st = sqlConn.createStatement()) {
            st.execute("EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'");
        } catch (SQLException ex) {
            log.warn("Failed to re-enable constraints: {}", ex.getMessage());
        }
    }
}