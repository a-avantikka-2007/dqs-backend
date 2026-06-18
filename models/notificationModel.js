const { query } = require("../config/db");

async function createNotification({ user_id, title, message, type = "SYSTEM", related_id = null }) {
  const result = await query(
    "INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)",
    [user_id, title, message, type, related_id]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const rows = await query("SELECT * FROM notifications WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function listForUser(userId) {
  return query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [userId]);
}

async function markRead(id, userId) {
  await query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [id, userId]);
  return findById(id);
}

async function markAllRead(userId) {
  await query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
}

module.exports = {
  createNotification,
  findById,
  listForUser,
  markRead,
  markAllRead
};
