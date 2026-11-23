-- Cuentas de empresa y anotación del historial de trabajos.
-- El backend lo hace solo la primera vez que lo necesita (asegurarCuentas en backend/esquema.js).
-- Si el usuario de la base no tiene permiso para ALTER TABLE, correlo a mano una vez.
-- Se puede correr varias veces sin problema.

-- true si la cuenta es de una empresa de servicios (no lleva DNI)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_empresa boolean DEFAULT false;

-- Las cuentas de empresa no tienen DNI: la columna no puede ser obligatoria
ALTER TABLE usuarios ALTER COLUMN dni DROP NOT NULL;

-- De qué trabajo es cada fila del historial (con quién trabajó cada uno)
ALTER TABLE historial ADD COLUMN IF NOT EXISTS solicitudid integer;
