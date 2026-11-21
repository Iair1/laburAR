-- Notificaciones con título y enlace, y propuestas de precio para los problemas.
-- El backend lo hace solo la primera vez que lo necesita (asegurarNotificaciones y
-- asegurarOfertas en backend/esquema.js). Si el usuario de la base no tiene permiso
-- para CREATE/ALTER TABLE, correlo a mano una vez. Se puede correr varias veces.

-- Notificaciones: si ya se leyó (antes se guardaba en el navegador), cuándo llegó,
-- un título corto, a dónde lleva al tocarla y de qué trabajo es.
-- (Correr el UPDATE solo la primera vez: deja como leídas las que ya existían.)
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS leida boolean;
UPDATE notificaciones SET leida = true WHERE leida IS NULL;
ALTER TABLE notificaciones
    ADD COLUMN IF NOT EXISTS fecha timestamptz,
    ADD COLUMN IF NOT EXISTS titulo text,
    ADD COLUMN IF NOT EXISTS enlace text,
    ADD COLUMN IF NOT EXISTS solicitudid integer;
ALTER TABLE notificaciones
    ALTER COLUMN leida SET DEFAULT false,
    ALTER COLUMN fecha SET DEFAULT now();
CREATE INDEX IF NOT EXISTS notificaciones_usuario ON notificaciones (userid, id DESC);

-- Propuestas: el trabajador ofrece día, hora y precio para un problema; el cliente acepta,
-- contraoferta o rechaza (y así hasta que alguien acepta o rechaza).
CREATE TABLE IF NOT EXISTS ofertas (
    id serial PRIMARY KEY,
    solicitudid integer NOT NULL,
    trabajadorid integer NOT NULL,
    contratadorid integer NOT NULL,
    dia date NOT NULL,
    hora text,
    precio integer NOT NULL,
    mensaje text,
    titulo text,
    estado text NOT NULL DEFAULT 'pendiente',   -- pendiente | aceptada | rechazada | retirada | cerrada
    turno text NOT NULL DEFAULT 'cliente',      -- quién tiene que responder: cliente | trabajador
    rechazada_por text,
    fecha timestamptz DEFAULT now(),
    actualizada timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ofertas_historial (
    id serial PRIMARY KEY,
    ofertaid integer NOT NULL,
    autorid integer NOT NULL,
    rol text NOT NULL,          -- trabajador | cliente | sistema
    accion text NOT NULL,       -- propuesta | contraoferta | aceptada | rechazada | retirada | cerrada
    precio integer,
    mensaje text,
    fecha timestamptz DEFAULT now()
);
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS precio_acordado integer;

CREATE UNIQUE INDEX IF NOT EXISTS ofertas_una_abierta ON ofertas (solicitudid, trabajadorid) WHERE estado = 'pendiente';
CREATE INDEX IF NOT EXISTS ofertas_solicitud ON ofertas (solicitudid);
CREATE INDEX IF NOT EXISTS ofertas_trabajador ON ofertas (trabajadorid, id DESC);
CREATE INDEX IF NOT EXISTS ofertas_contratador ON ofertas (contratadorid, id DESC);
CREATE INDEX IF NOT EXISTS ofertas_historial_oferta ON ofertas_historial (ofertaid, id);
