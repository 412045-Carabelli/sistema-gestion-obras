#!/bin/bash
set -e

/opt/mssql/bin/sqlservr &
SA_PID=$!

echo "Esperando que SQL Server esté listo..."
for i in $(seq 1 60); do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
        -C -Q "SELECT 1" > /dev/null 2>&1 && break
    echo "  Intento $i/60..."
    sleep 1
done

echo "SQL Server listo. Creando bases de datos..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
    -C -i /init/init-databases.sql

echo "Bases de datos creadas correctamente."
wait $SA_PID
