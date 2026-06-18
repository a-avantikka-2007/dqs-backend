const { query } = require("../config/db");

async function createAppointment({ user_id, department_id, appointment_date, appointment_time, reason }) {
  const result = await query(
    `INSERT INTO appointments (user_id, department_id, appointment_date, appointment_time, reason, status)
     VALUES (?, ?, ?, ?, ?, 'PENDING')`,
    [user_id, department_id, appointment_date, appointment_time, reason]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const rows = await query(
    `SELECT a.*, d.name AS department_name, d.code AS department_code, u.name AS user_name, u.email AS user_email
     FROM appointments a
     JOIN departments d ON d.id = a.department_id
     JOIN users u ON u.id = a.user_id
     WHERE a.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listAppointments({ userId, status, departmentId } = {}) {
  const params = [];
  let sql = `
    SELECT a.*, d.name AS department_name, d.code AS department_code, u.name AS user_name, u.email AS user_email
    FROM appointments a
    JOIN departments d ON d.id = a.department_id
    JOIN users u ON u.id = a.user_id
    WHERE 1=1`;

  if (userId) {
    sql += " AND a.user_id = ?";
    params.push(userId);
  }
  if (status) {
    sql += " AND a.status = ?";
    params.push(status);
  }
  if (departmentId) {
    sql += " AND a.department_id = ?";
    params.push(departmentId);
  }

  sql += " ORDER BY a.appointment_date DESC, a.appointment_time DESC";
  return query(sql, params);
}

async function reschedule(id, { appointment_date, appointment_time }) {
  await query(
    "UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'PENDING' WHERE id = ?",
    [appointment_date, appointment_time, id]
  );
  return findById(id);
}

async function updateStatus(id, status, staffId = null) {
  await query(
    "UPDATE appointments SET status = ?, handled_by = ?, handled_at = NOW() WHERE id = ?",
    [status, staffId, id]
  );
  return findById(id);
}

module.exports = {
  createAppointment,
  findById,
  listAppointments,
  reschedule,
  updateStatus
};
