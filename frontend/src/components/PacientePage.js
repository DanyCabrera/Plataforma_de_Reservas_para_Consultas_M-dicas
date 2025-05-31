import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
const API = "http://localhost:3002";

function PacientePage({ pacienteId, onLogout }) {
  const [medicos, setMedicos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [alert, setAlert] = useState(null);
  const [nuevo, setNuevo] = useState({ medico_id: "", fecha: "", hora: "" });
  const [editando, setEditando] = useState(null);
  const [editData, setEditData] = useState({ fecha: "", hora: "" });
  const [historial, setHistorial] = useState([]);

  const pacienteNombre = localStorage.getItem("pacienteNombre") || "Paciente";

  // Refresca médicos cada 5 segundos para ver el estado actualizado
  useEffect(() => {
    const fetchMedicos = () => {
      fetch(`${API}/medicos`).then(res => res.json()).then(setMedicos);
    };
    fetchMedicos();
    const interval = setInterval(fetchMedicos, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Cargar reservas del paciente
  const cargarCitas = () => {
    fetch(`${API}/reservas`).then(res => res.json()).then(data => {
      setReservas(data.filter(r => r.paciente.id === pacienteId));
    });
  };
  useEffect(() => {
    cargarCitas();
  }, [pacienteId]);

  // Cargar historial médico
  useEffect(() => {
    fetch(`${API}/historial/${pacienteId}`)
      .then(res => res.json())
      .then(setHistorial);
  }, [pacienteId]);

  const handleChange = e => {
    setNuevo({ ...nuevo, [e.target.name]: e.target.value });
  };

  const agendar = async () => {
    if (!nuevo.medico_id || !nuevo.fecha || !nuevo.hora) {
      setAlert({ type: "danger", message: "Completa todos los campos." });
      return;
    }
    const res = await fetch(`${API}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paciente_id: pacienteId,
        medico_id: Number(nuevo.medico_id),
        fecha: nuevo.fecha,
        hora: nuevo.hora
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setAlert({ type: "success", message: data.message });
      cargarCitas();
      setNuevo({ medico_id: "", fecha: "", hora: "" });
    } else {
      setAlert({ type: "danger", message: data.message });
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta cita?")) return;
    await fetch(`${API}/reservas/${id}`, { method: "DELETE" });
    setAlert({ type: "success", message: "Cita eliminada" });
    cargarCitas();
  };

  const iniciarEdicion = (reserva) => {
    setEditando(reserva.id);
    setEditData({ fecha: reserva.fecha, hora: reserva.hora });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setEditData({ fecha: "", hora: "" });
  };

  const guardarEdicion = async (id) => {
    if (!editData.fecha || !editData.hora) {
      setAlert({ type: "danger", message: "Completa fecha y hora" });
      return;
    }
    // Busca la reserva para obtener medico_id
    const reserva = reservas.find(r => r.id === id);
    if (!reserva) {
      setAlert({ type: "danger", message: "Reserva no encontrada" });
      return;
    }
    const res = await fetch(`${API}/reservas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: editData.fecha,
        hora: editData.hora,
        paciente_id: pacienteId,
        medico_id: reserva.medico.id,
        notificar: true
      }),
    });
    if (res.ok) {
      setAlert({ type: "success", message: "Cita actualizada" });
      setEditando(null);
      cargarCitas();
    } else {
      const data = await res.json();
      setAlert({ type: "danger", message: data.message || "Error al actualizar" });
    }
  };

  // Helper para mostrar el estado del médico
  const MedicoEstado = ({ conectado }) => (
    <span
      style={{
        display: "inline-block",
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: conectado ? "#28a745" : "#ccc",
        marginRight: 6,
        border: "1px solid #888",
        verticalAlign: "middle"
      }}
      title={conectado ? "Conectado" : "Desconectado"}
    />
  );

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2> <i className="fas fa-user"></i> Paciente: {pacienteNombre}</h2>
        {onLogout && (
          <button className="btn btn-secondary" onClick={onLogout}>
            Cerrar sesión
          </button>
        )}
      </div>
      <motion.div
        className="row justify-content-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="col-md-6">
          <motion.div
            className="card shadow-lg mb-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="card-body">
              <h4 className="card-title text-center mb-4">Agendar nueva cita</h4>
              {alert && (
                <AnimatePresence>
                  <motion.div
                    className={`alert alert-${alert.type}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {alert.message}
                  </motion.div>
                </AnimatePresence>
              )}
              <div className="mb-3">
                <select
                  name="medico_id"
                  value={nuevo.medico_id}
                  onChange={handleChange}
                  className="form-select mb-2"
                  required
                >
                  <option value="">Selecciona médico</option>
                  {medicos.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} {m.conectado ? "(Activo)" : "(Desconectado)"}
                    </option>
                  ))}
                </select>
                <input type="date" name="fecha" value={nuevo.fecha} onChange={handleChange} className="form-control mb-2" />
                <input type="time" name="hora" value={nuevo.hora} onChange={handleChange} className="form-control mb-2" />
                <button className="btn btn-success w-100" onClick={agendar}>Agendar</button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        className="row justify-content-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="col-md-10">
          <h4 className="mb-3 text-center">Mis agendas</h4>
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Médico</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(r => {
                const medico = medicos.find(m => m.id === r.medico.id);
                return (
                  <tr key={r.id}>
                    {editando === r.id ? (
                      <>
                        <td>
                          <input
                            type="date"
                            value={editData.fecha}
                            onChange={e => setEditData({ ...editData, fecha: e.target.value })}
                            className="form-control"
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            value={editData.hora}
                            onChange={e => setEditData({ ...editData, hora: e.target.value })}
                            className="form-control"
                          />
                        </td>
                        <td>
                          {medico && <MedicoEstado conectado={medico.conectado} />}
                          {medico ? medico.nombre : r.medico.nombre}{" "}
                          {medico ? (medico.conectado ? "(Conectado)" : "(Desconectado)") : ""}
                        </td>
                        <td>
                          {r.disponible ? (
                            <span className="badge bg-success">Disponible</span>
                          ) : (
                            <span className="badge bg-secondary">No disponible</span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-success btn-sm me-2" onClick={() => guardarEdicion(r.id)}>Guardar</button>
                          <button className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{r.fecha.slice(0, 10)}</td>
                        <td>{r.hora}</td>
                        <td>
                          {medico && <MedicoEstado conectado={medico.conectado} />}
                          {medico ? medico.nombre : r.medico.nombre}{" "}
                          {medico ? (medico.conectado ? "(Conectado)" : "(Desconectado)") : ""}
                        </td>
                        <td>
                          {r.disponible ? (
                            <span className="badge bg-success">Disponible</span>
                          ) : (
                            <span className="badge bg-secondary">No disponible</span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-warning btn-sm me-2" onClick={() => iniciarEdicion(r)}>Actualizar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => eliminar(r.id)}>Eliminar</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {reservas.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">No tienes agendas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Historial médico */}
      <motion.div
        className="row justify-content-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="col-md-10">
          <h4 className="mb-3 text-center">Historial Médico</h4>
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {historial.length > 0 ? (
                historial.map(item => (
                  <tr key={item.id}>
                    <td>{item.fecha.slice(0, 10)}</td>
                    <td>{item.paciente_nombre}</td>
                    <td>{item.medico_nombre}</td>
                    <td>{item.descripcion}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No hay historial médico registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default PacientePage;