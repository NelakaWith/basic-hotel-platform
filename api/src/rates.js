import { query } from "./db.js";

function toDateTime(input) {
  return new Date(input).toISOString().slice(0, 19).replace("T", " ");
}

export async function latestAdjustment(roomTypeId, asOfDate = new Date()) {
  const rows = await query(
    `SELECT adjustment_amount, effective_date, reason
     FROM rate_adjustments
     WHERE room_type_id = ? AND effective_date <= ?
     ORDER BY effective_date DESC, id DESC
     LIMIT 1`,
    [roomTypeId, toDateTime(asOfDate)]
  );
  return rows[0] || null;
}

export async function computeEffectiveRate(roomType) {
  const latest = await latestAdjustment(roomType.id);
  const adjustment = latest ? Number(latest.adjustment_amount) : 0;
  return {
    ...roomType,
    base_rate: Number(roomType.base_rate),
    effective_rate: Number(roomType.base_rate) + adjustment,
    last_adjustment: latest,
  };
}
