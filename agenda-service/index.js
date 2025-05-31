const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const app = express();
const pool = new Pool({
  user: 'postgres',
  host: 'agenda-db',
  database: 'agenda',
  password: 'postgres',
  port: 5432,
});

// Genera tus claves VAPID una vez con: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'BEKptYBkNVEbVtB8cFCd0MLXtPPPP9vPT5-1500-iz1Vu5w-HuYEfdn5s-z-9thQNkwCBsveN5F9GE00dxJSHGA';
const VAPID_PRIVATE_KEY = 'VzQsj06xnp2pKC20lTWAiXXqDmNLpUD2qBtwwlIrh9A';

webpush.setVapidDetails(
  'mailto:cabrera.her04@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Simula una base de datos en memoria para las suscripciones push
const pushSubscriptions = {}; // { pacienteId: subscription }

app.post('/suscripcion', (req, res) => {
  const { pacienteId, subscription } = req.body;
  if (!pacienteId || !subscription) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  pushSubscriptions[pacienteId] = subscription;
  res.json({ message: 'Suscripción guardada' });
});

// Agendar una cita
app.post('/reservas', async (req, res) => {
  const { paciente_id, medico_id, fecha, hora } = req.body;
  if (!paciente_id || !medico_id || !fecha || !hora) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  const result = await pool.query(
    'INSERT INTO reservas (paciente_id, medico_id, fecha, hora, disponible) VALUES ($1, $2, $3, $4, true) RETURNING *',
    [paciente_id, medico_id, fecha, hora]
  );
  res.json({ message: 'Cita agendada', reserva: result.rows[0] });
});
// ... tus endpoints anteriores ...
// Registrar médico
app.post('/medicos', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ message: 'Nombre requerido' });
  }
  // Verifica si ya existe
  const existe = await pool.query('SELECT * FROM medicos WHERE nombre = $1', [nombre]);
  if (existe.rows.length > 0) {
    return res.status(409).json({ message: 'El nombre ya está registrado' });
  }
  const result = await pool.query(
    'INSERT INTO medicos (nombre, conectado) VALUES ($1, false) RETURNING *',
    [nombre]
  );
  res.json(result.rows[0]);
});

// Endpoint para cambiar disponibilidad de una cita
app.put('/reservas/:id/disponibilidad', async (req, res) => {
  const { id } = req.params;
  const { disponible } = req.body;
  await pool.query('UPDATE reservas SET disponible = $1 WHERE id = $2', [disponible, id]);
  res.json({ message: 'Disponibilidad de la cita actualizada' });
});

// Asegúrate de que el endpoint de reservas devuelva el campo disponible
// Listar todas las reservas (con datos de paciente y médico)
app.get('/reservas', async (req, res) => {
  const result = await pool.query(`
    SELECT r.*, p.nombre as paciente_nombre, m.nombre as medico_nombre, m.id as medico_id
    FROM reservas r
    JOIN pacientes p ON r.paciente_id = p.id
    JOIN medicos m ON r.medico_id = m.id
    ORDER BY r.fecha DESC, r.hora DESC
  `);
  res.json(result.rows.map(r => ({
    id: r.id,
    fecha: r.fecha,
    hora: r.hora,
    disponible: r.disponible,
    paciente: { id: r.paciente_id, nombre: r.paciente_nombre },
    medico: { id: r.medico_id, nombre: r.medico_nombre }
  })));
});

// Login médico (marca como conectado)
app.post('/medicos/login', async (req, res) => {
  const { id } = req.body;
  await pool.query('UPDATE medicos SET conectado = true WHERE id = $1', [id]);
  res.json({ message: 'Médico conectado' });
});

// Logout médico (marca como desconectado)
app.post('/medicos/logout', async (req, res) => {
  const { id } = req.body;
  await pool.query('UPDATE medicos SET conectado = false WHERE id = $1', [id]);
  res.json({ message: 'Médico desconectado' });
})

// El endpoint /medicos ya debe devolver el campo conectado
// Listar todos los médicos
app.get('/medicos', async (req, res) => {
  const result = await pool.query('SELECT * FROM medicos');
  res.json(result.rows);
});

// Cambiar disponibilidad de una cita
app.put('/reservas/:id/disponibilidad', async (req, res) => {
  const { id } = req.params;
  const { disponible } = req.body;
  await pool.query('UPDATE reservas SET disponible = $1 WHERE id = $2', [disponible, id]);
  res.json({ message: 'Disponibilidad actualizada' });
});

