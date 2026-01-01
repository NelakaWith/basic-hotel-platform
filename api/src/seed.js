import bcrypt from "bcryptjs";
import { query } from "./db.js";
import { ensureSchema } from "./schema.js";

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

async function seedUsers() {
  const existing = await query("SELECT COUNT(*) as count FROM users");
  if (existing[0].count > 0) return;
  const hashed = bcrypt.hashSync("password123", 10);
  await query(
    "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
    ["admin", hashed, now()]
  );
}

async function seedHotels() {
  const hotelCountRows = await query("SELECT COUNT(*) as count FROM hotels");
  if (hotelCountRows[0].count > 0) return;

  const hotelResult = await query(
    "INSERT INTO hotels (name, location, status, created_at) VALUES (?, ?, 'active', ?)",
    ["Demo Hotel", "NYC", now()]
  );
  const hotelId = hotelResult.insertId;

  const deluxe = await query(
    "INSERT INTO room_types (hotel_id, name, base_rate, created_at) VALUES (?, ?, ?, ?)",
    [hotelId, "Deluxe", 180, now()]
  );
  const standard = await query(
    "INSERT INTO room_types (hotel_id, name, base_rate, created_at) VALUES (?, ?, ?, ?)",
    [hotelId, "Standard", 120, now()]
  );

  await query(
    "INSERT INTO rate_adjustments (room_type_id, effective_date, adjustment_amount, reason, created_at) VALUES (?, ?, ?, ?, ?)",
    [deluxe.insertId, now(), 20, "Peak season", now()]
  );
  await query(
    "INSERT INTO rate_adjustments (room_type_id, effective_date, adjustment_amount, reason, created_at) VALUES (?, ?, ?, ?, ?)",
    [standard.insertId, now(), -10, "Promo", now()]
  );
}

await ensureSchema();
await seedUsers();
await seedHotels();
console.log("Seed data applied (idempotent).");
process.exit(0);
