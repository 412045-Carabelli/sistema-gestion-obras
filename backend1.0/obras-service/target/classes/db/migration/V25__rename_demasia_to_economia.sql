-- V25__rename_demasia_to_economia.sql
-- Renombra tipo_costo DEMASIA a ECONOMIA.
-- El concepto era inverso: DEMASIA implicaba sobrecosto (reduccion de presupuesto),
-- mientras que ECONOMIA refleja el ahorro o reduccion correctamente.

UPDATE obra_costo
SET tipo_costo = 'ECONOMIA'
WHERE tipo_costo = 'DEMASIA';
