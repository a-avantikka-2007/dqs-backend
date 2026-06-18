const bcrypt = require("bcrypt");
const { query } = require("../config/db");
const env = require("../config/env");

const publicUserFields = "id, name, email, phone, role, status, created_at, updated_at";

function sanitize(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function createUser({ name, email, password, phone = null, role = "USER", status = "ACTIVE" }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    "INSERT INTO users (name, email, password_hash, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)",
    [name, email.toLowerCase(), passwordHash, phone, role, status]
  );
  return findById(result.insertId);
}

async function findByEmail(email) {
  const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email.toLowerCase()]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query(`SELECT ${publicUserFields} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function listUsers({ role, search } = {}) {
  const params = [];
  let sql = `SELECT ${publicUserFields} FROM users WHERE 1=1`;

  if (role) {
    sql += " AND role = ?";
    params.push(role);
  }

  if (search) {
    sql += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += " ORDER BY created_at DESC";
  return query(sql, params);
}

async function updateUser(id, data) {
  const allowed = ["name", "phone", "role", "status"];
  const entries = Object.entries(data).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  if (!entries.length) return findById(id);

  const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
  const params = entries.map(([, value]) => value);
  params.push(id);
  await query(`UPDATE users SET ${setClause} WHERE id = ?`, params);
  return findById(id);
}

async function deleteUser(id) {
  await query("DELETE FROM users WHERE id = ?", [id]);
}

async function ensureDefaultAdmin() {
  const existing = await findByEmail(env.defaultAdmin.email);
  const passwordHash = await bcrypt.hash(env.defaultAdmin.password, 10);

  if (!existing) {
    await query(
      "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'SUPER_ADMIN', 'ACTIVE')",
      ["System Administrator", env.defaultAdmin.email, passwordHash]
    );
    return;
  }

  const fullUser = await query("SELECT id, password_hash, role, status FROM users WHERE email = ? LIMIT 1", [
    env.defaultAdmin.email
  ]);
  const admin = fullUser[0];
  const passwordMatches = admin ? await bcrypt.compare(env.defaultAdmin.password, admin.password_hash) : false;

  if (!passwordMatches || admin.role !== "SUPER_ADMIN" || admin.status !== "ACTIVE") {
    await query(
      "UPDATE users SET password_hash = ?, role = 'SUPER_ADMIN', status = 'ACTIVE' WHERE email = ?",
      [passwordHash, env.defaultAdmin.email]
    );
  }
}

module.exports = {
  sanitize,
  createUser,
  findByEmail,
  findById,
  listUsers,
  updateUser,
  deleteUser,
  ensureDefaultAdmin
};
