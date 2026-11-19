-- Cuentas y moderación. El backend lo corre solo la primera vez que lo necesita
-- (ver asegurarCuentas en backend/esquema.js). Si el usuario de la base no
-- tiene permiso para CREATE/ALTER TABLE, correlo a mano una vez.
-- Es seguro correrlo varias veces: no borra ni cambia datos existentes.

-- Datos de la cuenta
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS email text,                    -- para entrar y recuperar la contraseña
    ADD COLUMN IF NOT EXISTS telefono text,                 -- privado, no se muestra a nadie
    ADD COLUMN IF NOT EXISTS es_admin boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS suspendido boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS motivo_suspension text,
    ADD COLUMN IF NOT EXISTS eliminado boolean DEFAULT false, -- la persona borró su cuenta (se borran sus datos)
    ADD COLUMN IF NOT EXISTS dni_foto text,                 -- id PRIVADO de la foto en Cloudinary (no es un link público)
    ADD COLUMN IF NOT EXISTS dni_estado text,               -- 'pendiente' | 'verificado' | 'rechazado'
    ADD COLUMN IF NOT EXISTS verificado boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS fecha_alta timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS denuncias (
    id serial PRIMARY KEY,
    denuncianteid integer NOT NULL,
    denunciadoid integer NOT NULL,
    motivo text NOT NULL,
    detalle text,
    solicitudid integer,
    mensajeid integer,
    estado text NOT NULL DEFAULT 'pendiente',   -- 'pendiente' | 'resuelta' | 'descartada'
    nota_admin text,
    fecha timestamptz DEFAULT now(),
    fecha_resuelta timestamptz
);

CREATE TABLE IF NOT EXISTS bloqueos (
    id serial PRIMARY KEY,
    bloqueadorid integer NOT NULL,
    bloqueadoid integer NOT NULL,
    fecha timestamptz DEFAULT now(),
    UNIQUE (bloqueadorid, bloqueadoid)
);

CREATE TABLE IF NOT EXISTS intentos_login (
    id serial PRIMARY KEY,
    clave text NOT NULL,
    fecha timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recuperaciones (
    id serial PRIMARY KEY,
    userid integer NOT NULL,
    codigo text NOT NULL,        -- hasheado con bcrypt
    vence timestamptz NOT NULL,
    intentos integer NOT NULL DEFAULT 0,
    usado boolean NOT NULL DEFAULT false,
    fecha timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unico ON usuarios (lower(email)) WHERE email IS NOT NULL AND eliminado IS NOT TRUE;
CREATE INDEX IF NOT EXISTS denuncias_estado ON denuncias (estado, fecha DESC);
CREATE INDEX IF NOT EXISTS intentos_login_clave ON intentos_login (clave, fecha);

-- Para que alguien sea administrador (puede ver el panel /admin):
--   UPDATE usuarios SET es_admin = true WHERE email = 'tu-email@ejemplo.com';