// Registrar paciente con email
// Ejemplo en Express
app.post('/pacientes', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ message: "Nombre requerido" });
  }
  try {
    const result = await pool.query(
      'INSERT INTO pacientes (nombre) VALUES ($1) RETURNING id, nombre',
      [nombre.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al registrar paciente:", error);
    res.status(500).json({ message: "Error al registrar paciente" });
  }
});

// Obtener todos los pacientes (para el panel del médico)
app.get('/pacientes', async (req, res) => {
  const result = await pool.query('SELECT * FROM pacientes ORDER BY nombre');
  res.json(result.rows);
});

// Obtener un paciente por ID
app.get('/pacientes/:id', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Paciente no encontrado' });
  }
  res.json(result.rows[0]);
});

// Login paciente (por nombre)
app.post('/pacientes/login', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });
  const result = await pool.query('SELECT * FROM pacientes WHERE nombre = $1', [nombre]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Paciente no encontrado' });
  }
  res.json(result.rows[0]);
});

// Eliminar una reserva
app.delete('/reservas/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM reservas WHERE id = $1', [id]);
  res.json({ message: 'Cita eliminada' });
});

// Modificar una cita y enviar notificación
// Endpoint para editar una reserva y notificar por push
// Endpoint para editar una reserva y notificar por push
app.put('/reservas/:id', async (req, res) => {
  const { fecha, hora, paciente_id, medico_id, notificar } = req.body;
  const { id } = req.params;

  try {
    // Actualiza la reserva en la base de datos
    await pool.query(
      'UPDATE reservas SET fecha = $1, hora = $2, paciente_id = $3, medico_id = $4 WHERE id = $5',
      [fecha, hora, paciente_id, medico_id, id]
    );

    // Obtén los nombres del médico y paciente
    const medicoRes = await pool.query('SELECT nombre FROM medicos WHERE id = $1', [medico_id]);
    const pacienteRes = await pool.query('SELECT nombre FROM pacientes WHERE id = $1', [paciente_id]);
    const nombreMedico = medicoRes.rows[0]?.nombre || "Médico";
    const nombrePaciente = pacienteRes.rows[0]?.nombre || "Paciente";

    // Notificación push al paciente
    if (notificar && pushSubscriptions[paciente_id]) {
      const payload = JSON.stringify({
        title: 'Cita actualizada',
        body: `Hola ${nombrePaciente}, tu cita con el Dr. ${nombreMedico} ha sido actualizada a ${fecha} a las ${hora}.`,
        medico: nombreMedico,
        paciente: nombrePaciente,
        fecha,
        hora
      });
      try {
        await webpush.sendNotification(pushSubscriptions[paciente_id], payload);
        console.log('Notificación push enviada');
      } catch (err) {
        console.error('Error al enviar push:', err);
      }
    }

    // Puedes notificar al médico también si guardas su suscripción

    res.json({ message: 'Reserva actualizada', medico: nombreMedico, paciente: nombrePaciente, fecha, hora });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar la reserva" });
  }
});

// Endpoint para obtener la clave pública VAPID (para el frontend)
app.get('/vapidPublicKey', (req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY });
});

// index.js (fragmento relevante)
app.post('/medicos/logout', async (req, res) => {
  const { nombre } = req.body;
  await pool.query('UPDATE medicos SET conectado = false WHERE nombre = $1', [nombre]);
  res.json({ message: 'Médico desconectado' });
});

// index.js (fragmento relevante)
// Obtener historial de un paciente
// GET /historial/:pacienteId
app.get('/historial/:pacienteId', async (req, res) => {
  const { pacienteId } = req.params;
  const result = await pool.query(
    `SELECT h.*, p.nombre AS paciente_nombre, m.nombre AS medico_nombre
     FROM historial h
     JOIN pacientes p ON h.paciente_id = p.id
     JOIN medicos m ON h.medico_id = m.id
     WHERE h.paciente_id = $1
     ORDER BY h.fecha DESC, h.id DESC`,
    [pacienteId]
  );
  res.json(result.rows);
});

// POST /historial
app.post('/historial', async (req, res) => {
  const { paciente_id, medico_id, descripcion } = req.body;
  if (!paciente_id || !medico_id || !descripcion) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  const result = await pool.query(
    'INSERT INTO historial (paciente_id, medico_id, descripcion, fecha) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *',
    [paciente_id, medico_id, descripcion]
  );
  res.json(result.rows[0]);
});

app.listen(3002, () => console.log('API corriendo en puerto 3002'));