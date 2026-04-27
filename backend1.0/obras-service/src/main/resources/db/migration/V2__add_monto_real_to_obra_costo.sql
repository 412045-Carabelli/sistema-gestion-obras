-- V2__add_monto_real_to_obra_costo.sql
-- Agrega columna para registrar el costo real de cada item vs lo cotizado

ALTER TABLE obra_costo
    ADD monto_real DECIMAL(14,2) NULL;
