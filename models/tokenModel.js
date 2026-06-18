const { pool, query } = require("../config/db");

async function buildTokenNumber(connection, department) {
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await connection.execute(
    "SELECT COUNT(*) AS count FROM tokens WHERE department_id = ? AND DATE(created_at) = ?",
    [department.id, today]
  );
  const sequence = Number(rows[0].count) + 1;
  return `${department.code}-A${String(sequence).padStart(3, "0")}`;
}

async function createToken({ user_id, department_id, appointment_id = null }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [departments] = await connection.execute("SELECT * FROM departments WHERE id = ? AND status = 'ACTIVE'", [
      department_id
    ]);
    const department = departments[0];
    if (!department) {
      const error = new Error("Active department not found");
      error.statusCode = 404;
      throw error;
    }

    const tokenNumber = await buildTokenNumber(connection, department);
    const [result] = await connection.execute(
      "INSERT INTO tokens (user_id, department_id, appointment_id, token_number, status) VALUES (?, ?, ?, ?, 'WAITING')",
      [user_id, department_id, appointment_id, tokenNumber]
    );

    await connection.commit();
    return findById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findById(id) {
  const rows = await query(
    `SELECT t.*, d.name AS department_name, d.code AS department_code, d.average_service_minutes, u.name AS user_name
     FROM tokens t
     JOIN departments d ON d.id = t.department_id
     JOIN users u ON u.id = t.user_id
     WHERE t.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listTokens({ userId, departmentId, status, todayOnly = false } = {}) {
  const params = [];
  let sql = `
    SELECT t.*, d.name AS department_name, d.code AS department_code, d.average_service_minutes, u.name AS user_name
    FROM tokens t
    JOIN departments d ON d.id = t.department_id
    JOIN users u ON u.id = t.user_id
    WHERE 1=1`;

  if (userId) {
    sql += " AND t.user_id = ?";
    params.push(userId);
  }
  if (departmentId) {
    sql += " AND t.department_id = ?";
    params.push(departmentId);
  }
  if (status) {
    sql += " AND t.status = ?";
    params.push(status);
  }
  if (todayOnly) {
    sql += " AND DATE(t.created_at) = CURDATE()";
  }

  sql += " ORDER BY t.created_at DESC";
  return query(sql, params);
}

async function getQueuePosition(tokenId) {
  const token = await findById(tokenId);
  if (!token) return null;

  if (token.status !== "WAITING") {
    return {
      token,
      position: 0,
      estimated_wait_minutes: 0
    };
  }

  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM tokens
     WHERE department_id = ?
       AND status = 'WAITING'
       AND created_at <= ?`,
    [token.department_id, token.created_at]
  );
  const position = Number(rows[0].count);
  return {
    token,
    position,
    estimated_wait_minutes: Math.max(0, (position - 1) * Number(token.average_service_minutes || 10))
  };
}

async function callNext(departmentId) {
  const waiting = await query(
    `SELECT id FROM tokens
     WHERE department_id = ? AND status = 'WAITING' AND DATE(created_at) = CURDATE()
     ORDER BY created_at ASC
     LIMIT 1`,
    [departmentId]
  );

  if (!waiting[0]) return null;
  await query("UPDATE tokens SET status = 'CALLED', called_at = NOW() WHERE id = ?", [waiting[0].id]);
  return findById(waiting[0].id);
}

async function nextWaitingAfterCall(departmentId) {
  const rows = await query(
    `SELECT t.*, d.name AS department_name, d.code AS department_code, d.average_service_minutes, u.name AS user_name
     FROM tokens t
     JOIN departments d ON d.id = t.department_id
     JOIN users u ON u.id = t.user_id
     WHERE t.department_id = ? AND t.status = 'WAITING' AND DATE(t.created_at) = CURDATE()
     ORDER BY t.created_at ASC
     LIMIT 1`,
    [departmentId]
  );
  return rows[0] || null;
}

async function updateStatus(id, status) {
  const timestampColumn = {
    CALLED: "called_at",
    COMPLETED: "completed_at",
    SKIPPED: "skipped_at"
  }[status];

  const sql = timestampColumn
    ? `UPDATE tokens SET status = ?, ${timestampColumn} = NOW() WHERE id = ?`
    : "UPDATE tokens SET status = ? WHERE id = ?";
  await query(sql, [status, id]);
  return findById(id);
}

module.exports = {
  createToken,
  findById,
  listTokens,
  getQueuePosition,
  callNext,
  nextWaitingAfterCall,
  updateStatus
};
