import React, { useState, useEffect } from "react";
const API = "http://localhost:3002";

function LoginPaciente({ onLogin }) {
  const [step, setStep] = useState(1); // 1: registro, 2: login
  const [nombre, setNombre] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [pacienteId, setPacienteId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/pacientes`)
      .then(res => res.json())
      .then(setPacientes)
      .catch(() => setPacientes([]));
  }, [step]);

  // Registrar paciente
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) {
      setError("Ingresa el nombre");
      return;
    }
    const res = await fetch(`${API}/pacientes`, {
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
      setError(data.message || "Error al registrar paciente");
    }
  };

  // Login paciente
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!pacienteId) {
      setError("Selecciona un paciente");
      return;
    }
    const paciente = pacientes.find(p => String(p.id) === String(pacienteId));
    if (!paciente) {
      setError("Paciente no encontrado");
      return;
    }
    localStorage.setItem("pacienteNombre", paciente.nombre);
    localStorage.setItem("pacienteId", paciente.id);
    localStorage.setItem("pacienteEstado", "conectado");
    onLogin(paciente.id);
  };

  // Cambiar a registro
  const goToRegister = () => {
    setStep(1);
    setError("");
    setPacienteId("");
  };

  // Cambiar a login
  const goToLogin = () => {
    setStep(2);
    setError("");
    setNombre("");
  };

  return (
    <div className="card p-4 mx-auto mt-5" style={{ maxWidth: 400 }}>
      {step === 1 ? (
        <>
          <h3 className="mb-3">Registrar Paciente</h3>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nombre del paciente"
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
          <h3 className="mb-3">Login Paciente</h3>
          <form onSubmit={handleLogin}>
            <select
              className="form-select mb-2"
              value={pacienteId}
              onChange={e => setPacienteId(e.target.value)}
              required
              autoFocus
            >
              <option value="">Selecciona tu nombre</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <button className="btn btn-primary w-100" type="submit">Entrar</button>
          </form>
          <button
            className="btn btn-link mt-3 w-100"
            onClick={goToRegister}
          >
            Registrar nuevo paciente
          </button>
          {error && <div className="alert alert-danger mt-2">{error}</div>}
        </>
      )}
    </div>
  );
}

export default LoginPaciente;