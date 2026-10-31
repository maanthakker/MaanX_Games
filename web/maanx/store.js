/* MaanX Games store: a small client-side router over the catalog and the progress engine. */
(function () {
  const P = window.MaanXProgress, CAT = window.MAANX_CATALOG;
  const main = document.getElementById("main");
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (n, cls = "") => `<svg class="${cls}" aria-hidden="true"><use href="/maanx/icons.svg#i-${n}"/></svg>`;
  const pct = (a, b) => Math.round((a / b) * 100);
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const byId = (id) => CAT.find((g) => g.id === id);
  const gameTitle = (id) => byId(id)?.title || "";

  /* ---------- player chip ---------- */
  function paintChip(v, levelUp) {
    $("#chip-level").textContent = v.level;
    $("#chip-title").textContent = v.title;
    $("#chip-xp").textContent = `${v.xp.toLocaleString()} XP`;
    $("#chip-ring").style.setProperty("--p", pct(v.into, v.need) + "%");
    if (levelUp) { const r = $("#chip-ring"); r.classList.remove("pulse"); void r.offsetWidth; r.classList.add("pulse"); }
  }

  /* ---------- toasts ---------- */
  const pending = []; let busy = false;
  function toast(k, t, i, x) { pending.push({ k, t, i, x }); pump(); }
  function pump() {
    if (busy || !pending.length) return;
    busy = true;
    const n = pending.shift(), el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<i>${icon(n.i)}</i><span><small>${esc(n.k)}</small><b>${esc(n.t)}</b></span>${n.x ? `<span class="xp num">+${n.x} XP</span>` : ""}`;
    $("#toasts").append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
    setTimeout(() => { el.classList.add("out"); setTimeout(() => { el.remove(); busy = false; pump(); }, 320); }, 3600);
  }

  P.on((ev) => {
    paintChip(ev.state, ev.levelUp);
    for (const a of ev.achievements) toast("Achievement unlocked", a.title, a.icon, a.xp);
    for (const q of ev.quests) toast("Daily quest complete", q.title, "target", q.xp);
    if (ev.levelUp) toast("Level up", `You reached level ${ev.levelUp}: ${ev.state.title}`, "star", 0);
    if (ev.type === "sync") render();
  });

  /* ---------- pieces ---------- */
  const gameCard = (g, v) => {
    const gp = v.games[g.id], mine = v.achievements.filter((a) => a.game === g.id), got = mine.filter((a) => a.unlocked).length;
    return `<a class="gcard" href="/game/${g.id}">
      <div class="gcard-art" style="background-image:url('${g.cover}')" role="img" aria-label="${esc(g.title)} screenshot"></div>
      <div class="gcard-body">
        <h3>${esc(g.title)}</h3>
        <span class="gen">${esc(g.genre)} · ${esc(g.players)}</span>
        <span class="play" aria-hidden="true">${icon("play")}</span>
        <span class="prog"><i><b style="--w:${pct(got, mine.length)}%"></b></i><span class="num">${got}/${mine.length} awards${gp ? ` · ${plural(gp.minutes, "min")} played` : ""}</span></span>
      </div></a>`;
  };

  const questRow = (q) => `<div class="q${q.done ? " done" : ""}">
      <span class="chk">${icon("check")}</span>
      <span class="t">${esc(q.title)}<small>${q.game ? esc(gameTitle(q.game)) + " · " : ""}<span class="num">${q.value}/${q.goal}</span></small></span>
      <span class="xp num">+${q.xp} XP</span>
      <span class="mini"><b style="--w:${pct(q.value, q.goal)}%"></b></span></div>`;

  const progressPanel = (v, { withQuests = true } = {}) => {
    const t = Math.max(0, v.questsReset - Date.now()), h = Math.floor(t / 36e5), m = Math.floor((t % 36e5) / 6e4);
    const minutes = Object.values(v.games).reduce((s, g) => s + g.minutes, 0);
    const awards = v.achievements.filter((a) => a.unlocked).length;
    return `<div class="panel">
      <div class="prog-grid">
        <div class="big-ring" style="--p:${pct(v.into, v.need)}%"><div><span class="lv num">${v.level}</span><span class="lbl">Level</span></div></div>
        <div>
          <div class="xp-head"><b>${esc(v.title)}</b><span class="num">${v.into} / ${v.need} XP to level ${v.level + 1}</span></div>
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${v.need}" aria-valuenow="${v.into}" aria-label="Progress to the next level"><b style="--w:${pct(v.into, v.need)}%"></b></div>
          <div class="stats">
            <span class="stat">${icon("flame")}<b class="num">${v.streak.count}</b> day streak</span>
            <span class="stat">${icon("trophy")}<b class="num">${awards}</b> of ${v.achievements.length} awards</span>
            <span class="stat">${icon("timer")}<b class="num">${minutes}</b> min played</span>
            <span class="stat">${icon("zap")}<b class="num">${v.xp.toLocaleString()}</b> XP total</span>
          </div>
        </div>
      </div>
      ${withQuests ? `<div class="sec-head" style="margin-top:26px"><h2 style="font-size:20px">Today's quests</h2><a href="/quests">Resets in ${h}h ${m}m</a></div><div class="quests">${v.quests.map(questRow).join("")}</div>` : ""}
    </div>`;
  };

  const achCard = (a) => `<div class="ach${a.unlocked ? " on" : ""}" style="--rc:var(--${a.tier})">
      <i>${icon(a.unlocked ? a.icon : "lock")}</i>
      <div><b>${esc(a.title)}</b><span>${esc(a.desc)}</span><span class="r">${a.tier}${a.game ? " · " + esc(gameTitle(a.game)) : ""}${a.xp ? ` · +${a.xp} XP` : ""}${a.unlocked ? " · " + new Date(a.unlocked).toLocaleDateString() : ""}</span></div></div>`;

  /* ---------- pages ---------- */
  const pages = {
    home(v) {
      const feat = CAT[0];
      return `<div class="hero">
        <div class="hero-art" style="background-image:url('${feat.hero}')"></div>
        <div class="hero-body">
          <span class="hero-tag">${icon("sparkles")}Featured · made by Maan</span>
          <h1>${esc(feat.title)}</h1>
          <p>${esc(feat.tagline)} ${esc(feat.pitch.split(". ")[0])}.</p>
          <div class="hero-actions"><a class="btn primary lg" href="${feat.url}" data-launch="${feat.id}">${icon("play")}Play now</a><a class="btn ghost lg" href="/game/${feat.id}">About the game</a></div>
          <div class="hero-meta"><span>${icon("users")}${esc(feat.players)}</span><span>${icon("gamepad-2")}${esc(feat.genre)}</span><span>${icon("code-xml")}${esc(feat.built)}</span></div>
        </div></div>
      <div class="wrap">
        <section><div class="sec-head"><h2>All games</h2><a href="/library">Your library</a></div><div class="shelf">${CAT.map((g) => gameCard(g, v)).join("")}</div></section>
        <section><div class="sec-head"><h2>Your progress</h2><a href="/achievements">All achievements</a></div>${progressPanel(v)}</section>
        <section class="maker">
          <div>
            <h2>The maker</h2>
            <p class="lead">Every game on MaanX is built by Maan Thakker, who is eight and codes as <a href="https://github.com/maanthakker" rel="noopener">@maanthakker</a> on GitHub.</p>
            <p class="muted">Voxel Realms started as a single-player world and grew into a multiplayer one, with a real server that remembers every block you place. Rock Paper Scissors is a full online game with matchmaking, friends, bots and a loot locker. The store you are reading is where everything he ships next will land.</p>
            <p class="muted">Proud dad of @maanthakker, building the future together.</p>
            <a class="btn" href="https://github.com/maanthakker" rel="noopener">${icon("github")}Maan on GitHub</a>
          </div>
          <div class="maker-facts">
            <div class="fact"><i>${icon("gamepad-2")}</i><div><b class="num">${CAT.length} games, and counting</b><span>Each new one gets its own achievements and quests here.</span></div></div>
            <div class="fact"><i>${icon("globe")}</i><div><b>Online with friends</b><span>Both games run on a real server, so a link is all a friend needs.</span></div></div>
            <div class="fact"><i>${icon("code-xml")}</i><div><b>Open source</b><span>The code for every game lives on GitHub for anyone to read.</span></div></div>
            <div class="fact"><i>${icon("medal")}</i><div><b>No ads, no purchases</b><span>Coins and boxes are in-game only. Nothing here costs money.</span></div></div>
          </div>
        </section>
      </div>`;
    },

    game(v, id) {
      const g = byId(id);
      if (!g) return pages.missing();
      const mine = v.achievements.filter((a) => a.game === g.id), gp = v.games[g.id];
      return `<div class="wrap">
        <div class="gp-strip" aria-label="${esc(g.title)} screenshots">${g.shots.map((s, i) => `<img src="${s}" alt="${esc(g.title)} screenshot ${i + 1}" loading="${i ? "lazy" : "eager"}">`).join("")}</div>
        <div class="gp-head">
          <div><h1>${esc(g.title)}</h1><p class="muted" style="font-size:18px">${esc(g.tagline)}</p>
            <div class="tags">${g.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div></div>
          <div class="hero-actions"><a class="btn primary lg" href="${g.url}" data-launch="${g.id}">${icon("play")}Play ${esc(g.title)}</a></div>
        </div>
        <div class="gp-cols">
          <div>
            <h2>What you get</h2>
            <p class="muted">${esc(g.pitch)}</p>
            <ul class="list">${g.features.map((f) => `<li>${icon("check")}<span>${esc(f)}</span></li>`).join("")}</ul>
            <dl class="kv"><dt>Players</dt><dd>${esc(g.players)}</dd><dt>Plays on</dt><dd>${g.platforms.map(esc).join(", ")}</dd><dt>Built with</dt><dd>${esc(g.built)}</dd><dt>Source</dt><dd><a href="${g.repo}" rel="noopener">${esc(g.repo.replace("https://github.com/", ""))}</a></dd><dt>Your time</dt><dd class="num">${gp ? `${plural(gp.minutes, "minute")} over ${plural(gp.launches, "session")}` : "Not played yet"}</dd></dl>
          </div>
          <div>
            <h2>How to play</h2>
            <div class="howto">${g.howto.map((h) => `<div><h3>${esc(h.title)}</h3><ul>${h.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`).join("")}</div>
            <h2 style="margin-top:32px">Achievements</h2>
            <p class="ach-sum"><b class="num">${mine.filter((a) => a.unlocked).length}</b> of ${mine.length} unlocked</p>
            <div class="ach-grid" style="grid-template-columns:1fr">${mine.map(achCard).join("")}</div>
          </div>
        </div></div>`;
    },

    library(v) {
      const played = CAT.filter((g) => v.games[g.id]).sort((a, b) => v.games[b.id].last - v.games[a.id].last), rest = CAT.filter((g) => !v.games[g.id]);
      const row = (g) => { const gp = v.games[g.id], mine = v.achievements.filter((a) => a.game === g.id); return `<a class="lrow" href="/game/${g.id}">
        <img src="${g.cover}" alt=""><div><h3>${esc(g.title)}</h3><div class="meta"><span><b class="num">${gp ? plural(gp.minutes, "min") : "0 min"}</b> played</span><span><b class="num">${mine.filter((a) => a.unlocked).length}/${mine.length}</b> awards</span>${gp ? `<span>Last played <b>${new Date(gp.last).toLocaleDateString()}</b></span>` : ""}</div></div>
        <span class="btn primary">${icon("play")}Play</span></a>`; };
      return `<div class="wrap"><section>
        <h2 style="font-size:34px">Your library</h2>
        ${played.length ? `<p class="muted">Picking up where you left off.</p><div class="lib">${played.map(row).join("")}</div>` : `<div class="empty"><b>Nothing played yet</b>Every game you open shows up here with your time and awards.</div>`}
        ${rest.length ? `<h2 style="margin-top:40px">Not played yet</h2><div class="lib">${rest.map(row).join("")}</div>` : ""}
      </section></div>`;
    },

    achievements(v, _id, q) {
      const f = q.get("f") || "all";
      const list = v.achievements.filter((a) => f === "all" || (f === "unlocked" ? a.unlocked : f === "locked" ? !a.unlocked : a.game === f));
      const btn = (k, l) => `<button type="button" data-f="${k}" aria-pressed="${f === k}">${esc(l)}</button>`;
      const got = v.achievements.filter((a) => a.unlocked).length;
      return `<div class="wrap"><section>
        <h2 style="font-size:34px">Achievements</h2>
        <p class="ach-sum"><b class="num">${got}</b> of ${v.achievements.length} unlocked · <b class="num">${v.achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xp, 0)}</b> XP earned from awards</p>
        <div class="filters" role="group" aria-label="Filter achievements">${btn("all", "All")}${btn("unlocked", "Unlocked")}${btn("locked", "Locked")}${CAT.map((g) => btn(g.id, g.title)).join("")}</div>
        <div class="ach-grid">${list.map(achCard).join("") || `<div class="empty"><b>Nothing here yet</b>Play and they will come.</div>`}</div>
      </section></div>`;
    },

    quests(v) {
      const t = Math.max(0, v.questsReset - Date.now()), h = Math.floor(t / 36e5), m = Math.floor((t % 36e5) / 6e4);
      return `<div class="wrap"><section>
        <h2 style="font-size:34px">Daily quests</h2>
        <p class="muted">Three quests a day, the same for everyone. New ones in <span class="num">${h}h ${m}m</span>. Finish all three for <span class="num">${v.quests.reduce((s, q) => s + q.xp, 0)}</span> XP.</p>
        <div class="quests">${v.quests.map(questRow).join("")}</div>
        <h2 style="margin-top:40px">Your streak</h2>
        <div class="panel"><div class="stats"><span class="stat">${icon("flame")}<b class="num">${v.streak.count}</b> day streak</span><span class="stat">${icon("award")}<b class="num">${v.streak.best}</b> best streak</span></div>
        <p class="muted small" style="margin:12px 0 0">Open MaanX Games every day to keep it going. A missed day resets it to one.</p></div>
      </section></div>`;
    },

    profile(v) {
      return `<div class="wrap"><section>
        <h2 style="font-size:34px">You</h2>
        ${progressPanel(v, { withQuests: false })}
        <h2 style="margin-top:40px">Recent XP</h2>
        ${v.log.length ? `<ul class="log">${v.log.slice(0, 20).map((l) => `<li><span>${esc(l.reason)}</span><b class="num">+${l.xp} XP</b></li>`).join("")}</ul>` : `<div class="empty"><b>No XP yet</b>Open a game to start earning.</div>`}
        <p class="muted small" style="margin-top:20px">Progress is saved in this browser only, so it stays with the device you play on.</p>
      </section></div>`;
    },

    search(v, _id, q) {
      const s = (q.get("q") || "").trim().toLowerCase();
      const hits = CAT.filter((g) => [g.title, g.genre, g.tagline, ...g.tags].join(" ").toLowerCase().includes(s));
      return `<div class="wrap"><section><h2 style="font-size:34px">${s ? `Results for "${esc(s)}"` : "Search"}</h2>
        ${hits.length ? `<div class="shelf">${hits.map((g) => gameCard(g, v)).join("")}</div>` : `<div class="empty"><b>No game matches that</b>Try a genre like sandbox or party.</div>`}</section></div>`;
    },

    missing() { return `<div class="wrap"><section><div class="empty"><b>That page isn't here</b><a href="/">Back to the store</a></div></section></div>`; },
  };

  /* ---------- router ---------- */
  function route() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const q = new URLSearchParams(location.search);
    if (path === "/") return ["home"];
    const m = path.match(/^\/game\/([a-z0-9-]+)$/);
    if (m) return ["game", m[1]];
    const name = path.slice(1);
    return pages[name] && name !== "missing" ? [name, null, q] : ["missing"];
  }

  function render() {
    const v = P.view();
    const [name, id, q = new URLSearchParams(location.search)] = route();
    main.innerHTML = pages[name](v, id, q);
    const nav = name === "game" || name === "search" ? "home" : name;
    document.querySelectorAll("[data-nav]").forEach((a) => a.toggleAttribute("aria-current", false) || (a.dataset.nav === nav ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    const g = id && byId(id);
    document.title = name === "home" ? "MaanX Games" : `${g ? g.title : name[0].toUpperCase() + name.slice(1)} · MaanX Games`;
    paintChip(v);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a?.dataset.launch) { P.launch(a.dataset.launch); try { sessionStorage.setItem("maanx:launched:" + a.dataset.launch, "1"); } catch (err) { /* blocked */ } return; }
    if (a && a.origin === location.origin && !a.hasAttribute("download") && !/^\/(rps|voxelrealms)\b/.test(a.pathname)) {
      if (a.pathname.startsWith("/game/") && a.pathname.replace("/game/", "") in {}) return;
      e.preventDefault(); history.pushState(null, "", a.href); render(); main.focus();
      return;
    }
    const f = e.target.closest("[data-f]");
    if (f) { history.replaceState(null, "", "/achievements?f=" + f.dataset.f); render(); }
  });
  window.addEventListener("popstate", render);
  $("#search-form").addEventListener("submit", (e) => { e.preventDefault(); history.pushState(null, "", "/search?q=" + encodeURIComponent($("#q").value)); render(); });

  P.visit();
  render();
})();
