import os
import re
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DB_DIR = BASE_DIR / 'db'
OUTPUT = DB_DIR / 'migrate_to_sqlserver.sql'
TARGET_DB = 'sgo_dev'

TYPE_MAP = [
    ('INT', 'BIGINT'),
    ('INTEGER', 'BIGINT'),
    ('BIGINT', 'BIGINT'),
    ('SMALLINT', 'SMALLINT'),
    ('TINYINT', 'TINYINT'),
    ('REAL', 'FLOAT'),
    ('DOUBLE', 'FLOAT'),
    ('FLOAT', 'FLOAT'),
    ('NUMERIC', 'DECIMAL(18,2)'),
    ('DECIMAL', 'DECIMAL(18,2)'),
    ('BOOLEAN', 'BIT'),
    ('DATE', 'DATETIME'),
    ('DATETIME', 'DATETIME'),
    ('TIMESTAMP', 'DATETIME'),
    ('CHAR', 'NVARCHAR(MAX)'),
    ('CLOB', 'NVARCHAR(MAX)'),
    ('TEXT', 'NVARCHAR(MAX)'),
    ('VARCHAR', 'NVARCHAR(MAX)'),
    ('NVARCHAR', 'NVARCHAR(MAX)'),
    ('BLOB', 'VARBINARY(MAX)'),
]


def q(name: str) -> str:
    return '[' + name.replace(']', ']]') + ']'


def map_type(declared: str, is_pk: bool, is_identity: bool, is_indexed: bool) -> str:
    if not declared:
        return 'NVARCHAR(MAX)'
    t = declared.strip().upper()
    # Extract first token (SQLite allows type affinity like "INTEGER NOT NULL")
    token = re.split(r'\s+|\(', t, maxsplit=1)[0]
    mapped = None
    for src, dst in TYPE_MAP:
        if token == src:
            mapped = dst
            break
    if mapped is None:
        # SQLite affinity rules: anything with INT => integer
        if 'INT' in token:
            mapped = 'BIGINT'
        elif any(x in token for x in ['CHAR', 'CLOB', 'TEXT']):
            mapped = 'NVARCHAR(MAX)'
        elif 'BLOB' in token:
            mapped = 'VARBINARY(MAX)'
        elif any(x in token for x in ['REAL', 'FLOA', 'DOUB']):
            mapped = 'FLOAT'
        elif any(x in token for x in ['DEC', 'NUM']):
            mapped = 'DECIMAL(18,2)'
        else:
            mapped = 'NVARCHAR(MAX)'
    if is_identity:
        return 'BIGINT IDENTITY(1,1)'
    if mapped == 'NVARCHAR(MAX)' and is_indexed:
        return 'NVARCHAR(450)'
    return mapped


def is_integer_type(declared: str) -> bool:
    if not declared:
        return False
    token = re.split(r'\s+|\(', declared.strip().upper(), maxsplit=1)[0]
    return 'INT' in token


def format_datetime_value(value, target_type: str):
    # Handle unix epoch in seconds or milliseconds using DATEADD-compatible chunks.
    if isinstance(value, (int, float)):
        v = int(value)
        if abs(v) >= 10**12:
            expr = (
                "DATEADD(millisecond, CAST(({} % 1000) AS int), "
                "DATEADD(second, CAST(({} / 1000) AS int), CAST('1970-01-01' AS datetime)))"
            ).format(v, v)
        else:
            expr = "DATEADD(second, CAST({} AS int), CAST('1970-01-01' AS datetime))".format(v)
        if target_type == 'DATE':
            return "CAST({} AS DATE)".format(expr)
        return expr
    return None


def format_value(value, target_type: str):
    if value is None:
        return 'NULL'
    if isinstance(value, bytes):
        return '0x' + value.hex()
    if target_type in ('DATE', 'DATETIME'):
        expr = format_datetime_value(value, target_type)
        if expr is not None:
            return expr
    if isinstance(value, (int, float)):
        return str(value)
    # treat as string
    s = str(value)
    s = s.replace("'", "''")
    return "N'{}'".format(s)


def get_tables(conn):
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    return [r[0] for r in cur.fetchall()]


def get_table_sql(conn, table):
    cur = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (table,))
    row = cur.fetchone()
    return row[0] if row else ''


