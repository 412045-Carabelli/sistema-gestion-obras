FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install curl, gnupg, cron, tar, gzip
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    cron \
    tar \
    gzip \
    && rm -rf /var/lib/apt/lists/*

# Install sqlcmd (mssql-tools18)
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] \
       https://packages.microsoft.com/ubuntu/22.04/prod jammy main" \
    > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y mssql-tools18 unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/mssql-tools18/bin:${PATH}"

# Install MinIO client (mc)
RUN curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc \
    -o /usr/local/bin/mc \
    && chmod +x /usr/local/bin/mc

# Dirs
RUN mkdir -p /backups /minio-data /var/log

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

COPY crontab /etc/cron.d/sgo-backup
RUN chmod 0644 /etc/cron.d/sgo-backup && crontab /etc/cron.d/sgo-backup

# Touch log file so tail works
RUN touch /var/log/sgo-backup.log

CMD ["bash", "-c", "cron && tail -f /var/log/sgo-backup.log"]
