import { useEffect, useState } from "react";
import { api } from "./api.js";
import { Fig, specFromUser } from "./draw.jsx";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const ago = (t) => {
  const s = Math.round((Date.now() - new Date(t)) / 1000);
  return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
};

function PlayerCard({ u, onAdd, onInvite }) {
  return (
    <div className="pcard">
      <Fig spec={specFromUser(u)} label={u.username} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{u.username}</b>{u.isMe && <span className="muted"> (you)</span>}
        <div className="muted"><span className={"dot" + (u.online ? " on" : "")} />{u.online ? "Online" : "Offline"} · 🏆 {u.wins} wins · {u.losses} losses</div>
        {!u.isMe && (
          <div className="row" style={{ marginTop: 8 }}>
            {onAdd && !u.isFriend && <button className="btn" onClick={() => onAdd(u.username)}>➕ Add friend</button>}
            <button className="btn pri" disabled={!u.online} onClick={() => onInvite(u.username, "solo")}>⚔️ 1v1</button>
            <button className="btn" disabled={!u.online} onClick={() => onInvite(u.username, "duo")}>👯 Team up</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Friends({ say, tick }) {
  const [q, setQ] = useState(""), [found, setFound] = useState(null), [list, setList] = useState(null), [busy, setBusy] = useState(false);
  const load = () => api("/friends").then((d) => setList(d.friends)).catch((e) => say(e.message));
  useEffect(() => { load(); }, [tick]);
  const find = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true); setFound(null);
    try { setFound((await api("/users/" + encodeURIComponent(q.trim()))).user); } catch (x) { say(x.message); } finally { setBusy(false); }
  };
  const add = async (name) => { try { say((await api("/friends/request", { method: "POST", body: { username: name } })).message); load(); } catch (x) { say(x.message); } };
  const invite = async (name, mode) => { try { say((await api("/invite", { method: "POST", body: { username: name, mode } })).message); } catch (x) { say(x.message); } };
  return (
    <>
      <form className="card" onSubmit={find}>
        <h2>Find a player</h2>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type their name" aria-label="Player name" maxLength={16} />
          <button className="btn pri" disabled={busy}>Find</button>
        </div>
        {found && <div style={{ marginTop: 14 }}><PlayerCard u={found} onAdd={add} onInvite={invite} /></div>}
        <p className="muted" style={{ margin: "10px 0 0" }}>Friend requests and invites show up in their 🔔 notifications. Invites last 2 minutes. “Team up” puts you both in Duos against a random pair.</p>
      </form>
      <section className="card">
        <h2>Friends {list && <span className="muted">({list.length})</span>}</h2>
        {list === null ? <p className="muted">Loading…</p>
          : list.length === 0 ? <p className="muted">No friends yet. Find someone by name above.</p>
          : list.map((u) => <div key={u.id} className="note"><PlayerCard u={u} onInvite={invite} /></div>)}
      </section>
    </>
  );
}

export function Notes({ say, tick, onCount }) {
  const [items, setItems] = useState(null);
  const load = () => api("/notifications").then((d) => { setItems(d.items); onCount(d.pending); }).catch((e) => say(e.message));
  useEffect(() => { load(); }, [tick]);
  const respond = async (n, accept) => {
    try { const d = await api(`/notifications/${n.id}/respond`, { method: "POST", body: { accept } }); if (d.message) say(d.message); }
    catch (x) { say(x.message); }
    load();
  };
  return (
    <section className="card">
      <h2>Notifications</h2>
      {items === null ? <p className="muted">Loading…</p>
        : items.length === 0 ? <p className="muted">Nothing yet. Friend requests and game invites will show up here.</p>
        : items.map((n) => {
          const live = n.status === "pending" && !n.expired;
          const text = n.type === "friend" ? `${n.fromName} wants to be friends` : `${n.fromName} invited you to ${n.mode === "duo" ? "team up in Duos" : "a 1v1"}`;
          const state = n.expired ? "Expired" : n.status === "pending" ? "" : cap(n.status);
          return (
            <div key={n.id} className="note">
              <div><b>{n.type === "friend" ? "👋" : "⚔️"} {text}</b><div className="muted">{ago(n.createdAt)}{state && ` · ${state}`}</div></div>
              {live && (
                <div className="row">
                  <button className="btn pri" onClick={() => respond(n, true)}>{n.type === "friend" ? "Accept" : "Join"}</button>
                  <button className="btn" onClick={() => respond(n, false)}>Decline</button>
                </div>
              )}
            </div>
          );
        })}
    </section>
  );
}
