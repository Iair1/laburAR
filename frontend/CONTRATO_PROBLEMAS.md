# Contrato frontend ↔ backend: problemas y presupuestos

El frontend ya tiene todo el flujo armado:

1. Un **cliente sube un problema**: qué necesita, fotos, zona, entre qué fechas, qué días de la semana y en qué franja horaria pueden ir.
2. Los **trabajadores** ven los problemas publicados y **mandan un presupuesto**: monto, día, hora, duración, materiales y mensaje.
3. El **cliente elige** un presupuesto y queda **agendado**. Los demás presupuestos se rechazan automáticamente.

Mientras el backend no tenga estas rutas, el frontend funciona en **modo local** (guarda todo en el navegador). Cuando estén listas, se activa el modo backend con una sola variable:

```
VITE_PROBLEMAS_BACKEND=true   # en frontend/.env o en las variables de Vercel
```

Todas las llamadas están en `frontend/src/problemasApi.js`. Este documento dice qué espera cada una.

El modelo es el que ya empezaron en el backend:
- Un **problema** es una fila de `solicitudes` con `dirigida = false`.
- Un **presupuesto** es una fila de `aplicaciones`.

---

## 1. Cambios en la base de datos

```sql
-- solicitudes: datos extra del problema
ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS barrio text,
  ADD COLUMN IF NOT EXISTS direccion text,            -- privada: solo la ven el dueño y el trabajador elegido
  ADD COLUMN IF NOT EXISTS franja text,               -- 'manana' | 'tarde' | 'noche' | 'todo'
  ADD COLUMN IF NOT EXISTS urgencia text,             -- 'urgente' | 'semana' | 'flexible'
  ADD COLUMN IF NOT EXISTS presupuesto_estimado numeric,
  ADD COLUMN IF NOT EXISTS fotos text[],              -- URLs de Cloudinary
  ADD COLUMN IF NOT EXISTS hora text,                 -- hora acordada al aceptar ("10:30")
  ADD COLUMN IF NOT EXISTS creado timestamptz DEFAULT now();

-- aplicaciones = presupuestos
ALTER TABLE aplicaciones
  ADD COLUMN IF NOT EXISTS hora text,                 -- "HH:MM"
  ADD COLUMN IF NOT EXISTS monto numeric,
  ADD COLUMN IF NOT EXISTS mensaje text,
  ADD COLUMN IF NOT EXISTS materiales text,           -- 'incluidos' | 'no_incluidos' | 'a_convenir'
  ADD COLUMN IF NOT EXISTS duracion text,             -- "1 a 2 horas", etc.
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'enviado', -- 'enviado' | 'aceptado' | 'rechazado' | 'cancelado'
  ADD COLUMN IF NOT EXISTS creado timestamptz DEFAULT now();
```

**Convenciones** (ya usadas en el resto del backend):
- `periodo` es un array de fechas `[inicio, fin]` en formato `YYYY-MM-DD`.
- `diassemana` son 7 booleanos de **Lunes a Domingo**.
- Estados del problema: `'por revisar'` (recibe presupuestos), `'pendiente'` (agendado), `'terminada'` (la marca el cron `revisarTerminadas`) y `'cancelado'`.

---

## 2. Rutas que el frontend llama

Todas llevan `Authorization: Bearer <token>`. Las respuestas siguen el formato de siempre, `{ message, result }`.

### Problemas (`/api/solicitudes`)

| Ruta | Estado hoy | Qué tiene que hacer |
|---|---|---|
| `POST /subirSolicitud` | ⚠️ existe, pero exige `trabajadorid` y no pasa `dirigida` al service | Si `dirigida === false`, **no** exigir `trabajadorid`, y guardar los campos nuevos. Subir las `fotos` (base64) a Cloudinary y guardar las URLs. |
| `GET /busquedaAA` | ⚠️ existe | Agregar las columnas de abajo. Excluir los problemas del propio usuario (`contratadorid <> $1`). |
| `GET /misProblemas` | ❌ falta | Problemas del usuario logueado con `dirigida = false`, **en cualquier estado**. |
| `GET /problema/:id` | ❌ falta | Detalle de un problema. Si sos el dueño, incluye `aplicaciones`; si sos trabajador, incluye `mi_aplicacion`. |
| `PUT /editarProblema` | ❌ falta | Editar un problema propio que siga en `'por revisar'`. Body: `{ solicitudid, ...mismos campos que subir }`. |
| `DELETE /borrarSolicitud` | ✅ existe | Se usa para cancelar un problema abierto. |
| `PUT /cancelarTrabajo` | ✅ existe | Se usa para cancelar un problema ya agendado (sirve tanto para el cliente como para el trabajador). |

**Body de `subirSolicitud` para un problema:**
```json
{
  "dirigida": false,
  "solicitud": "Gotea la canilla de la cocina...",
  "titulo": "Pérdida de agua debajo de la bacha",
  "aptitudid": 3,
  "aptitud": "Plomería",
  "localidad": "CABA",
  "barrio": "Palermo",
  "direccion": "Av. Siempreviva 742, 3°B",
  "periodo": ["2026-10-23", "2026-10-30"],
  "diassemana": [true, true, true, true, true, false, false],
  "franja": "manana",
  "urgencia": "semana",
  "presupuesto_estimado": 30000,
  "fotos": ["data:image/jpeg;base64,...", "..."]
}
```
`aptitudid` sale de `GET /api/aptitudes/buscarAptitudes`. También mandamos el nombre en `aptitud`, por si conviene crearla si no existe.

