"""
Migrador automático SQLite → SQL Server para SGO.
Se ejecuta una sola vez por servicio; deja un flag file para no repetirse.
"""
import os
import sqlite3
import time
from datetime import datetime
import pyodbc

DB_HOST     = os.getenv("DB_HOST", "sqlserver")
DB_PORT     = os.getenv("DB_PORT", "1433")
DB_USER     = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "SgoAdmin2024!")
FLAG_DIR    = "/data/migration"

def to_datetime(val):
    if val is None or val == "":
        return None
    dt = None
    try:
        if isinstance(val, (int, float)):
            # Si es > 10^11 es probablemente milisegundos (post 1973)
            if val > 100000000000:
                dt = datetime.fromtimestamp(val / 1000.0)
            else:
                dt = datetime.fromtimestamp(val)
        elif isinstance(val, str):
            # Manejar formatos comunes de SQLite/ISO
            try:
                dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            except:
                # Intentar otros formatos si es necesario
                return val
    except Exception as e:
        print(f"  [WARN] Error convirtiendo fecha '{val}': {e}", flush=True)
        return val

    if dt:
        return dt.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    return val

def process_rows(rows, date_indices):
    if not rows: return []
    new_rows = []
    for row in rows:
        r = list(row)
        for i in date_indices:
            if i < len(r):
                r[i] = to_datetime(r[i])
        new_rows.append(tuple(r))
    return new_rows

CONN_TMPL = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={DB_HOST},{DB_PORT};"
    f"UID={DB_USER};PWD={DB_PASSWORD};"
    "TrustServerCertificate=yes;"
)

os.makedirs(FLAG_DIR, exist_ok=True)


def wait_for_sqlserver():
    print("Esperando que SQL Server esté disponible...", flush=True)
    for i in range(150):
        try:
            pyodbc.connect(CONN_TMPL + "DATABASE=master;", timeout=3).close()
            print("SQL Server disponible.", flush=True)
            return
        except Exception:
            print(f"  Intento {i+1}/150...", flush=True)
            time.sleep(2)
    raise RuntimeError("SQL Server no respondió en 300 segundos.")


def wait_for_tables(db_name: str, table: str):
    """Espera hasta que Flyway haya creado las tablas en la DB destino."""
    conn_str = CONN_TMPL + f"DATABASE={db_name};"
    print(f"  Esperando tabla '{table}' en {db_name}...", flush=True)
    for i in range(150):
        try:
            with pyodbc.connect(conn_str, timeout=3) as c:
                rows = c.execute(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
                    "WHERE TABLE_NAME = ?", table
                ).fetchone()
                if rows and rows[0] > 0:
                    print(f"  Tabla '{table}' lista.", flush=True)
                    return
        except Exception:
            pass
        time.sleep(2)
    raise RuntimeError(f"La tabla '{table}' en {db_name} no apareció en 300 segundos.")


def is_migrated(service: str) -> bool:
    return os.path.exists(os.path.join(FLAG_DIR, f".migrated_{service}"))


def mark_migrated(service: str):
    open(os.path.join(FLAG_DIR, f".migrated_{service}"), "w").close()
    print(f"  [{service}] Marcado como migrado.", flush=True)


def bulk_insert(cursor, table: str, rows: list, placeholders: str):
    if not rows:
        return
    cursor.executemany(f"SET IDENTITY_INSERT {table} ON", [[]])
    cursor.executemany(
        f"SET IDENTITY_INSERT {table} ON; "
        f"INSERT INTO {table} VALUES ({placeholders}); "
        f"SET IDENTITY_INSERT {table} OFF",
        rows
    )


