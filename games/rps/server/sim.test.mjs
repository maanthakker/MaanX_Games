import assert from "node:assert/strict";
import { setupGame } from "./game.js";
const saved = [];
const User = { exists: async () => true,
  find: () => ({ select: async () => ["a", "b", "c", "d"].map((id) => ({ _id: id, username: id.toUpperCase(), look: {}, equipped: {} })) }),
  updateMany: async (q, u) => { saved.push([q._id.$in, u.$inc]); } };
let mw, onConn; const io = { use: (f) => (mw = f), on: (_, f) => (onConn = f) };
const game = setupGame(io, { User, verify: (t) => ({ id: t }) });
const socks = {};
async function connect(id) {
  const h = {}, s = { handshake: { auth: { token: id } }, data: {}, got: [], emit(ev, d) { s.got.push([ev, d]); }, on(ev, f) { h[ev] = f; }, disconnect() {}, fire: (ev, d) => h[ev](d) };
  await new Promise((r) => mw(s, r)); onConn(s); socks[id] = s; return s;
}
const last = (s, ev) => [...s.got].reverse().find((x) => x[0] === ev)?.[1];
const tick = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ["a", "b", "c", "d"]) await connect(id);

// 1v1 random queue -> match -> first to 5
socks.a.fire("queue", "solo"); socks.b.fire("queue", "solo");
await tick(1400);
assert.ok(last(socks.a, "match:start"), "match started");
for (let r = 0; r < 5; r++) {
  assert.equal(last(socks.a, "round:start").round, r + 1);
  socks.a.fire("pick", "rock"); socks.b.fire("pick", "scissors");
  if (r < 4) await tick(3300);
}
const end = last(socks.b, "match:end");
assert.equal(end.winner, last(socks.a, "match:start").myTeam);
assert.deepEqual(end.score.slice().sort(), [0, 5]);
await tick(10);
assert.deepEqual(saved[0], [["a"], { wins: 1, coins: 20 }]);
assert.deepEqual(saved[1], [["b"], { losses: 1 }]);

// duo: a+b team up via invite, c and d queue alone -> 2v2
assert.deepEqual(game.startInvite("a", "b", "duo"), { ok: true });
socks.c.fire("queue", "duo"); socks.d.fire("queue", "duo");
await tick(1400);
const ds = last(socks.c, "match:start");
assert.equal(ds.mode, "duo"); assert.equal(ds.teams[0].length, 2);
assert.deepEqual(ds.teams.map((t) => t.map((p) => p.id)), [["a", "b"], ["c", "d"]]);
// tie round gives no points; then c disconnects -> a+b win by forfeit
for (const id of "abcd") socks[id].fire("pick", "paper");
assert.deepEqual(last(socks.a, "round:result").score, [0, 0]);
socks.c.fire("disconnect");
const de = last(socks.a, "match:end");
assert.equal(de.winner, 0); assert.equal(de.reason, "left");
// busy players can't double-queue; invite to offline fails
assert.equal(game.startInvite("c", "a", "solo").ok, false);
socks.a.fire("queue", "solo"); socks.a.fire("queue", "solo");
assert.ok(socks.a.got.some((x) => x[0] === "error:msg"));
socks.a.fire("leaveQueue");
console.log("server match logic: all tests passed");
process.exit(0);
