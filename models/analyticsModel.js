const { query } = require("../config/db");

async function getSummary() {
  const [users] = await query("SELECT COUNT(*) AS count FROM users WHERE role = 'USER'");
  const [appointments] = await query("SELECT COUNT(*) AS count FROM appointments");
  const [tokens] = await query("SELECT COUNT(*) AS count FROM tokens");
  const [departments] = await query("SELECT COUNT(*) AS count FROM departments WHERE status = 'ACTIVE'");
  return {
    total_users: Number(users.count),
    total_appointments: Number(appointments.count),
    total_tokens: Number(tokens.count),
    active_departments: Number(departments.count)
  };
}

async function departmentTraffic() {
  return query(
    `SELECT d.id, d.name, d.code,
            COUNT(DISTINCT t.id) AS token_count,
            COUNT(DISTINCT a.id) AS appointment_count
     FROM departments d
     LEFT JOIN tokens t ON t.department_id = d.id
     LEFT JOIN appointments a ON a.department_id = d.id
     GROUP BY d.id, d.name, d.code
     ORDER BY token_count DESC, appointment_count DESC`
  );
}

async function peakHours() {
  return query(
    `SELECT HOUR(created_at) AS hour, COUNT(*) AS total
     FROM tokens
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY HOUR(created_at)
     ORDER BY hour`
  );
}

async function weeklyTrends() {
  return query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS total
     FROM tokens
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date`
  );
}

async function monthlyTrends() {
  return query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
     FROM tokens
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY month`
  );
}

async function crowdPrediction(departmentId = null) {
  const params = [];
  let scope = "";
  if (departmentId) {
    scope = "AND department_id = ?";
    params.push(departmentId);
  }

  const [waiting] = await query(
    `SELECT COUNT(*) AS count FROM tokens WHERE status = 'WAITING' AND DATE(created_at) = CURDATE() ${scope}`,
    params
  );
  const [today] = await query(
    `SELECT COUNT(*) AS count FROM tokens WHERE DATE(created_at) = CURDATE() ${scope}`,
    params
  );
  const [historical] = await query(
    `SELECT AVG(hour_total) AS avg_hourly
     FROM (
       SELECT DATE(created_at) AS day, HOUR(created_at) AS hour, COUNT(*) AS hour_total
       FROM tokens
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ${scope}
       GROUP BY DATE(created_at), HOUR(created_at)
     ) history`,
    params
  );
  const [appointments] = await query(
    `SELECT COUNT(*) AS count
     FROM appointments
     WHERE appointment_date = CURDATE()
       AND status IN ('PENDING', 'APPROVED') ${scope}`,
    params
  );

  const waitingCount = Number(waiting.count);
  const avgHourly = Number(historical.avg_hourly || 0);
  const appointmentPressure = Number(appointments.count);
  const score = waitingCount + avgHourly + appointmentPressure * 0.5;
  const level = score >= 18 ? "High" : score >= 8 ? "Medium" : "Low";
  const waitMinutes = Math.round(waitingCount * 10 + avgHourly * 3 + appointmentPressure * 2);

  return {
    crowd_level: level,
    waiting_tokens: waitingCount,
    tokens_today: Number(today.count),
    expected_appointments_today: appointmentPressure,
    historical_hourly_average: Number(avgHourly.toFixed(2)),
    predicted_wait_minutes: waitMinutes
  };
}

module.exports = {
  getSummary,
  departmentTraffic,
  peakHours,
  weeklyTrends,
  monthlyTrends,
  crowdPrediction
};
