FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl gnupg2 apt-transport-https sqlite3 \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list \
        > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 unixodbc-dev \
    && pip install --no-cache-dir pyodbc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY migrate.py /migrate.py

CMD ["python", "-u", "/migrate.py"]
