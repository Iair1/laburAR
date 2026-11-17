-- Reseñas y mensajes. El backend lo corre solo la primera vez que lo necesita
-- (ver asegurarResenasYMensajes en backend/esquema.js). Si el usuario de la base no
-- tiene permiso para CREATE/ALTER TABLE, correlo a mano una vez.
-- Es seguro correrlo varias veces: no borra ni cambia datos existentes.

CREATE TABLE IF NOT EXISTS resena_al_trabajador ("reseña" text, puntuacion integer, contratadorid integer, trabajadorid integer, trabajo integer);
CREATE TABLE IF NOT EXISTS resena_al_contratador ("reseña" text, puntuacion integer, trabajadorid integer, contratadorid integer, trabajo integer);
ALTER TABLE resena_al_trabajador ADD COLUMN IF NOT EXISTS id serial, ADD COLUMN IF NOT EXISTS fecha timestamptz DEFAULT now();
ALTER TABLE resena_al_contratador ADD COLUMN IF NOT EXISTS id serial, ADD COLUMN IF NOT EXISTS fecha timestamptz DEFAULT now();

-- Mensajes: fecha de envío, si ya se leyó y una foto opcional
ALTER TABLE mensajes
    ADD COLUMN IF NOT EXISTS fecha timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS leido boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS imagen text;

-- Una sola reseña por trabajo en cada dirección (si ya hay repetidas, este paso falla: no es grave)
CREATE UNIQUE INDEX IF NOT EXISTS resena_al_trabajador_trabajo_unico ON resena_al_trabajador (trabajo);
CREATE UNIQUE INDEX IF NOT EXISTS resena_al_contratador_trabajo_unico ON resena_al_contratador (trabajo);
CREATE INDEX IF NOT EXISTS mensajes_emisor_receptor ON mensajes (emisorid, receptorid);