def migrate_clientes():
    service = "clientes"
    db_path = "/data/clientes/clientes.db"
    if is_migrated(service):
        print(f"[{service}] Ya migrado, salteando.", flush=True)
        return
    if not os.path.exists(db_path):
        print(f"[{service}] No hay SQLite en {db_path}, salteando.", flush=True)
        return
    wait_for_tables("sgo_clientes", "clientes")
    print(f"[{service}] Migrando datos...", flush=True)
    src = sqlite3.connect(db_path)
    rows = src.execute(
        "SELECT id, nombre, id_empresa, contacto, cuit, telefono, email, "
        "direccion, condicion_iva, activo, creado_en, ultima_actualizacion, tipo_actualizacion "
        "FROM clientes"
    ).fetchall()
    src.close()
    rows = process_rows(rows, [10, 11])
    print(f"  {len(rows)} filas encontradas.", flush=True)
    if rows:
        conn = pyodbc.connect(CONN_TMPL + "DATABASE=sgo_clientes;")
        conn.autocommit = False
        cur = conn.cursor()
        cur.execute("SET IDENTITY_INSERT clientes ON")
        cur.executemany(
            "INSERT INTO clientes (id,nombre,id_empresa,contacto,cuit,telefono,email,"
            "direccion,condicion_iva,activo,creado_en,ultima_actualizacion,tipo_actualizacion) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", rows
        )
        cur.execute("SET IDENTITY_INSERT clientes OFF")
        conn.commit()
        conn.close()
    mark_migrated(service)


