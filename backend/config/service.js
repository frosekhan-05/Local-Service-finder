// backend/config/service.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "kce",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection function
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ DB connected successfully");
    connection.release();
    return true;
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    return false;
  }
};

export default pool;