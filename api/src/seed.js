import bcrypt from "bcryptjs";
import { query } from "./db.js";
import { ensureSchema } from "./schema.js";

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const toSql = (date) => date.toISOString().slice(0, 19).replace("T", " ");
const daysFromNow = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

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
  const hotels = [
    {
      name: "Harborview Suites",
      location: "San Francisco, CA",
      status: "active",
      roomTypes: [
        {
          name: "Bay Deluxe",
          baseRate: 240,
          adjustments: [
            {
              amount: 35,
              effectiveOffset: -45,
              reason: "Dreamforce citywide conference",
            },
            {
              amount: -20,
              effectiveOffset: 15,
              reason: "Post-event softening",
            },
          ],
        },
        {
          name: "Urban Studio",
          baseRate: 190,
          adjustments: [
            {
              amount: 15,
              effectiveOffset: -10,
              reason: "Fleet Week demand",
            },
          ],
        },
      ],
    },
    {
      name: "Lakeside Resort",
      location: "Lake Tahoe, NV",
      status: "active",
      roomTypes: [
        {
          name: "Alpine King",
          baseRate: 210,
          adjustments: [
            {
              amount: 40,
              effectiveOffset: 60,
              reason: "Holiday ski season",
            },
          ],
        },
        {
          name: "Family Suite",
          baseRate: 260,
          adjustments: [
            {
              amount: -25,
              effectiveOffset: -5,
              reason: "Mid-week occupancy boost",
            },
          ],
        },
      ],
    },
    {
      name: "Desert Bloom Hotel",
      location: "Phoenix, AZ",
      status: "inactive",
      roomTypes: [
        {
          name: "Garden Queen",
          baseRate: 150,
          adjustments: [
            {
              amount: 10,
              effectiveOffset: -20,
              reason: "Spring training visitors",
            },
          ],
        },
      ],
    },
  ];

  for (const hotel of hotels) {
    const existingHotel = await query(
      "SELECT id FROM hotels WHERE name = ? LIMIT 1",
      [hotel.name]
    );
    let hotelId;
    if (existingHotel.length) {
      hotelId = existingHotel[0].id;
      await query("UPDATE hotels SET location = ?, status = ? WHERE id = ?", [
        hotel.location,
        hotel.status,
        hotelId,
      ]);
    } else {
      const hotelResult = await query(
        "INSERT INTO hotels (name, location, status, created_at) VALUES (?, ?, ?, ?)",
        [hotel.name, hotel.location, hotel.status, now()]
      );
      hotelId = hotelResult.insertId;
    }

    for (const roomType of hotel.roomTypes) {
      const existingRoom = await query(
        "SELECT id FROM room_types WHERE hotel_id = ? AND name = ? LIMIT 1",
        [hotelId, roomType.name]
      );
      let roomId;
      if (existingRoom.length) {
        roomId = existingRoom[0].id;
        await query("UPDATE room_types SET base_rate = ? WHERE id = ?", [
          roomType.baseRate,
          roomId,
        ]);
        await query("DELETE FROM rate_adjustments WHERE room_type_id = ?", [
          roomId,
        ]);
      } else {
        const roomResult = await query(
          "INSERT INTO room_types (hotel_id, name, base_rate, created_at) VALUES (?, ?, ?, ?)",
          [hotelId, roomType.name, roomType.baseRate, now()]
        );
        roomId = roomResult.insertId;
      }

      for (const adjustment of roomType.adjustments) {
        await query(
          "INSERT INTO rate_adjustments (room_type_id, effective_date, adjustment_amount, reason, created_at) VALUES (?, ?, ?, ?, ?)",
          [
            roomId,
            toSql(daysFromNow(adjustment.effectiveOffset)),
            adjustment.amount,
            adjustment.reason,
            now(),
          ]
        );
      }
    }
  }
}

await ensureSchema();
await seedUsers();
await seedHotels();
console.log("Seed data applied (idempotent).");
process.exit(0);
