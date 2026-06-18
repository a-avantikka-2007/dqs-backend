const { query } = require("../config/db");

async function logActivity({ user_id = null, action, entity_type = null, entity_id = null, metadata = null }) {
  await query(
    "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)",
    [user_id, action, entity_type, entity_id, metadata ? JSON.stringify(metadata) : null]
  );
}

async function listLogs({ limit = 100 } = {}) {
  return query(
    `SELECT al.*, u.name AS user_name, u.email AS user_email
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
}

module.exports = { logActivity, listLogs };