def main():
    db_files = sorted(DB_DIR.glob('*.db'))
    if not db_files:
        raise SystemExit('No .db files found in db/')

    lines = []
    lines.append('IF DB_ID(\'{}\') IS NULL CREATE DATABASE {};'.format(TARGET_DB, q(TARGET_DB)))
    lines.append('GO')
    lines.append('USE {};'.format(q(TARGET_DB)))
    lines.append('GO')
    lines.append('SET NOCOUNT ON;')
    lines.append('SET XACT_ABORT ON;')
    lines.append('GO')

    fk_statements = []
    index_statements = []
    unique_statements = []

    for db_path in db_files:
        schema = db_path.stem
        lines.append('IF SCHEMA_ID(\'{}\') IS NULL EXEC(\'CREATE SCHEMA {}\');'.format(schema, q(schema)))
        lines.append('GO')

        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row

        tables = get_tables(conn)
        for table in tables:
            table_sql = get_table_sql(conn, table) or ''
            has_autoinc = 'AUTOINCREMENT' in table_sql.upper()

            columns = conn.execute(f"PRAGMA table_info('{table}')").fetchall()
            pk_cols = [c for c in columns if c['pk'] > 0]
            pk_cols_sorted = sorted(pk_cols, key=lambda c: c['pk'])

            single_pk = len(pk_cols_sorted) == 1
            identity_col = None
            if single_pk and is_integer_type(pk_cols_sorted[0]['type'] or ''):
                identity_col = pk_cols_sorted[0]['name']

            # Build indexed column set (non-partial indexes + PK)
            indexed_cols = set(c['name'] for c in pk_cols_sorted)
            idx_list = conn.execute(f"PRAGMA index_list('{table}')").fetchall()
            for idx in idx_list:
                if idx['partial'] == 1:
                    continue
                idx_name = idx['name']
                idx_cols = conn.execute(f"PRAGMA index_info('{idx_name}')").fetchall()
                for c in idx_cols:
                    indexed_cols.add(c['name'])

            col_defs = []
            col_types = {}
            for col in columns:
                col_name = col['name']
                declared = col['type'] or ''
                is_identity = identity_col == col_name
                col_type = map_type(declared, col['pk'] > 0, is_identity, col_name in indexed_cols)
                if col_type.startswith('DATETIME') or col_type.startswith('DATE'):
                    col_types[col_name] = 'DATETIME'
                else:
                    col_types[col_name] = col_type
                col_def = '{} {}'.format(q(col_name), col_type)
                if col['notnull']:
                    col_def += ' NOT NULL'
                if col['dflt_value'] is not None:
                    col_def += ' DEFAULT {}'.format(col['dflt_value'])
                col_defs.append(col_def)

            if len(pk_cols_sorted) > 1:
                pk_cols_sql = ', '.join(q(c['name']) for c in pk_cols_sorted)
                col_defs.append('CONSTRAINT {} PRIMARY KEY ({})'.format(
                    q('PK_{}_{}'.format(schema, table)), pk_cols_sql
                ))
            elif len(pk_cols_sorted) == 1:
                pk_cols_sql = q(pk_cols_sorted[0]['name'])
                col_defs.append('CONSTRAINT {} PRIMARY KEY ({})'.format(
                    q('PK_{}_{}'.format(schema, table)), pk_cols_sql
                ))

            lines.append('CREATE TABLE {}.{} ('.format(q(schema), q(table)))
            lines.append('  ' + ',\n  '.join(col_defs))
            lines.append(');')
            lines.append('GO')

            # Unique and non-unique indexes
            idx_list = conn.execute(f"PRAGMA index_list('{table}')").fetchall()
            for idx in idx_list:
                idx_name = idx['name']
                is_unique = idx['unique'] == 1
                origin = idx['origin']
                is_partial = idx['partial'] == 1
                if origin == 'pk' or is_partial:
                    continue
                idx_cols = conn.execute(f"PRAGMA index_info('{idx_name}')").fetchall()
                cols_sql = ', '.join(q(c['name']) for c in idx_cols)
                if not cols_sql:
                    continue
                if is_unique:
                    unique_statements.append(
                        'CREATE UNIQUE INDEX {} ON {}.{} ({});'.format(
                            q('UQ_{}_{}_{}'.format(schema, table, idx_name)), q(schema), q(table), cols_sql
                        )
                    )
                else:
                    index_statements.append(
                        'CREATE INDEX {} ON {}.{} ({});'.format(
                            q('IX_{}_{}_{}'.format(schema, table, idx_name)), q(schema), q(table), cols_sql
                        )
                    )

            # Foreign keys
            fk_list = conn.execute(f"PRAGMA foreign_key_list('{table}')").fetchall()
            if fk_list:
                # Group by id
                fks = {}
                for fk in fk_list:
                    fks.setdefault(fk['id'], []).append(fk)
                for fk_id, parts in fks.items():
                    parts_sorted = sorted(parts, key=lambda r: r['seq'])
                    from_cols = ', '.join(q(p['from']) for p in parts_sorted)
                    to_cols = ', '.join(q(p['to']) for p in parts_sorted)
                    ref_table = parts_sorted[0]['table']
                    on_update = parts_sorted[0]['on_update']
                    on_delete = parts_sorted[0]['on_delete']
                    fk_name = q('FK_{}_{}_{}_{}'.format(schema, table, ref_table, fk_id))
                    stmt = 'ALTER TABLE {}.{} ADD CONSTRAINT {} FOREIGN KEY ({}) REFERENCES {}.{} ({})'.format(
                        q(schema), q(table), fk_name, from_cols, q(schema), q(ref_table), to_cols
                    )
                    if on_delete and on_delete != 'NO ACTION':
                        stmt += ' ON DELETE {}'.format(on_delete)
                    if on_update and on_update != 'NO ACTION':
                        stmt += ' ON UPDATE {}'.format(on_update)
                    stmt += ';'
                    fk_statements.append(stmt)

            # Data
            rows = conn.execute(f"SELECT * FROM '{table}'").fetchall()
            if rows:
                col_names = [c['name'] for c in columns]
                col_list_sql = ', '.join(q(c) for c in col_names)
                if identity_col:
                    lines.append('SET IDENTITY_INSERT {}.{} ON;'.format(q(schema), q(table)))
                for row in rows:
                    values = [format_value(row[c], col_types[c]) for c in col_names]
                    lines.append('INSERT INTO {}.{} ({}) VALUES ({});'.format(
                        q(schema), q(table), col_list_sql, ', '.join(values)
                    ))
                if identity_col:
                    lines.append('SET IDENTITY_INSERT {}.{} OFF;'.format(q(schema), q(table)))
                lines.append('GO')

        conn.close()

    # Add indexes and constraints after data load
    if unique_statements:
        lines.append('-- Unique indexes')
        lines.extend(unique_statements)
        lines.append('GO')

    if index_statements:
        lines.append('-- Non-unique indexes')
        lines.extend(index_statements)
        lines.append('GO')

    if fk_statements:
        lines.append('-- Foreign keys')
        lines.extend(fk_statements)
        lines.append('GO')

    OUTPUT.write_text('\n'.join(lines), encoding='utf-8')
    print('Wrote', OUTPUT)


if __name__ == '__main__':
    main()
