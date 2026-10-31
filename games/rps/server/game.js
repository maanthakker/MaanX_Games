// Real-time matches over Socket.IO. Queues and live matches live in memory;
// results (wins, losses, coins) are written to MongoDB when a match ends.
import { MOVES, TARGET, resolveRound, winnerOf, formDuoTeams } from "../shared/game.js";
import { WIN_COINS } from "../shared/catalog.js";

const PICK_MS = 15000;   // time to pick before a random move is chosen for you
const REVEAL_MS = 3200;  // pause between rounds so clients can play the reveal

export function setupGame(io, { User, verify }) {
  const sockets = new Map();               // uid -> socket
  const busy = new Map();                  // uid -> "q:solo" | "q:duo" | matchId
  const queues = { solo: [], duo: [] };    // arrays of groups: [uid] or [uid, uid]
  const matches = new Map();

  const emitTo = (uid, ev, data) => sockets.get(uid)?.emit(ev, data);
  const idsOf = (m) => m.teams.flat();
  const teamOf = (m, uid) => (m.teams[0].includes(uid) ? 0 : 1);
  const matchOf = (uid) => matches.get(busy.get(uid));

  io.use(async (socket, next) => {
    try {
      const { id } = verify(socket.handshake.auth?.token);
      if (!(await User.exists({ _id: id }))) throw new Error();
      socket.data.uid = id;
      next();
    } catch { next(new Error("Please log in again")); }
  });

  io.on("connection", (socket) => {
    const uid = socket.data.uid;
    const old = sockets.get(uid);
    sockets.set(uid, socket);
    if (old && old !== socket) { old.emit("error:msg", "You opened the game somewhere else."); old.disconnect(true); }

    const m = matchOf(uid); // reconnect into a running match
    if (m) { socket.emit("match:start", startPayload(m, uid)); if (m.phase === "pick") socket.emit("round:start", { round: m.round, ms: Math.max(0, m.deadline - Date.now()) }); }

    socket.on("queue", (mode) => enqueue([uid], mode === "duo" ? "duo" : "solo"));
    socket.on("leaveQueue", () => leaveQueue(uid));
    socket.on("pick", (move) => pick(uid, move));
    socket.on("forfeit", () => { const mm = matchOf(uid); if (mm) end(mm, 1 - teamOf(mm, uid), "forfeit"); });
    socket.on("disconnect", () => {
      if (sockets.get(uid) !== socket) return; // replaced by a newer tab
      sockets.delete(uid);
      leaveQueue(uid);
      const mm = matchOf(uid);
      if (mm) end(mm, 1 - teamOf(mm, uid), "left");
    });
  });

  function enqueue(group, mode) {
    if (group.some((u) => busy.has(u))) { emitTo(group[0], "error:msg", "You're already in a game or queue."); return false; }
    queues[mode].push(group);
    group.forEach((u) => busy.set(u, "q:" + mode));
    tryMatch(mode);
    broadcastQueue(mode);
    return true;
  }

  function broadcastQueue(mode) {
    const waiting = queues[mode].reduce((n, g) => n + g.length, 0);
    queues[mode].flat().forEach((u) => emitTo(u, "queue:status", { mode, waiting }));
  }

  function leaveQueue(uid) {
    const where = busy.get(uid);
    if (!where?.startsWith("q:")) return;
    const mode = where.slice(2), q = queues[mode], i = q.findIndex((g) => g.includes(uid));
    if (i < 0) return;
    const [group] = q.splice(i, 1);
    group.forEach((u) => { busy.delete(u); emitTo(u, "queue:left", u === uid ? null : "Your teammate left the queue."); });
    broadcastQueue(mode);
  }

  function tryMatch(mode) {
    const q = queues[mode];
    if (mode === "solo") { while (q.length >= 2) start([q.shift(), q.shift()], "solo"); return; }
    for (let r = formDuoTeams(q); r; r = formDuoTeams(q)) {
      [...r.used].sort((a, b) => b - a).forEach((i) => q.splice(i, 1));
      start(r.teams, "duo");
    }
  }

  function startPayload(m, uid) {
    return { id: m.id, mode: m.mode, target: TARGET, score: m.score, round: m.round, myTeam: teamOf(m, uid),
      teams: m.teams.map((t) => t.map((u) => m.info[u])) };
  }

  async function start(teams, mode) {
    const id = Math.random().toString(36).slice(2, 10);
    const ids = teams.flat();
    ids.forEach((u) => busy.set(u, id));
    const m = { id, mode, teams, info: {}, score: [0, 0], round: 0, picks: {}, timer: null, phase: "starting" };
    matches.set(id, m);
    try {
      const users = await User.find({ _id: { $in: ids } }).select("username look equipped");
      users.forEach((u) => { m.info[String(u._id)] = { id: String(u._id), name: u.username, look: u.look, equipped: u.equipped }; });
    } catch (e) { console.error("match start failed", e); }
    if (!matches.has(id)) return; // someone left while loading
    ids.forEach((u) => { m.info[u] ||= { id: u, name: "Player" }; emitTo(u, "match:start", startPayload(m, u)); });
    m.timer = setTimeout(() => nextRound(m), 1200);
  }

  function nextRound(m) {
    if (!matches.has(m.id)) return;
    m.round++; m.picks = {}; m.phase = "pick"; m.deadline = Date.now() + PICK_MS;
    m.timer = setTimeout(() => resolve(m), PICK_MS);
    idsOf(m).forEach((u) => emitTo(u, "round:start", { round: m.round, ms: PICK_MS }));
  }

  function pick(uid, move) {
    const m = matchOf(uid);
    if (!m || m.phase !== "pick" || !MOVES.includes(move) || m.picks[uid]) return;
    m.picks[uid] = move;
    if (idsOf(m).every((u) => m.picks[u])) { clearTimeout(m.timer); resolve(m); }
  }

  function resolve(m) {
    if (m.phase !== "pick" || !matches.has(m.id)) return;
    m.phase = "reveal";
    idsOf(m).forEach((u) => { m.picks[u] ||= MOVES[Math.floor(Math.random() * 3)]; }); // timed out
    const { pts, duels } = resolveRound(m.teams, m.picks);
    m.score = [m.score[0] + pts[0], m.score[1] + pts[1]];
    idsOf(m).forEach((u) => emitTo(u, "round:result", { round: m.round, duels, score: m.score }));
    const w = winnerOf(m.score, TARGET);
    if (w >= 0) end(m, w, "score");
    else m.timer = setTimeout(() => nextRound(m), REVEAL_MS);
  }

  function end(m, winner, reason) {
    if (!matches.has(m.id)) return;
    clearTimeout(m.timer);
    matches.delete(m.id);
    idsOf(m).forEach((u) => { busy.delete(u); emitTo(u, "match:end", { winner, score: m.score, reason, coins: WIN_COINS }); });
    Promise.all([
      User.updateMany({ _id: { $in: m.teams[winner] } }, { $inc: { wins: 1, coins: WIN_COINS } }),
      User.updateMany({ _id: { $in: m.teams[1 - winner] } }, { $inc: { losses: 1 } }),
    ]).catch((e) => console.error("saving result failed", e));
  }

  // Called when someone accepts an invite from the notifications list.
  function startInvite(from, to, mode) {
    if (!sockets.has(from)) return { ok: false, error: "They're offline now." };
    if (!sockets.has(to)) return { ok: false, error: "Open the game first, then accept." };
    if (busy.has(from) || busy.has(to)) return { ok: false, error: "One of you is already in a game or queue." };
    if (mode === "duo") enqueue([from, to], "duo"); // team up, then find two opponents
    else start([[from], [to]], "solo");
    return { ok: true };
  }

  return { emitTo, startInvite, isOnline: (uid) => sockets.has(uid) };
}