def migrate_obras():
    service = "obras"
    db_path = "/data/obras/obras.db"
    if is_migrated(service):
        print(f"[{service}] Ya migrado, salteando.", flush=True)
        return
    if not os.path.exists(db_path):
        print(f"[{service}] No hay SQLite en {db_path}, salteando.", flush=True)
        return
    wait_for_tables("sgo_obras", "obras")
    print(f"[{service}] Migrando datos...", flush=True)
    src = sqlite3.connect(db_path)
    conn = pyodbc.connect(CONN_TMPL + "DATABASE=sgo_obras;")
    conn.autocommit = False
    cur = conn.cursor()

    for tbl, sql, insert_sql, date_cols in [
        ("estado_obra",
         "SELECT id, nombre, activo, ultima_actualizacion, tipo_actualizacion FROM estado_obra",
         "INSERT INTO estado_obra (id, nombre, activo, ultima_actualizacion, tipo_actualizacion) VALUES (?,?,?,?,?)", [3]),
        ("estado_pago",
         "SELECT id, estado, ultima_actualizacion, tipo_actualizacion FROM estado_pago",
         "INSERT INTO estado_pago (id, estado, ultima_actualizacion, tipo_actualizacion) VALUES (?,?,?,?)", [2]),
        ("estado_tarea",
         "SELECT id, nombre, activo, ultima_actualizacion, tipo_actualizacion FROM estado_tarea",
         "INSERT INTO estado_tarea (id, nombre, activo, ultima_actualizacion, tipo_actualizacion) VALUES (?,?,?,?,?)", [3]),
    ]:
        rows = src.execute(sql).fetchall()
        if rows:
            rows = process_rows(rows, date_cols)
            cur.execute(f"SET IDENTITY_INSERT {tbl} ON")
            cur.executemany(insert_sql, rows)
            cur.execute(f"SET IDENTITY_INSERT {tbl} OFF")

    obras_rows = src.execute(
        "SELECT id,id_cliente,estado_obra,nombre,direccion,fecha_presupuesto,fecha_inicio,"
        "fecha_fin,fecha_adjudicada,fecha_perdida,presupuesto,beneficio_global,tiene_comision,"
        "beneficio,comision,activo,creado_en,notas,memoria_descriptiva,condiciones_presupuesto,"
        "observaciones_presupuesto,requiere_factura,ultima_actualizacion,tipo_actualizacion FROM obras"
    ).fetchall()
    if obras_rows:
        obras_rows = process_rows(obras_rows, [5, 6, 7, 8, 9, 16, 22])
        cur.execute("SET IDENTITY_INSERT obras ON")
        cur.executemany(
            "INSERT INTO obras (id,id_cliente,estado_obra,nombre,direccion,fecha_presupuesto,fecha_inicio,"
            "fecha_fin,fecha_adjudicada,fecha_perdida,presupuesto,beneficio_global,tiene_comision,"
            "beneficio,comision,activo,creado_en,notas,memoria_descriptiva,condiciones_presupuesto,"
            "observaciones_presupuesto,requiere_factura,ultima_actualizacion,tipo_actualizacion) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", obras_rows
        )
        cur.execute("SET IDENTITY_INSERT obras OFF")

    for tbl, sql, insert_sql, date_cols in [
        ("tareas",
         "SELECT id,id_obra,id_proveedor,numero_orden,estado_tarea,nombre,descripcion,"
         "porcentaje,fecha_inicio,fecha_fin,creado_en,activo,baja_obra,"
         "ultima_actualizacion,tipo_actualizacion FROM tareas",
         "INSERT INTO tareas (id,id_obra,id_proveedor,numero_orden,estado_tarea,nombre,descripcion,"
         "porcentaje,fecha_inicio,fecha_fin,creado_en,activo,baja_obra,"
         "ultima_actualizacion,tipo_actualizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [8, 9, 10, 13]),
        ("obra_costo",
         "SELECT id,id_proveedor,precio_unitario,id_estado_pago,id_obra,tipo_costo,"
         "item_numero,descripcion,unidad,cantidad,beneficio,subtotal,total,activo,baja_obra,"
         "ultima_actualizacion,tipo_actualizacion FROM obra_costo",
         "INSERT INTO obra_costo (id,id_proveedor,precio_unitario,id_estado_pago,id_obra,tipo_costo,"
         "item_numero,descripcion,unidad,cantidad,beneficio,subtotal,total,activo,baja_obra,"
         "ultima_actualizacion,tipo_actualizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [15]),
    ]:
        rows = src.execute(sql).fetchall()
        if rows:
            rows = process_rows(rows, date_cols)
            cur.execute(f"SET IDENTITY_INSERT {tbl} ON")
            cur.executemany(insert_sql, rows)
            cur.execute(f"SET IDENTITY_INSERT {tbl} OFF")

    op_rows = src.execute("SELECT id_obra, id_proveedor FROM obra_proveedor").fetchall()
    if op_rows:
        cur.executemany("INSERT INTO obra_proveedor VALUES (?,?)", op_rows)

    src.close()
    conn.commit()
    conn.close()
    mark_migrated(service)


def migrate_proveedores():
    service = "proveedores"
    db_path = "/data/proveedores/proveedores.db"
    if is_migrated(service):
        print(f"[{service}] Ya migrado, salteando.", flush=True)
        return
    if not os.path.exists(db_path):
        print(f"[{service}] No hay SQLite en {db_path}, salteando.", flush=True)
        return
    wait_for_tables("sgo_proveedores", "proveedores")
    print(f"[{service}] Migrando datos...", flush=True)
    src = sqlite3.connect(db_path)
    conn = pyodbc.connect(CONN_TMPL + "DATABASE=sgo_proveedores;")
    conn.autocommit = False
    cur = conn.cursor()

    for tbl, sql, insert_sql, date_cols in [
        ("tipo_proveedor",
         "SELECT id, nombre, activo, ultima_actualizacion, tipo_actualizacion FROM tipo_proveedor",
         "INSERT INTO tipo_proveedor (id, nombre, activo, ultima_actualizacion, tipo_actualizacion) VALUES (?,?,?,?,?)", [3]),
        ("gremios",
         "SELECT id, nombre, activo, ultima_actualizacion, tipo_actualizacion FROM gremios",
         "INSERT INTO gremios (id, nombre, activo, ultima_actualizacion, tipo_actualizacion) VALUES (?,?,?,?,?)", [3]),
    ]:
        rows = src.execute(sql).fetchall()
        if rows:
            rows = process_rows(rows, date_cols)
            cur.execute(f"SET IDENTITY_INSERT {tbl} ON")
            cur.executemany(insert_sql, rows)
            cur.execute(f"SET IDENTITY_INSERT {tbl} OFF")

    prov_rows = src.execute(
        "SELECT id,nombre,tipo_proveedor_id,gremio_id,dni_cuit,contacto,telefono,email,"
        "direccion,activo,creado_en,ultima_actualizacion,tipo_actualizacion FROM proveedores"
    ).fetchall()
    if prov_rows:
        prov_rows = process_rows(prov_rows, [10, 11])
        cur.execute("SET IDENTITY_INSERT proveedores ON")
        cur.executemany(
            "INSERT INTO proveedores (id,nombre,tipo_proveedor_id,gremio_id,dni_cuit,contacto,telefono,email,"
            "direccion,activo,creado_en,ultima_actualizacion,tipo_actualizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            prov_rows
        )
        cur.execute("SET IDENTITY_INSERT proveedores OFF")

    mov_rows = src.execute(
        "SELECT id, proveedor_id, obra_id, descripcion, monto, monto_pagado, pagado, creado_en "
        "FROM movimientos"
    ).fetchall()
    if mov_rows:
        mov_rows = process_rows(mov_rows, [7])
        cur.execute("SET IDENTITY_INSERT movimientos ON")
        cur.executemany(
            "INSERT INTO movimientos (id, proveedor_id, obra_id, descripcion, monto, monto_pagado, pagado, creado_en) "
            "VALUES (?,?,?,?,?,?,?,?)", mov_rows
        )
        cur.execute("SET IDENTITY_INSERT movimientos OFF")

    src.close()
    conn.commit()
    conn.close()
    mark_migrated(service)


def migrate_reportes():
    service = "reportes"
    db_path = "/data/reportes/reportes.db"
    if is_migrated(service):
        print(f"[{service}] Ya migrado, salteando.", flush=True)
        return
    if not os.path.exists(db_path):
        print(f"[{service}] No hay SQLite en {db_path}, salteando.", flush=True)
        return
    wait_for_tables("sgo_reportes", "comisiones")
    print(f"[{service}] Migrando datos...", flush=True)
    src = sqlite3.connect(db_path)
    conn = pyodbc.connect(CONN_TMPL + "DATABASE=sgo_reportes;")
    conn.autocommit = False
    cur = conn.cursor()

    for tbl, sql, insert_sql, date_cols in [
        ("comisiones",
         "SELECT id, id_obra, monto, fecha, pagado FROM comisiones",
         "INSERT INTO comisiones (id, id_obra, monto, fecha, pagado) VALUES (?,?,?,?,?)", [3]),
        ("movimientos_reporte",
         "SELECT id, referencia, monto, fecha, tipo FROM movimientos_reporte",
         "INSERT INTO movimientos_reporte (id, referencia, monto, fecha, tipo) VALUES (?,?,?,?,?)", [3]),
    ]:
        rows = src.execute(sql).fetchall()
        if rows:
            rows = process_rows(rows, date_cols)
            cur.execute(f"SET IDENTITY_INSERT {tbl} ON")
            cur.executemany(insert_sql, rows)
            cur.execute(f"SET IDENTITY_INSERT {tbl} OFF")

    src.close()
    conn.commit()
    conn.close()
    mark_migrated(service)


def migrate_transacciones():
    service = "transacciones"
    db_path = "/data/transacciones/transacciones.db"
    if is_migrated(service):
        print(f"[{service}] Ya migrado, salteando.", flush=True)
        return
    if not os.path.exists(db_path):
        print(f"[{service}] No hay SQLite en {db_path}, salteando.", flush=True)
        return
    wait_for_tables("sgo_transacciones", "transacciones")
    print(f"[{service}] Migrando datos...", flush=True)
    src = sqlite3.connect(db_path)
    conn = pyodbc.connect(CONN_TMPL + "DATABASE=sgo_transacciones;")
    conn.autocommit = False
    cur = conn.cursor()

    tt_rows = src.execute(
        "SELECT id, nombre, activo, ultima_actualizacion, tipo_actualizacion FROM tipo_transaccion"
    ).fetchall()
    if tt_rows:
        tt_rows = process_rows(tt_rows, [3])
        cur.execute("SET IDENTITY_INSERT tipo_transaccion ON")
        cur.executemany(
            "INSERT INTO tipo_transaccion (id, nombre, activo, ultima_actualizacion, tipo_actualizacion) VALUES (?,?,?,?,?)",
            tt_rows
        )
        cur.execute("SET IDENTITY_INSERT tipo_transaccion OFF")

    tx_rows = src.execute(
        "SELECT id,id_obra,tipo_asociado,id_asociado,id_tipo_transaccion,fecha,monto,"
        "forma_pago,medio_pago,concepto,factura_cobrada,activo,baja_obra,"
        "ultima_actualizacion,tipo_actualizacion FROM transacciones"
    ).fetchall()
    if tx_rows:
        tx_rows = process_rows(tx_rows, [5, 13])
        cur.execute("SET IDENTITY_INSERT transacciones ON")
        cur.executemany(
            "INSERT INTO transacciones (id,id_obra,tipo_asociado,id_asociado,id_tipo_transaccion,fecha,monto,"
            "forma_pago,medio_pago,concepto,factura_cobrada,activo,baja_obra,"
            "ultima_actualizacion,tipo_actualizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", tx_rows
        )
        cur.execute("SET IDENTITY_INSERT transacciones OFF")

    fac_rows = src.execute(
        "SELECT id,id_cliente,id_obra,monto,monto_restante,fecha,descripcion,estado,"
        "nombre_archivo,path_archivo,activo,impacta_cta_cte,id_transaccion,"
        "ultima_actualizacion,tipo_actualizacion FROM facturas"
    ).fetchall()
    if fac_rows:
        fac_rows = process_rows(fac_rows, [5, 13])
        cur.execute("SET IDENTITY_INSERT facturas ON")
        cur.executemany(
            "INSERT INTO facturas (id,id_cliente,id_obra,monto,monto_restante,fecha,descripcion,estado,"
            "nombre_archivo,path_archivo,activo,impacta_cta_cte,id_transaccion,"
            "ultima_actualizacion,tipo_actualizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", fac_rows
        )
        cur.execute("SET IDENTITY_INSERT facturas OFF")

    src.close()
    conn.commit()
    conn.close()
    mark_migrated(service)


def migrate_documentos():
    service = "documentos"
    db_path = "/data/documentos/documentos.db"
    if is_migrated(service):
        print(f"[{service}] Ya migrado, salteando.", flush=True)
        return
    if not os.path.exists(db_path):
        print(f"[{service}] No hay SQLite en {db_path}, salteando.", flush=True)
        return
    wait_for_tables("sgo_documentos", "documentos")
    print(f"[{service}] Migrando datos...", flush=True)
    src = sqlite3.connect(db_path)
    conn = pyodbc.connect(CONN_TMPL + "DATABASE=sgo_documentos;")
    conn.autocommit = False
    cur = conn.cursor()

    td_rows = src.execute("SELECT id, nombre FROM tipos_documento").fetchall()
    if td_rows:
        cur.execute("SET IDENTITY_INSERT tipos_documento ON")
        cur.executemany("INSERT INTO tipos_documento (id, nombre) VALUES (?,?)", td_rows)
        cur.execute("SET IDENTITY_INSERT tipos_documento OFF")

    doc_rows = src.execute(
        "SELECT id_documento,id_obra,id_asociado,tipo_asociado,nombre_archivo,path_archivo,"
        "fecha,observacion,creado_en,id_tipo_documento FROM documentos"
    ).fetchall()
    if doc_rows:
        doc_rows = process_rows(doc_rows, [6, 8])
        cur.execute("SET IDENTITY_INSERT documentos ON")
        cur.executemany(
            "INSERT INTO documentos (id_documento,id_obra,id_asociado,tipo_asociado,nombre_archivo,path_archivo,"
            "fecha,observacion,creado_en,id_tipo_documento) VALUES (?,?,?,?,?,?,?,?,?,?)", doc_rows
        )
        cur.execute("SET IDENTITY_INSERT documentos OFF")

    src.close()
    conn.commit()
    conn.close()
    mark_migrated(service)


if __name__ == "__main__":
    print("=== Migrador SGO: SQLite → SQL Server ===", flush=True)
    wait_for_sqlserver()

    migrate_clientes()
    migrate_obras()
    migrate_proveedores()
    migrate_reportes()
    migrate_transacciones()
    migrate_documentos()

    print("=== Migración completada. ===", flush=True)
