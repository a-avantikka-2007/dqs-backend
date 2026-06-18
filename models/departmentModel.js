const { query } = require("../config/db");

async function listDepartments({ activeOnly = false } = {}) {
  const sql = activeOnly
    ? "SELECT * FROM departments WHERE status = 'ACTIVE' ORDER BY category, name"
    : "SELECT * FROM departments ORDER BY category, name";
  return query(sql);
}

async function findById(id) {
  const rows = await query("SELECT * FROM departments WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function createDepartment(data) {
  const result = await query(
    "INSERT INTO departments (name, code, category, average_service_minutes, status) VALUES (?, ?, ?, ?, ?)",
    [
      data.name,
      data.code.toUpperCase(),
      data.category,
      data.average_service_minutes || 10,
      data.status || "ACTIVE"
    ]
  );
  return findById(result.insertId);
}

async function updateDepartment(id, data) {
  const allowed = ["name", "code", "category", "average_service_minutes", "status"];
  const entries = Object.entries(data).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  if (!entries.length) return findById(id);

  const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
  const params = entries.map(([key, value]) => (key === "code" ? String(value).toUpperCase() : value));
  params.push(id);
  await query(`UPDATE departments SET ${setClause} WHERE id = ?`, params);
  return findById(id);
}

async function deleteDepartment(id) {
  await query("DELETE FROM departments WHERE id = ?", [id]);
}

module.exports = {
  listDepartments,
  findById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
