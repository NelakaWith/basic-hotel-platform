import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import router from "./routes.js";
import { ensureSchema } from "./schema.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

async function start() {
  await ensureSchema();

  app.get("/health", (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  app.use("/api", router);

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Unexpected error" });
  });

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
