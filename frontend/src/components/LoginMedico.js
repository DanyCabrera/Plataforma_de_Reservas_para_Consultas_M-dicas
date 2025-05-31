import React, { useState, useEffect } from "react";
const API = "http://localhost:3002";

function LoginMedico({ onLogin }) {
  const [step, setStep] = useState(1); // 1: registro, 2: login
  const [nombre, setNombre] = useState("");
  const [medicos, setMedicos] = useState([]);
  const [medicoId, setMedicoId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/medicos`).then(res => res.json()).then(setMedicos);
  }, [step]);

  // Registrar médico
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) {
      setError("Ingresa el nombre del médico");
      return;
    }
    const res = await fetch(`${API}/medicos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    if (res.ok) {
      setNombre("");
      setStep(2);
      setError("");
    } else {
      const data = await res.json();
      setError(data.message || "Error al registrar médico");
    }
  };

  // Login médico
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!medicoId) {
      setError("Selecciona un médico");
      return;
    }
    // Marca como conectado en el backend
    await fetch(`${API}/medicos/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: medicoId }),
    });
    const medico = medicos.find(m => String(m.id) === String(medicoId));
    localStorage.setItem("medicoNombre", medico.nombre);
    localStorage.setItem("medicoId", medico.id);
    onLogin(medico.id);
  };

  // Cambiar a registro
  const goToRegister = () => {
    setStep(1);
    setError("");
    setMedicoId("");
  };

  // Cambiar a login
  const goToLogin = () => {
    setStep(2);
    setError("");
    setNombre("");
  };

  return (
    <div className="card p-4">
      {step === 1 ? (
        <>
          <h3 className="mb-3">Registrar Médico</h3>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nombre del médico"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              autoFocus
            />
            <button className="btn btn-success w-100" type="submit">Registrar</button>
          </form>
          <button
            className="btn btn-link mt-3 w-100"
            onClick={goToLogin}
          >
            Ya estoy registrado
          </button>
          {error && <div className="alert alert-danger mt-2">{error}</div>}
        </>
      ) : (
        <>
          <h3 className="mb-3">Login Médico</h3>
          <form onSubmit={handleLogin}>
            <select
              className="form-select mb-2"
              value={medicoId}
              onChange={e => setMedicoId(e.target.value)}
              required
              autoFocus
            >
              <option value="">Selecciona tu nombre</option>
              {medicos.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre} {m.conectado ? "(Activo)" : "(Desconectado)"}
                </option>
              ))}
            </select>
            <button className="btn btn-primary w-100" type="submit">Entrar</button>
          </form>
          <button
            className="btn btn-link mt-3 w-100"
            onClick={goToRegister}
          >
            Registrar nuevo médico
          </button>
          {error && <div className="alert alert-danger mt-2">{error}</div>}
        </>
      )}
    </div>
  );
}

export default LoginMedico;