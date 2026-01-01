import express from "express";
import { authenticate, generateToken, authMiddleware } from "./auth.js";
import { query } from "./db.js";
import {
  adjustmentSchema,
  hotelSchema,
  loginSchema,
  roomTypeSchema,
  validate,
} from "./validators.js";
import { computeEffectiveRate } from "./rates.js";

const router = express.Router();

const toDateTime = (input) =>
  new Date(input).toISOString().slice(0, 19).replace("T", " ");

router.post("/login", async (req, res, next) => {
  try {
    const payload = validate(loginSchema, req.body);
    const user = await authenticate(payload.username, payload.password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.use(authMiddleware);

router.get("/hotels", async (_req, res, next) => {
  try {
    const hotels = await query(
      "SELECT id, name, location, status, created_at FROM hotels ORDER BY id DESC"
    );
    res.json({ hotels });
  } catch (err) {
    next(err);
  }
});

router.post("/hotels", async (req, res, next) => {
  try {
    const payload = validate(hotelSchema, req.body);
    const status = payload.status || "active";
    const result = await query(
      "INSERT INTO hotels (name, location, status, created_at) VALUES (?, ?, ?, NOW())",
      [payload.name, payload.location, status]
    );
    res.status(201).json({ id: result.insertId, ...payload, status });
  } catch (err) {
    next(err);
  }
});

router.get("/hotels/:id", async (req, res, next) => {
  try {
    const hotels = await query(
      "SELECT id, name, location, status, created_at FROM hotels WHERE id = ?",
      [req.params.id]
    );
    const hotel = hotels[0];
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    const roomTypes = await query(
      "SELECT id, hotel_id, name, base_rate, created_at FROM room_types WHERE hotel_id = ? ORDER BY id",
      [req.params.id]
    );
    const roomTypesWithRates = await Promise.all(
      roomTypes.map((rt) => computeEffectiveRate(rt))
    );
    res.json({ hotel, room_types: roomTypesWithRates });
  } catch (err) {
    next(err);
  }
});

router.put("/hotels/:id", async (req, res, next) => {
  try {
    const payload = validate(hotelSchema.partial(), req.body);
    const existing = await query("SELECT id FROM hotels WHERE id = ?", [
      req.params.id,
    ]);
    if (!existing[0]) return res.status(404).json({ error: "Hotel not found" });

    const updates = [];
    const values = [];
    if (payload.name) {
      updates.push("name = ?");
      values.push(payload.name);
    }
    if (payload.location) {
      updates.push("location = ?");
      values.push(payload.location);
    }
    if (payload.status) {
      updates.push("status = ?");
      values.push(payload.status);
    }
    if (!updates.length) return res.json({ message: "No changes" });
    values.push(req.params.id);
    await query(`UPDATE hotels SET ${updates.join(", ")} WHERE id = ?`, values);
    const updated = await query(
      "SELECT id, name, location, status, created_at FROM hotels WHERE id = ?",
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/hotels/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM hotels WHERE id = ?", [
      req.params.id,
    ]);
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/hotels/:hotelId/room-types", async (req, res, next) => {
  try {
    const roomTypes = await query(
      "SELECT id, hotel_id, name, base_rate, created_at FROM room_types WHERE hotel_id = ? ORDER BY id",
      [req.params.hotelId]
    );
    const roomTypesWithRates = await Promise.all(
      roomTypes.map((rt) => computeEffectiveRate(rt))
    );
    res.json({ room_types: roomTypesWithRates });
  } catch (err) {
    next(err);
  }
});

router.post("/hotels/:hotelId/room-types", async (req, res, next) => {
  try {
    validate(roomTypeSchema, req.body);
    const hotel = await query("SELECT id FROM hotels WHERE id = ?", [
      req.params.hotelId,
    ]);
    if (!hotel[0]) return res.status(404).json({ error: "Hotel not found" });
    const result = await query(
      "INSERT INTO room_types (hotel_id, name, base_rate, created_at) VALUES (?, ?, ?, NOW())",
      [req.params.hotelId, req.body.name, req.body.base_rate]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    next(err);
  }
});

router.put("/room-types/:id", async (req, res, next) => {
  try {
    const payload = validate(roomTypeSchema.partial(), req.body);
    const existing = await query("SELECT id FROM room_types WHERE id = ?", [
      req.params.id,
    ]);
    if (!existing[0])
      return res.status(404).json({ error: "Room type not found" });

    const updates = [];
    const values = [];
    if (payload.name) {
      updates.push("name = ?");
      values.push(payload.name);
    }
    if (typeof payload.base_rate === "number") {
      updates.push("base_rate = ?");
      values.push(payload.base_rate);
    }
    if (!updates.length) return res.json({ message: "No changes" });
    values.push(req.params.id);
    await query(
      `UPDATE room_types SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    const updated = await query(
      "SELECT id, hotel_id, name, base_rate, created_at FROM room_types WHERE id = ?",
      [req.params.id]
    );
    const withRate = await computeEffectiveRate(updated[0]);
    res.json(withRate);
  } catch (err) {
    next(err);
  }
});

router.delete("/room-types/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM room_types WHERE id = ?", [
      req.params.id,
    ]);
    if (!result.affectedRows)
      return res.status(404).json({ error: "Room type not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/room-types/:id/adjustments", async (req, res, next) => {
  try {
    const adjustments = await query(
      "SELECT id, room_type_id, effective_date, adjustment_amount, reason, created_at FROM rate_adjustments WHERE room_type_id = ? ORDER BY effective_date DESC, id DESC",
      [req.params.id]
    );
    res.json({ adjustments });
  } catch (err) {
    next(err);
  }
});

router.post("/room-types/:id/adjustments", async (req, res, next) => {
  try {
    const payload = validate(adjustmentSchema, req.body);
    const roomType = await query("SELECT id FROM room_types WHERE id = ?", [
      req.params.id,
    ]);
    if (!roomType[0])
      return res.status(404).json({ error: "Room type not found" });
    const result = await query(
      "INSERT INTO rate_adjustments (room_type_id, effective_date, adjustment_amount, reason, created_at) VALUES (?, ?, ?, ?, NOW())",
      [
        req.params.id,
        toDateTime(payload.effective_date),
        payload.adjustment_amount,
        payload.reason,
      ]
    );
    res.status(201).json({ id: result.insertId, ...payload });
  } catch (err) {
    next(err);
  }
});

export default router;
