require("dotenv").config();

const env = {
  port: Number(process.env.PORT || 5055),
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "digital_queue_system",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    timezone: "Z"
  },
  jwtSecret: process.env.JWT_SECRET || "digital_queue_system_local_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3055",
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || "admin@digitalqueue.com",
    password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123"
  }
};

module.exports = env;
