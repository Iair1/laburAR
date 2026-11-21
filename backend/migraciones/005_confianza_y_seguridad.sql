-- Confianza y seguridad: confirmar el email y el teléfono, avisos por email, límites
-- contra el spam, cancelaciones con motivo y registro de errores.
-- El backend lo hace solo la primera vez que lo necesita (asegurarCuentas en backend/esquema.js).
-- Si el usuario de la base no tiene permiso para CREATE/ALTER TABLE, correlo a mano una vez.
-- Se puede correr varias veces sin problema.

-- email_verificado: null = cuenta de antes (no se le exige), false = falta confirmar, true = confirmado
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS email_verificado boolean,
    ADD COLUMN IF NOT EXISTS avisos_email boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS telefono_verificado boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS acciones_limitadas (
    id serial PRIMARY KEY,
    clave text NOT NULL,
    fecha timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verificaciones_email (
    id serial PRIMARY KEY,
    userid integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,          -- sha256 del token del link
    vence timestamptz NOT NULL,
    usado boolean NOT NULL DEFAULT false,
    fecha timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verificaciones_telefono (
    id serial PRIMARY KEY,
    userid integer NOT NULL,
    telefono text NOT NULL,
    codigo text NOT NULL,         -- hash del código de 6 números
    vence timestamptz NOT NULL,
    intentos integer NOT NULL DEFAULT 0,
    usado boolean NOT NULL DEFAULT false,
    fecha timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cancelaciones (
    id serial PRIMARY KEY,
    solicitudid integer,
    userid integer NOT NULL,
    rol text,                     -- cliente | trabajador
    motivo text,
    aviso_corto boolean DEFAULT false,  -- canceló con menos de 24 horas
    fecha timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS errores_servidor (
    id serial PRIMARY KEY,
    origen text NOT NULL DEFAULT 'servidor',  -- servidor | navegador
    ruta text,
    metodo text,
    mensaje text,
    detalle text,
    userid integer,
    avisado boolean DEFAULT false,
    fecha timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS acciones_limitadas_clave ON acciones_limitadas (clave, fecha);
CREATE INDEX IF NOT EXISTS verificaciones_email_token ON verificaciones_email (token);
CREATE INDEX IF NOT EXISTS cancelaciones_usuario ON cancelaciones (userid);
CREATE INDEX IF NOT EXISTS errores_servidor_fecha ON errores_servidor (fecha DESC);