**Columnas que el frontend espera en cada problema** (`busquedaAA`, `misProblemas`, `problema/:id`):
`id, contratadorid, solicitud, titulo, aptitud, localidad, barrio, periodo, diassemana, franja, urgencia, presupuesto_estimado, fotos, estado, creado, trabajadorid, hora,`
y además:
- `cliente_nombre`, `cliente_foto`: el `nombre_completo` y la `foto_perfil` del contratador.
- `cantidad_presupuestos`: cantidad de aplicaciones en estado `'enviado'` o `'aceptado'`.
- `presupuesto_minimo`: el monto más bajo entre ellas.
- `direccion`: **solo** si el que pide es el dueño o el trabajador elegido; si no, `null`.
- `mi_aplicacion`: la aplicación del usuario logueado en ese problema, si existe.
- `aplicaciones`: solo para el dueño; la lista de presupuestos, con el formato de abajo.

### Presupuestos (`/api/aplicaciones`)

| Ruta | Estado hoy | Qué tiene que hacer |
|---|---|---|
| `POST /subirAplicacion` | ⚠️ existe (valida que el período esté dentro de la solicitud) | Guardar también `hora, monto, mensaje, materiales, duracion`. Validar: el problema está `'por revisar'` y `dirigida = false`; no es tuyo; no tenés otra aplicación `'enviado'`; el día cae en `diassemana`. Notificar al cliente. |
| `DELETE /borrarAplicacion` | ✅ existe | Retirar el presupuesto. Body: `{ solicitudid }`. Solo si está `'enviado'`. |
| `GET /misAplicaciones` | ❌ falta | Presupuestos del trabajador logueado. Cada uno trae el problema en `solicitud_detalle`, con el mismo formato de problema de arriba. |
| `POST /aceptarAplicacion` | ❌ falta | Body: `{ aplicacionid }`. Ver detalle abajo. |
| `POST /rechazarAplicacion` | ❌ falta | Body: `{ aplicacionid }`. La aplicación pasa a `'rechazado'` y se notifica al trabajador. |

**Body de `subirAplicacion`:**
```json
{
  "solicitudid": 15,
  "periodo": ["2026-10-24", "2026-10-24"],
  "hora": "10:30",
  "monto": 25000,
  "mensaje": "Cambio el flexible y la válvula...",
  "materiales": "incluidos",
  "duracion": "1 a 2 horas"
}
```

**Formato de cada aplicación** (en `aplicaciones`, `mi_aplicacion` y `misAplicaciones`):
`id, solicitudid, trabajadorid, periodo, hora, monto, mensaje, materiales, duracion, estado, creado,`
más `trabajador_nombre`, `trabajador_foto` y `puntuacion_trabajador` (los datos del trabajador). En `misAplicaciones`, además, `solicitud_detalle`.

**`aceptarAplicacion`** hace lo mismo que `aceptarSolicitud` con `dia`, pero eligiendo un presupuesto:
1. Verifica que el problema sea del usuario y esté en `'por revisar'`.
2. Pone el problema en `estado = 'pendiente'`, con el `trabajadorid` y la `hora` de la aplicación y `periodo = [dia, dia]`. Así aparece solo en `trabajosPendientes` y `serviciosPendientes`, y el cron `revisarTerminadas` lo cierra después.
3. Pone esa aplicación en `'aceptado'` y las demás de ese problema en `'rechazado'`.
4. Notifica al trabajador elegido ("¡Te eligieron! ... el día X a las Y"), a los rechazados y al cliente.

### Notificaciones

El frontend ya muestra las que vienen de la base (tabla `notificaciones`). Para que lleguen sin tener que volver a iniciar sesión, haría falta `GET /api/usuarios/misNotificaciones`. Hoy solo llegan en la respuesta de `iniciarSesion`.

---

## 3. Bugs que vi en lo que ya está

1. **`subirSolicitud` (service):** `if(diassemana = [false, ...])` usa `=` (asigna) en vez de comparar. Eso **siempre** pisa los días con "todos `true`". Corrección sugerida:
   ```js
   if (!Array.isArray(diassemana) || diassemana.every((d) => !d)) diassemana = [true,true,true,true,true,true,true];
   ```
2. **`aceptarSolicitud`:** el índice `(EXTRACT(DOW FROM $3)-1)%7 + 1` da `0` para los **domingos**, porque en Postgres `-1 % 7 = -1`, y los arrays empiezan en 1, así que los domingos nunca coinciden. Usar `EXTRACT(ISODOW FROM $3)::int`, que da 1 = lunes … 7 = domingo.
3. **`aceptarSolicitud` para `dirigida = false`:** pide que `periodo[1] = dia AND periodo[2] = dia`, o sea que solo acepta problemas de **un solo día**. Si la idea es que el trabajador elija un día dentro del período, tendría que ser `dia BETWEEN periodo[1] AND periodo[2]`.
4. **`misSolicitudes`:** hace `INNER JOIN usuarios u ON u.id = s.trabajadorid`, así que los problemas abiertos (sin trabajador) no aparecen. Por eso hace falta `misProblemas`, o un `LEFT JOIN`.
