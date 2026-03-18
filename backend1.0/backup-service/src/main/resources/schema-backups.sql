IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'backups')
BEGIN
    EXEC('CREATE SCHEMA backups');
END
