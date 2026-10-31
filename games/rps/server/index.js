// Rock Paper Scissors API, Socket.IO match engine and built React client, mounted by the
// MaanX server under /rps. The MaanX server owns the HTTP server and the Mongo connection.
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { User, Note } from "./models.js";
import { setupGame } from "./game.js";
import { ITEM_BY_ID, BOX_PRICE, DUP_REFUND, rollItem, SKINS, HAIR_STYLES, HAIR_COLORS } from "../shared/catalog.js";

export function mountRps({ server, jwtSecret, dbReady }) {
const JWT_SECRET = jwtSecret;
const INVITE_MS = 2 * 60 * 1000;
const NAME = /^[A-Za-z0-9_]{3,16}$/;
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "../client/dist");

const app = express.Router();
const io = new Server(server, { path: "/rps/socket.io" });
const verify = (t) => jwt.verify(t, JWT_SECRET);
const game = setupGame(io, { User, verify });

app.use(express.json({ limit: "10kb" }));
app.use("/api", (req, res, next) => (dbReady() || req.path === "/health" ? next() : fail(res, 503, "Online play is offline: the game database isn't connected.")));

const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (res, code, error) => res.status(code).json({ error });
const sign = (u) => jwt.sign({ id: String(u._id) }, JWT_SECRET, { expiresIn: "30d" });
const byName = (name) => (typeof name === "string" && NAME.test(name.trim()) ? User.findOne({ usernameLower: name.trim().toLowerCase() }) : null);
const meView = (u) => ({ id: String(u._id), username: u.username, coins: u.coins, wins: u.wins, losses: u.losses, look: u.look, equipped: u.equipped, inventory: u.inventory });
const pubView = (u) => ({ id: String(u._id), username: u.username, wins: u.wins, losses: u.losses, look: u.look, equipped: u.equipped, online: game.isOnline(String(u._id)) });
const makeFriends = (a, b) => Promise.all([
  User.updateOne({ _id: a }, { $addToSet: { friends: b } }),
  User.updateOne({ _id: b }, { $addToSet: { friends: a } }),
]);

const auth = h(async (req, res, next) => {
  let id;
  try { ({ id } = verify((req.headers.authorization || "").replace(/^Bearer /, ""))); } catch { return fail(res, 401, "Please log in again."); }
  req.user = await User.findById(id);
  if (!req.user) return fail(res, 401, "Please log in again.");
  next();
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/register", h(async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || !NAME.test(username.trim())) return fail(res, 400, "Names are 3–16 letters, numbers or _.");
  if (typeof password !== "string" || password.length < 6 || password.length > 72) return fail(res, 400, "Passwords need 6–72 characters.");
  try {
    const u = await User.create({ username: username.trim(), usernameLower: username.trim().toLowerCase(), passwordHash: await bcrypt.hash(password, 10) });
    res.json({ token: sign(u), me: meView(u) });
  } catch (e) { if (e.code === 11000) return fail(res, 409, "That name is taken."); throw e; }
}));

app.post("/api/login", h(async (req, res) => {
  const { username, password } = req.body || {};
  const u = await byName(username);
  if (!u || typeof password !== "string" || !(await bcrypt.compare(password, u.passwordHash))) return fail(res, 401, "Wrong name or password.");
  res.json({ token: sign(u), me: meView(u) });
}));

app.get("/api/me", auth, (req, res) => res.json({ me: meView(req.user) }));

app.put("/api/me/look", auth, h(async (req, res) => {
  const { skin, hair, hairColor } = req.body || {};
  const ok = Number.isInteger(skin) && skin >= 0 && skin < SKINS.length && HAIR_STYLES.includes(hair)
    && Number.isInteger(hairColor) && hairColor >= 0 && hairColor < HAIR_COLORS.length;
  if (!ok) return fail(res, 400, "That look isn't available.");
  req.user.look = { skin, hair, hairColor };
  await req.user.save();
  res.json({ me: meView(req.user) });
}));

app.put("/api/me/equip", auth, h(async (req, res) => {
  const it = ITEM_BY_ID[req.body?.itemId];
  if (!it || !req.user.inventory.includes(it.id)) return fail(res, 400, "You don't own that item.");
  req.user.equipped[it.slot] = it.id;
  await req.user.save();
  res.json({ me: meView(req.user) });
}));

app.post("/api/box/open", auth, h(async (req, res) => {
  const paid = await User.findOneAndUpdate({ _id: req.user._id, coins: { $gte: BOX_PRICE } }, { $inc: { coins: -BOX_PRICE } }, { new: true });
  if (!paid) return fail(res, 400, `You need ${BOX_PRICE} coins to open a mystery box.`);
  const item = rollItem();
  const duplicate = paid.inventory.includes(item.id);
  const u = await User.findByIdAndUpdate(paid._id, duplicate ? { $inc: { coins: DUP_REFUND } } : { $addToSet: { inventory: item.id } }, { new: true });
  res.json({ item, duplicate, refund: duplicate ? DUP_REFUND : 0, me: meView(u) });
}));

