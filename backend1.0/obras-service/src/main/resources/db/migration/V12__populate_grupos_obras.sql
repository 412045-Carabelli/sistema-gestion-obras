-- Poblar tabla grupos_obras con grupos para cada cliente existente
-- Crear un grupo por cliente que tenga obras

DECLARE @id_cliente BIGINT;
DECLARE @nombre VARCHAR(255);
DECLARE @grupo_id BIGINT;

DECLARE cliente_cursor CURSOR FOR
    SELECT DISTINCT id_cliente
    FROM obras
    WHERE activo = 1
    ORDER BY id_cliente;

OPEN cliente_cursor;
FETCH NEXT FROM cliente_cursor INTO @id_cliente;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Insertar grupo si no existe
    INSERT INTO grupos_obras (id_cliente, nombre, activo, creado_en, tipo_actualizacion)
    VALUES (@id_cliente, 'Obras - Cliente ' + CAST(@id_cliente AS VARCHAR(10)), 1, GETDATE(), 'CREATE');

    -- Obtener el ID del grupo insertado
    SET @grupo_id = SCOPE_IDENTITY();

    -- Asociar todas las obras de este cliente al grupo
    UPDATE obras
    SET id_grupo = @grupo_id
    WHERE id_cliente = @id_cliente
      AND activo = 1
      AND id_grupo IS NULL;

    FETCH NEXT FROM cliente_cursor INTO @id_cliente;
END;

CLOSE cliente_cursor;
DEALLOCATE cliente_cursor;
