/* MaanX bridge, loaded inside each game page:
     <script src="/maanx/bridge.js" data-game="voxel-realms" defer></script>
   Gives games window.MaanX.emit(event, data), counts the launch and play time,
   and shows achievement / quest / level-up toasts over the game. */
(function () {
  const me = document.currentScript;
  const gameId = me && me.dataset.game;
  const queue = [];
  window.MaanX = { emit: (t, d) => { queue.push([t, d]); } };

  const s = document.createElement("script");
  s.src = "/maanx/progress.js";
  s.onload = start;
  document.head.append(s);

  function start() {
    const P = window.MaanXProgress;
    window.MaanX = { emit: (t, d) => P.emit(t, d), progress: P };
    P.on(celebrate);
    P.visit();
    try {
      if (gameId && !sessionStorage.getItem("maanx:launched:" + gameId)) { sessionStorage.setItem("maanx:launched:" + gameId, "1"); P.launch(gameId); }
    } catch (e) { if (gameId) P.launch(gameId); }
    for (const [t, d] of queue.splice(0)) P.emit(t, d);
    // one minute of play time for every visible minute
    let secs = 0;
    setInterval(() => { if (document.visibilityState === "visible" && ++secs >= 60) { secs = 0; gameId && P.minute(gameId); } }, 1000);
  }

  /* ---------- toasts ---------- */
  let host, busy = false;
  const pending = [];
  function ensureHost() {
    if (host) return host;
    host = document.createElement("div");
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    host.style.cssText = "position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147483000;pointer-events:none;font:600 14px/1.25 'Figtree Variable',system-ui,sans-serif";
    const st = document.createElement("style");
    st.textContent = `
@font-face{font-family:'Figtree Variable';src:url(/maanx/fonts/figtree.woff2) format('woff2-variations');font-weight:300 900;font-display:swap}
.mx-t{display:flex;align-items:center;gap:12px;min-width:260px;max-width:min(92vw,380px);padding:10px 16px 10px 10px;border-radius:14px;background:#17181d;color:#f4f2ee;
box-shadow:0 10px 30px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.4);transform:translateY(-16px) scale(.96);opacity:0;transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .35s}
.mx-t.in{transform:none;opacity:1}.mx-t.out{transform:translateY(-10px);opacity:0;transition-duration:.3s}
.mx-i{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:#ffc53d;color:#1a1300}
.mx-i svg{width:22px;height:22px}.mx-k{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#ffc53d}
.mx-x{margin-left:auto;font-variant-numeric:tabular-nums;color:#ffc53d;font-weight:800}
@media (prefers-reduced-motion:reduce){.mx-t{transition:opacity .2s;transform:none}}`;
    document.head.append(st);
    document.body.append(host);
    return host;
  }
  const icon = (n) => `<svg aria-hidden="true"><use href="/maanx/icons.svg#i-${n}"/></svg>`;
  function celebrate(ev) {
    if (ev.type === "sync") return;
    for (const a of ev.achievements) pending.push({ k: "Achievement unlocked", t: a.title, i: a.icon, x: a.xp });
    for (const q of ev.quests) pending.push({ k: "Daily quest complete", t: q.title, i: "target", x: q.xp });
    if (ev.levelUp) pending.push({ k: "Level up", t: "You reached level " + ev.levelUp, i: "star", x: 0 });
    pump();
  }
  function pump() {
    if (busy || !pending.length || !document.body) return;
    busy = true;
    const n = pending.shift(), el = document.createElement("div");
    el.className = "mx-t";
    el.innerHTML = `<span class="mx-i">${icon(n.i)}</span><span><span class="mx-k"></span><span class="mx-n"></span></span>${n.x ? `<span class="mx-x">+${n.x} XP</span>` : ""}`;
    el.querySelector(".mx-k").textContent = n.k;
    el.querySelector(".mx-n").textContent = n.t;
    ensureHost().append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
    setTimeout(() => { el.classList.add("out"); setTimeout(() => { el.remove(); busy = false; pump(); }, 320); }, 3600);
  }
})();
