import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { mandarAviso } from "../api";

export default function App() {
  const [avisos, setAvisos] = useState([]);
  const [estado, setEstado] = useState("Elegí un canal.");
  const [canalEscrito, setCanalEscrito] = useState("");
  const [canalNombre, setCanalNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (!canalNombre) return;
    const pusher = new Pusher("7c6dfd35eff5ea1bc212", {
      cluster: "sa1",
      forceTLS: true,
    });
    const canal = pusher.subscribe(canalNombre);
    const recibirAviso = (aviso) => setAvisos((actuales) => [aviso, ...actuales]);
    const confirmarSuscripcion = () => {
      setEstado(`Conectado al canal: ${canalNombre}`);
      setConectado(true);
    };
    const errorSuscripcion = (error) => {
      setEstado("Error al suscribirse: " + (error?.message || "desconocido"));
      setConectado(false);
    };
    const actualizarConexion = ({ current }) => {
      if (current !== "connected") {
        setConectado(false);
        setEstado("Conexión: " + current);
      }
    };
    canal.bind("nuevo-aviso", recibirAviso);
    canal.bind("pusher:subscription_succeeded", confirmarSuscripcion);
    canal.bind("pusher:subscription_error", errorSuscripcion);
    pusher.connection.bind("state_change", actualizarConexion);
    return () => {
      canal.unbind("nuevo-aviso", recibirAviso);
      canal.unbind("pusher:subscription_succeeded", confirmarSuscripcion);
      canal.unbind("pusher:subscription_error", errorSuscripcion);
      pusher.connection.unbind("state_change", actualizarConexion);
      pusher.unsubscribe(canalNombre);
      pusher.disconnect();
    };
  }, [canalNombre]);

  function manejarCambioCanal() {
    const nuevoCanal = canalEscrito.trim();
    if (!nuevoCanal || nuevoCanal === canalNombre) return;
    setAvisos([]);
    setConectado(false);
    setEstado("Conectando...");
    setCanalNombre(nuevoCanal);
  }

  async function aviso(evento) {
    evento.preventDefault();
    if (!conectado || !mensaje.trim()) return;
    try {
      await mandarAviso(canalNombre, mensaje.trim());
      setMensaje("");
    } catch (error) {
      setEstado("Error al mandar aviso: " + error.message);
    }
  }

  return (
    <main>
      <h1>Avisos en tiempo real</h1>
      <div>
        <input
          type="text"
          placeholder="Nombre del canal"
          value={canalEscrito}
          onChange={(e) => setCanalEscrito(e.target.value)}
        />
        <button type="button" onClick={manejarCambioCanal}>Unirse al canal</button>
      </div>
      <form onSubmit={aviso}>
        <input
          type="text"
          placeholder="Mensaje de aviso"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
        <button type="submit" disabled={!conectado || !mensaje.trim()}>Mandar aviso</button>
      </form>
      <p>{estado}</p>
      <ul>
        {avisos.map((aviso) => <li key={aviso.id}>{aviso.texto}</li>)}
      </ul>
    </main>
  );
}
