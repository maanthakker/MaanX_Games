// MaanX Games: one Node process serving the marketplace and every game.
//   /                      marketplace (web/)
//   /maanx/bridge.js       progress bridge loaded inside each game
//   /rps/...               Rock Paper Scissors (React client, REST API, Socket.IO)
//   /voxelrealms/...       Voxel Realms (lobby, game, REST API, WebSocket)
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import express from "express";
import mongoose from "mongoose";
import { WebSocketServer } from "ws";
import { mountRps } from "./games/rps/server/index.js";

const require = createRequire(import.meta.url);
const store = require("./games/voxel-realms/lib/store.cjs");
const rooms = require("./games/voxel-realms/lib/rooms.cjs");

const root = path.dirname(fileURLToPath(import.meta.url));
const { PORT = 3000, NODE_ENV } = process.env;
const MONGODB_URI = process.env.MONGODB_URI || (NODE_ENV === "production" ? "" : "mongodb://127.0.0.1:27017/maanx-games");
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === "production" ? "" : "dev-only-secret");
if (!JWT_SECRET) { console.error("Set JWT_SECRET (see .env.example)."); process.exit(1); }

let dbUp = false;
const app = express();
const server = http.createServer(app);
app.disable("x-powered-by");

app.get("/api/health", (req, res) => res.json({ ok: true, db: dbUp }));

/* ---------- shared assets ---------- */
app.use("/maanx", express.static(path.join(root, "web/maanx"), { maxAge: "1h" }));
app.get("/vendor/three.min.js", (req, res) => res.sendFile(require.resolve("three/build/three.min.js"), { maxAge: "30d" }));

/* ---------- Rock Paper Scissors ---------- */
app.use("/rps", mountRps({ server, jwtSecret: JWT_SECRET, dbReady: () => dbUp }));

/* ---------- Voxel Realms ---------- */
const vr = express.Router();
const vrDir = path.join(root, "games/voxel-realms/public");
vr.use("/api", express.json());
vr.post("/api/worlds", async (req, res, next) => {
  try { res.json({ code: (await rooms.createWorld()).code }); } catch (e) { next(e); }
});
vr.get("/api/worlds/:code", async (req, res, next) => {
  try {
    const code = rooms.cleanCode(req.params.code);
    if (!(await store.getWorld(code))) return res.status(404).json({ error: "World not found" });
    res.json({ code, online: rooms.online(code) });
  } catch (e) { next(e); }
});
vr.get("/play/:room", (req, res) => res.sendFile(path.join(vrDir, "play.html")));
vr.use(express.static(vrDir, { index: "lobby.html" }));
app.use("/voxelrealms", (req, res, next) => (req.path === "" ? res.redirect("/voxelrealms/") : next()), vr);

const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
wss.on("connection", rooms.onConnection);
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/voxelrealms/ws?")) wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  // Socket.IO (/rps/socket.io) handles its own upgrades.
});

/* ---------- marketplace ---------- */
app.use(express.static(path.join(root, "web"), { extensions: ["html"] }));
app.get(["/game/:id", "/library", "/achievements", "/quests", "/profile", "/search"], (req, res) => res.sendFile(path.join(root, "web/index.html")));
app.use((req, res) => res.status(404).sendFile(path.join(root, "web/index.html")));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: "Something went wrong on the server." }); });

/* ---------- database, then listen ---------- */
async function connectDb() {
  if (!MONGODB_URI) return console.warn("> No MONGODB_URI: Voxel Realms uses in-memory worlds, Rock Paper Scissors online play is off.");
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    dbUp = true;
    store.useDatabase(true);
    console.log("> MongoDB connected");
  } catch (e) {
    console.warn(`> MongoDB unavailable (${e.message}). Voxel Realms uses in-memory worlds; Rock Paper Scissors online play is off.`);
  }
}
mongoose.connection.on("disconnected", () => { dbUp = false; });
mongoose.connection.on("reconnected", () => { dbUp = true; });

const shutdown = async () => { await rooms.flushAll().catch(() => {}); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await connectDb();
server.listen(PORT, () => console.log(`> MaanX Games on http://localhost:${PORT}`));
