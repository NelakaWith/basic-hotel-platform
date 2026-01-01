import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  multipleStatements: true,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
