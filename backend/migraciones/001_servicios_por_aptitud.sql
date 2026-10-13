-- Precio, descripción y años de experiencia POR SERVICIO (no por usuario).
-- El backend lo corre solo la primera vez que lo necesita (ver backend/esquema.js).
-- Si el usuario de la base no tiene permiso para ALTER TABLE, correlo a mano una vez.
-- Es seguro correrlo varias veces: no borra ni cambia datos existentes.

ALTER TABLE usuarios_aptitudes
    ADD COLUMN IF NOT EXISTS cobro_por_hora numeric,
    ADD COLUMN IF NOT EXISTS descripcion text,
    ADD COLUMN IF NOT EXISTS anios_experiencia integer;

-- Los servicios que ya existían no tienen estos datos (quedan en NULL).
-- Mientras tanto el backend muestra el precio y el "sobre mí" del usuario.
