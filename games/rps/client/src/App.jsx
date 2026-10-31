import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, getToken, setToken } from "./api.js";
import { Fig, specFromUser, BOTS } from "./draw.jsx";
import Match from "./Match.jsx";
import Locker from "./Locker.jsx";
import { Friends, Notes } from "./Social.jsx";
import { BEATS, BEATEN_BY, TARGET, winnerOf } from "../../shared/game.js";

const TITLES = { locker: "Locker", friends: "Friends", notes: "Notifications", practice: "Practice" };

export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState("home");
  const [queue, setQueue] = useState(null);
  const [match, setMatch] = useState(null);
  const [pending, setPending] = useState(0);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState("");
  const sock = useRef(null), mref = useRef(null), timers = useRef([]), toastT = useRef();
  mref.current = match;

  const say = (t) => { setToast(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(""), 3500); };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const refresh = () => api("/me").then((d) => setMe(d.me)).catch(() => {});
  const loadPending = () => api("/notifications").then((d) => setPending(d.pending)).catch(() => {});

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api("/me").then((d) => setMe(d.me)).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  // Shared by online and practice matches: shake for 1.4s, then reveal.
  const showResult = (res) => {
    setMatch((m) => m && { ...m, phase: "shake" });
    later(() => setMatch((m) => m && { ...m, phase: "reveal", last: res, score: res.score }), 1400);
  };
  const showEnd = (e) => later(() => {
    setMatch((m) => {
      if (m && window.MaanX) window.MaanX.emit(e.winner === m.myTeam ? "rps:win" : "rps:loss", { mode: m.mode, practice: m.practice ? m.practice.id : null });
      return m && { ...m, phase: "end", end: e };
    });
    if (!e.practice) refresh();
  }, 3000);

  const uid = me?.id;
  useEffect(() => {
    if (!uid) return;
    loadPending();
    const s = io({ path: "/rps/socket.io", auth: { token: getToken() } });
    sock.current = s;
    s.on("connect_error", () => say("Can't reach the game server. Retrying…"));
    s.on("error:msg", say);
    s.on("notify", () => { loadPending(); setTick((t) => t + 1); });
    s.on("queue:status", (q) => setQueue((old) => ({ since: Date.now(), ...old, ...q })));
    s.on("queue:left", (msg) => { setQueue(null); if (msg) say(msg); });
    s.on("match:start", (m) => {
      clearTimers(); setQueue(null);
      setMatch({ id: m.id, mode: m.mode, myTeam: m.myTeam, score: m.score, round: m.round, phase: "wait",
        teams: m.teams.map((t) => t.map((p) => ({ id: p.id, name: p.name, spec: specFromUser(p) }))) });
      setScreen("match");
    });
    s.on("round:start", (r) => setMatch((m) => (m && !m.practice ? { ...m, round: r.round, phase: "pick", myPick: null, deadline: Date.now() + r.ms } : m)));
    s.on("round:result", (res) => { if (mref.current && !mref.current.practice) showResult(res); });
    s.on("match:end", (e) => { if (mref.current && !mref.current.practice) showEnd(e); });
    return () => { s.disconnect(); sock.current = null; };
  }, [uid]);

  const play = (mode) => {
    if (!sock.current?.connected) { say("Connecting to the game server… try again in a moment."); return; }
    setQueue({ mode, waiting: 1, since: Date.now() });
    sock.current.emit("queue", mode);
  };
  const cancelQueue = () => { sock.current?.emit("leaveQueue"); setQueue(null); };

  const practice = (bot) => {
    clearTimers();
    setMatch({ practice: bot, mode: "solo", myTeam: 0, score: [0, 0], round: 1, phase: "pick",
      teams: [[{ id: me.id, name: me.username, spec: specFromUser(me) }], [{ id: "bot", name: bot.name, spec: bot.look }]] });
    setScreen("match");
  };

  const pick = (mv) => {
    const m = mref.current;
    if (!m || m.phase !== "pick" || m.myPick) return;
    mref.current = { ...m, myPick: mv };
    setMatch(mref.current);
    if (!m.practice) { sock.current?.emit("pick", mv); return; }
    const win = Math.random() < m.practice.chance; // exact win chance, no ties
    const bm = win ? BEATS[mv] : BEATEN_BY[mv];
    const score = [m.score[0] + (win ? 1 : 0), m.score[1] + (win ? 0 : 1)];
    showResult({ round: m.round, duels: [{ a: me.id, b: "bot", ma: mv, mb: bm, r: win ? 1 : -1 }], score });
    const w = winnerOf(score, TARGET);
    if (w >= 0) showEnd({ winner: w, score, reason: "score", coins: 0, practice: true });
    else later(() => setMatch((x) => x && { ...x, round: x.round + 1, phase: "pick", myPick: null }), 3000);
  };

  const leave = () => {
    const m = mref.current;
    if (m && !m.practice && m.phase !== "end") sock.current?.emit("forfeit");
    clearTimers(); setMatch(null); setScreen("home");
  };
  const again = () => {
    const m = mref.current;
    clearTimers(); setMatch(null);
    if (m?.practice) practice(m.practice); else { setScreen("home"); play(m?.mode || "solo"); }
  };
  const logout = () => { setToken(null); setMe(null); setMatch(null); setQueue(null); setScreen("home"); };

  if (!ready) return <main className="wrap"><p className="muted" style={{ textAlign: "center" }}>Loading…</p></main>;
  if (!me) return <Auth onIn={(u) => { setScreen("home"); setMe(u); }} />;

  const inMatch = screen === "match" && match;
  return (
    <>
      {!inMatch && (
        <header className="top">
          {screen !== "home" ? <button className="pill" onClick={() => setScreen("home")} aria-label="Back">←</button>
            : <a className="pill" href="/" aria-label="Back to MaanX Games">MaanX</a>}
          <span className="grow">{TITLES[screen] || `Hi, ${me.username}`}</span>
          <span className="pill" aria-label={`${me.coins} coins`}>🪙 {me.coins}</span>
          <button className="pill bell" onClick={() => setScreen("notes")} aria-label={`Notifications${pending ? `, ${pending} new` : ""}`}>
            🔔{pending > 0 && <span className="badge">{pending}</span>}
          </button>
        </header>
      )}
      <main className="wrap">
        {inMatch ? <Match m={match} meId={me.id} onPick={pick} onLeave={leave} onAgain={again} />
          : screen === "locker" ? <Locker me={me} setMe={setMe} say={say} />
          : screen === "friends" ? <Friends say={say} tick={tick} />
          : screen === "notes" ? <Notes say={say} tick={tick} onCount={setPending} />
          : screen === "practice" ? <Practice onPick={practice} />
          : <Home me={me} go={setScreen} play={play} logout={logout} />}
      </main>
      {queue && <QueueBox q={queue} onCancel={cancelQueue} onPractice={() => { cancelQueue(); setScreen("practice"); }} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

function Auth({ onIn }) {
  const [mode, setMode] = useState("login"), [u, setU] = useState(""), [p, setP] = useState("");
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { const d = await api("/" + mode, { method: "POST", body: { username: u, password: p } }); setToken(d.token); onIn(d.me); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <main className="wrap">
      <h1>✊ Rock Paper Scissors ✌️</h1>
      <form className="card" onSubmit={submit}>
        <h2>{mode === "login" ? "Log in" : "Create your player"}</h2>
        <label className="field">Name<input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" maxLength={16} required /></label>
        <label className="field">Password<input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} maxLength={72} required /></label>
        <p className="err" role="alert">{err}</p>
        <button className="btn pri" style={{ width: "100%" }} disabled={busy}>{busy ? "…" : mode === "login" ? "Log in" : "Create player"}</button>
        <p style={{ textAlign: "center", margin: "10px 0 0" }}>
          <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
            {mode === "login" ? "New here? Create a player" : "Already have a player? Log in"}
          </button>
        </p>
        {mode === "register" && <p className="muted">Friends find you by this name: 3–16 letters, numbers or _.</p>}
      </form>
    </main>
  );
}

function Home({ me, go, play, logout }) {
  const [top, setTop] = useState(null);
  useEffect(() => { api("/leaderboard").then((d) => setTop(d.top)).catch(() => setTop([])); }, []);
  return (
    <>
      <section className="card hero">
        <Fig spec={specFromUser(me)} label="Your character" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: "1.2rem" }}>{me.username}</b>
          <div className="stat">
            <div><b>{me.wins}</b><span>🏆 Wins</span></div>
            <div><b>{me.losses}</b><span>Losses</span></div>
            <div><b>{me.inventory.length}</b><span>Items</span></div>
          </div>
          <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={() => go("locker")}>🎨 Locker & boxes</button>
        </div>
      </section>
      <section className="card">
        <h2>Play</h2>
        <button className="btn pri big" onClick={() => play("solo")}><span className="em">⚔️</span><span>Play vs random<small>1v1 · first to 5 · winner gets 20 coins</small></span></button>
        <button className="btn big" onClick={() => play("duo")}><span className="em">👯</span><span>Duos vs random<small>2v2 · first to 5 · each winner gets 20 coins</small></span></button>
        <button className="btn big" onClick={() => go("friends")}><span className="em">🤝</span><span>Play with friends<small>Find a friend by name and invite them</small></span></button>
        <button className="btn big" onClick={() => go("practice")}><span className="em">🤖</span><span>Practice vs bots<small>Pick a difficulty · no coins</small></span></button>
      </section>
      <section className="card">
        <h2>🏆 Top players</h2>
        {top === null ? <p className="muted">Loading…</p> : top.length === 0 ? <p className="muted">No match wins yet. Be the first!</p> : (
          <ol className="lb">{top.map((u, i) => (
            <li key={u.id} className={u.id === me.id ? "me" : ""}><span>{["🥇", "🥈", "🥉"][i] || i + 1}</span><span>{u.username} <em>{u.losses} losses</em></span><b>🏆 {u.wins}</b></li>
          ))}</ol>
        )}
      </section>
      <p style={{ textAlign: "center" }}><button className="link" onClick={logout}>Log out</button></p>
    </>
  );
}

