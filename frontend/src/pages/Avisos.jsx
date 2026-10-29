import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export default function App() {
  const [avisos, setAvisos] = useState([]);
  const [estado, setEstado] = useState("Conectando...");

  useEffect(() => {
    // Este componente crea su propia conexión con Pusher.
    const pusher = new Pusher("7c6dfd35eff5ea1bc212", {
      cluster: "sa1",
      forceTLS: true,
    });

    const canal = pusher.subscribe("avisos");

    // Se ejecuta cada vez que llega un aviso.
    function recibirAviso(aviso) {
      setAvisos((avisosActuales) => [
        aviso,
        ...avisosActuales,
      ]);
    }

    function confirmarSuscripcion() {
      setEstado("Listo para recibir avisos.");
    }

    function actualizarConexion({ current }) {
      if (current !== "connected") {
        setEstado("Conexión: " + current);
      }
    }

    canal.bind("nuevo-aviso", recibirAviso);

    canal.bind(
      "pusher:subscription_succeeded",
      confirmarSuscripcion
    );

    pusher.connection.bind(
      "state_change",
      actualizarConexion
    );

    // Limpiamos la suscripción cuando se desmonta el componente.
    return () => {
      canal.unbind("nuevo-aviso", recibirAviso);

      canal.unbind(
        "pusher:subscription_succeeded",
        confirmarSuscripcion
      );

      pusher.connection.unbind(
        "state_change",
        actualizarConexion
      );

      pusher.unsubscribe("avisos");
      pusher.disconnect();
    };
  }, []);

  return (
    <main>
      <h1>Avisos en tiempo real</h1>

      <p>{estado}</p>

      <ul>
        {avisos.map((aviso) => (
          <li key={aviso.id}>
            {aviso.texto}
          </li>
        ))}
      </ul>
    </main>
  );
}