app.get("/api/users/:name", auth, h(async (req, res) => {
  const u = await byName(req.params.name);
  if (!u) return fail(res, 404, "No player with that name.");
  res.json({ user: { ...pubView(u), isMe: u._id.equals(req.user._id), isFriend: req.user.friends.some((f) => f.equals(u._id)) } });
}));

app.get("/api/friends", auth, h(async (req, res) => {
  const list = await User.find({ _id: { $in: req.user.friends } }).select("username wins losses look equipped");
  res.json({ friends: list.map(pubView).sort((a, b) => b.online - a.online || b.wins - a.wins) });
}));

app.post("/api/friends/request", auth, h(async (req, res) => {
  const t = await byName(req.body?.username);
  if (!t) return fail(res, 404, "No player with that name.");
  if (t._id.equals(req.user._id)) return fail(res, 400, "That's you!");
  if (req.user.friends.some((f) => f.equals(t._id))) return fail(res, 400, `You're already friends with ${t.username}.`);
  const theirs = await Note.findOne({ to: req.user._id, from: t._id, type: "friend", status: "pending" });
  if (theirs) { // they already asked: accept straight away
    await makeFriends(req.user._id, t._id);
    theirs.status = "accepted"; await theirs.save();
    game.emitTo(String(t._id), "notify");
    return res.json({ ok: true, message: `You and ${t.username} are now friends.` });
  }
  if (!(await Note.exists({ to: t._id, from: req.user._id, type: "friend", status: "pending" })))
    await Note.create({ to: t._id, from: req.user._id, fromName: req.user.username, type: "friend" });
  game.emitTo(String(t._id), "notify");
  res.json({ ok: true, message: `Friend request sent to ${t.username}.` });
}));

app.post("/api/invite", auth, h(async (req, res) => {
  const mode = req.body?.mode === "duo" ? "duo" : "solo";
  const t = await byName(req.body?.username);
  if (!t) return fail(res, 404, "No player with that name.");
  if (t._id.equals(req.user._id)) return fail(res, 400, "You can't invite yourself.");
  if (!game.isOnline(String(t._id))) return fail(res, 400, `${t.username} is offline right now.`);
  await Note.updateMany({ to: t._id, from: req.user._id, type: "invite", status: "pending" }, { status: "expired" });
  await Note.create({ to: t._id, from: req.user._id, fromName: req.user.username, type: "invite", mode });
  game.emitTo(String(t._id), "notify");
  res.json({ ok: true, message: `Invite sent. ${t.username} will find it in notifications.` });
}));

app.get("/api/notifications", auth, h(async (req, res) => {
  const list = await Note.find({ to: req.user._id }).sort({ createdAt: -1 }).limit(30);
  const items = list.map((n) => ({ id: String(n._id), type: n.type, mode: n.mode, fromName: n.fromName, status: n.status, createdAt: n.createdAt,
    expired: n.type === "invite" && n.status === "pending" && Date.now() - n.createdAt > INVITE_MS }));
  res.json({ items, pending: items.filter((i) => i.status === "pending" && !i.expired).length });
}));

app.post("/api/notifications/:id/respond", auth, h(async (req, res) => {
  const n = await Note.findOne({ _id: req.params.id, to: req.user._id, status: "pending" });
  if (!n) return fail(res, 404, "That notification is no longer active.");
  if (!req.body?.accept) { n.status = "declined"; await n.save(); return res.json({ ok: true }); }
  if (n.type === "friend") {
    await makeFriends(n.from, n.to);
    n.status = "accepted"; await n.save();
    game.emitTo(String(n.from), "notify");
    return res.json({ ok: true, message: `You and ${n.fromName} are now friends.` });
  }
  if (Date.now() - n.createdAt > INVITE_MS) { n.status = "expired"; await n.save(); return fail(res, 400, "That invite expired."); }
  const r = game.startInvite(String(n.from), String(req.user._id), n.mode);
  if (!r.ok) return fail(res, 400, r.error);
  n.status = "accepted"; await n.save();
  res.json({ ok: true });
}));

app.get("/api/leaderboard", auth, h(async (req, res) => {
  const top = await User.find({ wins: { $gt: 0 } }).sort({ wins: -1, losses: 1 }).limit(20).select("username wins losses");
  res.json({ top: top.map((u) => ({ id: String(u._id), username: u.username, wins: u.wins, losses: u.losses })) });
}));

app.use("/api", (req, res) => fail(res, 404, "Not found."));
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
app.use((err, req, res, next) => {
  if (err.name === "CastError") return fail(res, 404, "Not found.");
  if (err.type === "entity.parse.failed") return fail(res, 400, "Bad request.");
  console.error(err);
  fail(res, 500, "Something went wrong on the server.");
});

return app;
}
