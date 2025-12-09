-- Tabla de comisiones
CREATE TABLE IF NOT EXISTS comisiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_obra BIGINT NOT NULL,
  monto DECIMAL(15,2),
  fecha DATE,
  pagado BOOLEAN DEFAULT FALSE
);

-- Tabla auxiliar para auditoría de movimientos de reportes
CREATE TABLE IF NOT EXISTS movimientos_reporte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referencia VARCHAR(255),
  monto DECIMAL(15,2),
  fecha DATE,
  tipo VARCHAR(100)
);
