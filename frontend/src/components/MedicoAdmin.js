import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
const API = "http://localhost:3002";

function MedicoAdmin({ medicoId, onLogout }) {
  const [reservas, setReservas] = useState([]);
  const [medico, setMedico] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [notificar, setNotificar] = useState(false);
  const [editReserva, setEditReserva] = useState(null);
  const [editData, setEditData] = useState({ fecha: "", hora: "", paciente_id: "" });
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState("");
  const [historial, setHistorial] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  const cargarCitas = () => {
    fetch(`${API}/reservas`)
      .then(res => res.json())
      .then(data => {
        setReservas(data.filter(r => r.medico.id === medicoId));
      });
  };

  useEffect(() => {
    cargarCitas();
    fetch(`${API}/medicos`)
      .then(res => res.json())
      .then(medicos => {
        setMedico(medicos.find(m => m.id === medicoId));
      });
    fetch(`${API}/pacientes`)
      .then(res => res.json())
      .then(setPacientes);
  }, [medicoId]);

  // Cargar historial cuando se selecciona un paciente
  useEffect(() => {
    if (pacienteSeleccionado) {
      fetch(`${API}/historial/${pacienteSeleccionado}`)
        .then(res => res.json())
        .then(setHistorial);
    } else {
      setHistorial([]);
    }
  }, [pacienteSeleccionado]);

  const marcarDisponibilidadCita = async (reservaId, disponibleCita) => {
    await fetch(`${API}/reservas/${reservaId}/disponibilidad`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponible: disponibleCita }),
    });
    setReservas(reservas.map(r =>
      r.id === reservaId ? { ...r, disponible: disponibleCita } : r
    ));
  };

  const handleLogout = async () => {
    await fetch(`${API}/medicos/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: medicoId }),
    });
    onLogout();
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

  // Iniciar edición de una reserva
  const iniciarEdicion = (reserva) => {
    setEditReserva(reserva.id);
    setEditData({
      fecha: reserva.fecha,
      hora: reserva.hora,
      paciente_id: reserva.paciente.id
    });
    setNotificar(false);
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditReserva(null);
    setEditData({ fecha: "", hora: "", paciente_id: "" });
    setNotificar(false);
  };

  // Guardar edición y notificar si corresponde
  const guardarEdicion = async (id) => {
    if (!editData.fecha || !editData.hora || !editData.paciente_id) {
      setAlert({ type: "danger", message: "Completa todos los campos" });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch(`${API}/reservas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: editData.fecha,
          hora: editData.hora,
          paciente_id: editData.paciente_id,
          medico_id: medicoId,
          notificar
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: "success", message: data.message || "Cita actualizada" });
        setEditReserva(null);
        setEditData({ fecha: "", hora: "", paciente_id: "" });
        setNotificar(false);
        cargarCitas();
      } else {
        setAlert({ type: "danger", message: data.message || "Error al actualizar cita" });
      }
    } catch (err) {
      setAlert({ type: "danger", message: "Error de red o servidor" });
    }
    setLoading(false);
  };

  // Agregar registro al historial
  const agregarHistorial = async (e) => {
    e.preventDefault();
    if (!pacienteSeleccionado || !descripcion.trim()) {
      setAlert({ type: "danger", message: "Selecciona un paciente y escribe una descripción" });
      return;
    }
    const res = await fetch(`${API}/historial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paciente_id: pacienteSeleccionado,
        medico_id: medicoId,
        descripcion
      }),
    });
    if (res.ok) {
      setDescripcion("");
      setAlert({ type: "success", message: "Registro agregado al historial" });
      // Recargar historial
      fetch(`${API}/historial/${pacienteSeleccionado}`)
        .then(res => res.json())
        .then(setHistorial);
    } else {
      setAlert({ type: "danger", message: "Error al agregar registro" });
    }
  };

  return (
    <div className="container py-5">
      <motion.div
        className="card shadow mx-auto"
        style={{ maxWidth: 800 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-body text-center">
          <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
            Citas
          </motion.h3>
          <div className="mb-2">
            {medico && <MedicoEstado conectado={medico.conectado} />}
            <b>Médico: {medico ? medico.nombre : "Desconocido"}</b>
          </div>
          <button className="btn btn-danger w-100 mb-3" onClick={handleLogout}>
            Cerrar sesión
          </button>
          <h5 className="mt-4 mb-3">Mis citas</h5>
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(r => (
                <tr key={r.id}>
                  {editReserva === r.id ? (
                    <>
                      <td>
                        <select
                          className="form-select"
                          value={editData.paciente_id}
                          onChange={e => setEditData({ ...editData, paciente_id: e.target.value })}
                        >
                          {pacientes.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </td>
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
                        <input
                          type="checkbox"
                          checked={notificar}
                          onChange={e => setNotificar(e.target.checked)}
                        /> Notificar
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => guardarEdicion(editReserva)}
                          disabled={loading}
                        >
                          {loading ? "Guardando..." : "Guardar"}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={cancelarEdicion}>Cancelar</button>
                      </td>
                      {alert && <div className={`alert alert-${alert.type} mt-2`}>{alert.message}</div>}
                    </>
                  ) : (
                    <>
                      <td>{r.paciente.nombre} ({r.paciente.email})</td>
                      <td>{r.fecha.slice(0, 10)}</td>
                      <td>{r.hora}</td>
                      <td>
                        {r.disponible ? (
                          <span className="badge bg-success">Disponible</span>
                        ) : (
                          <span className="badge bg-secondary">No disponible</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`btn btn-warning btn-sm me-2`}
                          onClick={() => iniciarEdicion(r)}
                        >
                          Editar
                        </button>
                        <button
                          className={`btn btn-sm ${r.disponible ? "btn-danger" : "btn-success"}`}
                          onClick={() => marcarDisponibilidadCita(r.id, !r.disponible)}
                        >
                          {r.disponible ? "Marcar No disponible" : "Marcar Disponible"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {reservas.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">No tienes citas asignadas</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Historial médico */}
          <div className="mt-5">
            <h5>Historial Médico de Paciente</h5>
            <form className="row g-2 align-items-center mb-3" onSubmit={agregarHistorial}>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={pacienteSeleccionado}
                  onChange={e => setPacienteSeleccionado(e.target.value)}
                  required
                >
                  <option value="">Selecciona paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Descripción (solo el médico puede escribir)"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  required
                  disabled={!pacienteSeleccionado}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100" type="submit" disabled={!pacienteSeleccionado}>
                  Agregar
                </button>
              </div>
            </form>
            {alert && (
              <div className={`alert alert-${alert.type} mb-2`}>{alert.message}</div>
            )}
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
        </div>
      </motion.div>
    </div>
  );
}

export default MedicoAdmin;