function Practice({ onPick }) {
  return (
    <section className="card">
      <h2>Choose your opponent</h2>
      <p className="muted" style={{ marginTop: -4 }}>First to 5. Each bot gives you a fixed chance to win every round, with no ties. Practice doesn't pay coins.</p>
      <div className="bots">{BOTS.map((b) => (
        <button key={b.id} className="bot" style={{ "--c": b.color }} onClick={() => onPick(b)}>
          <span className="em" aria-hidden="true">{b.emoji}</span>
          <span><b>{b.name}</b><span className="tag">{b.label}</span><small>{b.line}</small></span>
          <span className="pct">{Math.round(b.chance * 100)}%<small style={{ display: "block", fontSize: ".7rem", color: "var(--mute)" }}>you win</small></span>
        </button>
      ))}</div>
    </section>
  );
}

function QueueBox({ q, onCancel, onPractice }) {
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const secs = Math.floor((Date.now() - q.since) / 1000), need = q.mode === "duo" ? 4 : 2;
  return (
    <div className="overlay">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="qt">
        <div className="spin" aria-hidden="true">🔎</div>
        <h2 id="qt">{q.mode === "duo" ? "Finding a duos match…" : "Finding an opponent…"}</h2>
        <p className="muted">{Math.min(q.waiting || 1, need)} of {need} players ready · {secs}s</p>
        {secs >= 20 && <p className="muted">Nobody else is searching right now. Keep waiting, or practice against a bot.</p>}
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          {secs >= 20 && <button className="btn pri" onClick={onPractice}>Practice vs bots</button>}
        </div>
      </div>
    </div>
  );
}
