import { pool } from "./db.js";

export async function ensureSchema() {
  const conn = await pool.getConnection();
  try {
    await conn.query("SET time_zone = '+00:00';");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS room_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        base_rate DECIMAL(10,2) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_room_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS rate_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_type_id INT NOT NULL,
        effective_date DATETIME NOT NULL,
        adjustment_amount DECIMAL(10,2) NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_adjust_room FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    const indexStatements = [
      "CREATE INDEX idx_room_types_hotel ON room_types(hotel_id)",
      "CREATE INDEX idx_adjustments_room_type ON rate_adjustments(room_type_id, effective_date)",
    ];

    for (const sql of indexStatements) {
      try {
        await conn.query(sql);
      } catch (err) {
        if (err.code === "ER_DUP_KEYNAME") {
          continue; // index already exists
        }
        throw err;
      }
    }
  } finally {
    conn.release();
  }
}
