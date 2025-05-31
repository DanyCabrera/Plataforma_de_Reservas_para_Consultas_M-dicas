import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginMedico from "./components/LoginMedico";
import MedicoAdmin from "./components/MedicoAdmin";
import LoginPaciente from "./components/LoginPaciente";
import PacientePage from "./components/PacientePage";

const API = "http://localhost:3002";

// Utilidad para convertir la clave pública VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function App() {
  // Estado global para mantener sesión
  const [medicoId, setMedicoId] = useState(localStorage.getItem("medicoId") || null);
  const [pacienteId, setPacienteId] = useState(localStorage.getItem("pacienteId") || null);
  const [pushError, setPushError] = useState(null);

  // Suscripción push para pacientes
  useEffect(() => {
    async function subscribePush() {
      if (
        pacienteId &&
        "serviceWorker" in navigator &&
        "PushManager" in window
      ) {
        try {
          // 1. Verifica y solicita permiso
          if (Notification.permission === "default") {
            const permiso = await Notification.requestPermission();
            if (permiso !== "granted") {
              setPushError("No se pudo activar las notificaciones push. Debes permitir las notificaciones en tu navegador.");
              return;
            }
          }
          if (Notification.permission === "denied") {
            setPushError("No se pudo activar las notificaciones push. El usuario denegó los permisos de notificación.");
            return;
          }

          // 2. Continúa con el registro normal
          const registration = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          const res = await fetch(`${API}/vapidPublicKey`);
          if (!res.ok) throw new Error("No se pudo obtener la clave pública VAPID");
          const { key } = await res.json();
          if (!key) throw new Error("Clave pública VAPID vacía");
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          });
          await fetch(`${API}/suscripcion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pacienteId, subscription }),
          });
          setPushError(null);
        } catch (err) {
          console.error("Error al suscribirse a push:", err);
          setPushError("No se pudo activar las notificaciones push. " + (err.message || "Verifica los permisos y la clave pública."));
        }
      }
    }
    subscribePush();
  }, [pacienteId]);

  return (
    <Router>
      {/* La alerta va aquí, fuera de <Routes> */}
      {pushError && (
        <div className="alert alert-danger" role="alert">
          {pushError}
        </div>
      )}
      <Routes>
        {/* Página de médico */}
        <Route
          path="/medico"
          element={
            medicoId ? (
              <MedicoAdmin
                medicoId={Number(medicoId)}
                onLogout={() => {
                  localStorage.removeItem("medicoId");
                  localStorage.removeItem("medicoNombre");
                  setMedicoId(null);
                }}
              />
            ) : (
              <LoginMedico
                onLogin={(id) => {
                  setMedicoId(id);
                  localStorage.setItem("medicoId", id);
                }}
              />
            )
          }
        />

        {/* Página de paciente */}
        <Route
          path="/paciente"
          element={
            pacienteId ? (
              <PacientePage
                pacienteId={Number(pacienteId)}
                onLogout={() => {
                  localStorage.removeItem("pacienteId");
                  localStorage.removeItem("pacienteNombre");
                  setPacienteId(null);
                }}
              />
            ) : (
              <LoginPaciente
                onLogin={(id) => {
                  setPacienteId(id);
                  localStorage.setItem("pacienteId", id);
                }}
              />
            )
          }
        />

        {/* Página de inicio: menú simple */}
        <Route
          path="/"
          element={
            <div className="container py-5">
              <h2 className="mb-4 text-center">Bienvenido a la Plataforma de Reservas</h2>
              <div className="d-flex justify-content-center gap-4">
                <a className="btn btn-primary" href="/medico">Soy Médico</a>
                <a className="btn btn-success" href="/paciente">Soy Paciente</a>
              </div>
            </div>
          }
        />

        {/* Redirección para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;