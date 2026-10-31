import { useEffect, useState } from "react";
import { Fig, hand } from "./draw.jsx";
import { MOVES, TARGET } from "../../shared/game.js";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const names = (team) => team.map((p) => p.name).join(" & ");
const Pips = ({ n, them }) => (
  <div className={"pips" + (them ? " them" : "")} aria-hidden="true">
    {Array.from({ length: TARGET }, (_, i) => <i key={i} className={i < n ? "on" : ""} />)}
  </div>
);

export default function Match({ m, meId, onPick, onLeave, onAgain }) {
  const [now, setNow] = useState(Date.now());
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (m.phase !== "pick" || !m.deadline) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [m.phase, m.deadline]);

  const mine = m.teams[m.myTeam], theirs = m.teams[1 - m.myTeam];
  const my = m.score[m.myTeam], their = m.score[1 - m.myTeam];
  const won = m.phase === "end" && m.end.winner === m.myTeam;

  // What each character shows: countdown bob, revealed throw + mood, or the trophy lift.
  const view = (p) => {
    if (m.phase === "shake") return { state: "bob" };
    if (m.phase === "end") { const w = m.teams[m.end.winner].some((x) => x.id === p.id); return { state: w ? "win" : "lose", trophy: w }; }
    if (m.phase === "reveal" && m.last) {
      const d = m.last.duels.find((x) => x.a === p.id || x.b === p.id);
      if (!d) return {};
      const isA = d.a === p.id, r = isA ? d.r : -d.r;
      return { move: isA ? d.ma : d.mb, state: r > 0 ? "win" : r < 0 ? "lose" : "" };
    }
    return {};
  };

  let msg = "Get ready…", cls = "";
  if (m.phase === "pick") {
    const secs = m.deadline ? Math.max(0, Math.ceil((m.deadline - now) / 1000)) : null;
    msg = m.myPick ? `You picked ${cap(m.myPick)}. Waiting…` : `Round ${m.round}: pick a move${secs !== null ? ` · ${secs}s` : ""}`;
  } else if (m.phase === "shake") msg = "Rock… paper… scissors…";
  else if (m.phase === "reveal" && m.last) {
    const pts = [0, 0];
    m.last.duels.forEach((d) => { if (d.r > 0) pts[0]++; else if (d.r < 0) pts[1]++; });
    const a = pts[m.myTeam], b = pts[1 - m.myTeam];
    cls = a > b ? "win" : a < b ? "lose" : "";
    msg = m.mode === "duo" ? `Round ${m.last.round}: your team +${a}, them +${b}`
      : a ? "You win the round!" : b ? `${names(theirs)} wins the round` : "Tie! No point this round.";
  } else if (m.phase === "end") {
    cls = won ? "win" : "lose";
    msg = won ? "🏆 You lift the trophy!" : `🏆 ${names(theirs)} ${theirs.length > 1 ? "lift" : "lifts"} the trophy`;
  }

  const side = (team, flip) => (
    <div className="side">{team.map((p) => {
      const v = view(p);
      return (
        <div className="p" key={p.id}>
          <Fig spec={p.spec} label={p.id === meId ? "You" : p.name} flip={flip} move={v.move} state={v.state} trophy={v.trophy} />
          <small>{p.id === meId ? "You" : p.name}</small>
        </div>
      );
    })}</div>
  );

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", margin: "6px 0 10px" }}>
        <span className="muted">{m.practice ? `Practice vs ${m.practice.name}` : m.mode === "duo" ? "Duos · first to 5" : "1v1 · first to 5"}</span>
        {m.phase !== "end" && (m.practice
          ? <button className="btn" onClick={onLeave}>Quit</button>
          : sure ? <button className="btn pri" onClick={onLeave}>Confirm forfeit</button>
          : <button className="btn" onClick={() => setSure(true)}>Forfeit</button>)}
      </div>
      <section className="card">
        <div className="scorebar">
          <div><div className="nm">{m.mode === "duo" ? "Your team" : "You"}</div><b>{my}</b><Pips n={my} /></div>
          <span className="muted">first to {TARGET}</span>
          <div><div className="nm">{names(theirs)}</div><b>{their}</b><Pips n={their} them /></div>
        </div>
        <div className="stage">{side(mine, false)}<div className="vs">VS</div>{side(theirs, true)}</div>
        <p id="msg" className={cls} aria-live="polite">{msg}</p>
        {m.phase !== "end" ? (
          <div className="picks">{MOVES.map((mv) => (
            <button key={mv} className="pick" aria-pressed={m.myPick === mv} disabled={m.phase !== "pick" || !!m.myPick} onClick={() => onPick(mv)}>
              <svg viewBox="-16 -24 32 38" width="34" height="40" aria-hidden="true" dangerouslySetInnerHTML={{ __html: hand(mv, "#f3cfb0") }} />
              {cap(mv)}
            </button>
          ))}</div>
        ) : (
          <div className="endcard">
            <p className="big">{won ? "Victory!" : "Defeat"}</p>
            <p>{m.end.practice ? "Practice match, so no coins this time."
              : won ? <span className="coins">+{m.end.coins} coins 🪙</span> : `Win a match to earn ${m.end.coins} coins.`}</p>
            {m.end.reason !== "score" && <p className="muted">{won ? "The other side left the match." : "Your side left the match."}</p>}
            <div className="row" style={{ justifyContent: "center" }}>
              <button className="btn pri" onClick={onAgain}>{m.practice ? "Rematch" : "Find another match"}</button>
              <button className="btn" onClick={onLeave}>Home</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
