/* MaanX progress engine: XP, levels, daily streak, achievements and daily quests.
   Shared by the marketplace and by every game (through bridge.js). State lives in this
   browser's localStorage, so it is per device, not an account. */
(function () {
  const KEY = "maanx:progress:v1";
  const DAY = 864e5;
  const today = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const dayDiff = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / DAY);

  /* ---------- catalog ---------- */
  const GAMES = {
    "voxel-realms": { title: "Voxel Realms", url: "/voxelrealms/" },
    "rock-paper-scissors": { title: "Rock Paper Scissors", url: "/rps/" },
  };

  // XP per event, with an optional daily cap so grinding one action stays fair.
  const XP = {
    "launch": [10], "first-launch": [50], "daily": [20],
    "rps:win": [30], "rps:loss": [10], "rps:practice-win": [15], "rps:practice-loss": [5], "rps:box": [5],
    "vr:join": [20], "vr:friend": [25, 100], "vr:place": [1, 100], "vr:break": [1, 100], "vr:chat": [2, 20],
    "vr:nether": [100], "vr:end": [150], "vr:dragon": [500],
    "minute": [2, 120],
  };

  const REASON = {
    "rps:win": "Won an online match", "rps:loss": "Played an online match", "rps:practice-win": "Beat a bot", "rps:practice-loss": "Practice match", "rps:box": "Opened a mystery box",
    "vr:join": "Joined a world", "vr:friend": "A friend joined your world", "vr:place": "Placed blocks", "vr:break": "Broke blocks", "vr:chat": "Chatted in a world",
    "vr:nether": "Entered the Nether", "vr:end": "Reached the End", "vr:dragon": "Defeated the Ender Dragon", "minute": "Time played", "vr:create": "Created a world",
  };
  const TIERS = {
    common: { label: "Common" }, rare: { label: "Rare" }, epic: { label: "Epic" }, legendary: { label: "Legendary" },
  };

  // Each achievement reads lifetime counts (c), streak (s), level (lv) and per-game data (g).
  const ACH = [
    { id: "hello", title: "Press Start", desc: "Open MaanX Games for the first time.", icon: "play", tier: "common", xp: 25, test: (c) => c.daily >= 1 },
    { id: "explorer", title: "Game Hopper", desc: "Play every game in the store.", icon: "gamepad-2", tier: "rare", xp: 100, test: (c, s, lv, g) => Object.keys(GAMES).every((k) => g[k]?.launches) },
    { id: "streak-3", title: "On a Roll", desc: "Play three days in a row.", icon: "flame", tier: "common", xp: 50, test: (c, s) => s.best >= 3 },
    { id: "streak-7", title: "Week Warrior", desc: "Play seven days in a row.", icon: "flame", tier: "epic", xp: 200, test: (c, s) => s.best >= 7 },
    { id: "level-5", title: "Rising Star", desc: "Reach level 5.", icon: "star", tier: "rare", xp: 0, test: (c, s, lv) => lv >= 5 },
    { id: "level-10", title: "MaanX Legend", desc: "Reach level 10.", icon: "crown", tier: "legendary", xp: 0, test: (c, s, lv) => lv >= 10 },
    { id: "rps-win", title: "First Victory", desc: "Win an online Rock Paper Scissors match.", icon: "trophy", tier: "common", xp: 50, game: "rock-paper-scissors", test: (c) => c["rps:win"] >= 1 },
    { id: "rps-10", title: "Hand of Steel", desc: "Win 10 online Rock Paper Scissors matches.", icon: "swords", tier: "epic", xp: 250, game: "rock-paper-scissors", test: (c) => c["rps:win"] >= 10 },
    { id: "rps-oracle", title: "Out-Foxed the Oracle", desc: "Beat The Oracle bot, who wins nine rounds in ten.", icon: "bot", tier: "legendary", xp: 300, game: "rock-paper-scissors", test: (c) => c["rps:beat-oracle"] >= 1 },
    { id: "rps-box", title: "Mystery Unboxed", desc: "Open your first mystery box.", icon: "box", tier: "common", xp: 25, game: "rock-paper-scissors", test: (c) => c["rps:box"] >= 1 },
    { id: "rps-legend", title: "Golden Pull", desc: "Pull a Legendary item from a mystery box.", icon: "crown", tier: "legendary", xp: 200, game: "rock-paper-scissors", test: (c) => c["rps:legendary"] >= 1 },
    { id: "vr-join", title: "New World", desc: "Step into a Voxel Realms world.", icon: "globe", tier: "common", xp: 25, game: "voxel-realms", test: (c) => c["vr:join"] >= 1 },
    { id: "vr-build", title: "Master Builder", desc: "Place 500 blocks in Voxel Realms.", icon: "blocks", tier: "rare", xp: 150, game: "voxel-realms", test: (c) => c["vr:place"] >= 500 },
    { id: "vr-mine", title: "Deep Digger", desc: "Break 500 blocks in Voxel Realms.", icon: "pickaxe", tier: "rare", xp: 150, game: "voxel-realms", test: (c) => c["vr:break"] >= 500 },
    { id: "vr-friends", title: "Better Together", desc: "Have a friend join you in a Voxel Realms world.", icon: "users", tier: "rare", xp: 100, game: "voxel-realms", test: (c) => c["vr:friend"] >= 1 },
    { id: "vr-nether", title: "Into the Nether", desc: "Travel to the Nether.", icon: "flame", tier: "epic", xp: 150, game: "voxel-realms", test: (c) => c["vr:nether"] >= 1 },
    { id: "vr-end", title: "The End?", desc: "Reach the End dimension.", icon: "mountain", tier: "epic", xp: 200, game: "voxel-realms", test: (c) => c["vr:end"] >= 1 },
    { id: "vr-dragon", title: "Dragon Slayer", desc: "Defeat the Ender Dragon and beat Voxel Realms.", icon: "skull", tier: "legendary", xp: 500, game: "voxel-realms", test: (c) => c["vr:dragon"] >= 1 },
  ];

  // Daily quests: three a day, picked from this pool by the date, the same for every player.
  const QUEST_POOL = [
    { id: "q-rps-win", title: "Win a Rock Paper Scissors match", stat: "rps:any-win", goal: 1, xp: 60, game: "rock-paper-scissors" },
    { id: "q-rps-play", title: "Play 3 Rock Paper Scissors matches", stat: "rps:played", goal: 3, xp: 50, game: "rock-paper-scissors" },
    { id: "q-vr-place", title: "Place 50 blocks in Voxel Realms", stat: "vr:place", goal: 50, xp: 60, game: "voxel-realms" },
    { id: "q-vr-break", title: "Break 50 blocks in Voxel Realms", stat: "vr:break", goal: 50, xp: 60, game: "voxel-realms" },
    { id: "q-vr-chat", title: "Say hi in a Voxel Realms chat", stat: "vr:chat", goal: 1, xp: 30, game: "voxel-realms" },
    { id: "q-minutes", title: "Play for 15 minutes", stat: "minute", goal: 15, xp: 70 },
    { id: "q-two-games", title: "Play 2 different games", stat: "games-today", goal: 2, xp: 50 },
    { id: "q-box", title: "Open a mystery box", stat: "rps:box", goal: 1, xp: 40, game: "rock-paper-scissors" },
  ];

  /* ---------- levels ---------- */
  // Level n -> n+1 costs 100*n XP: 100, 200, 300 ...
  const levelOf = (xp) => { let lv = 1, need = 100, left = xp; while (left >= need) { left -= need; lv++; need = 100 * lv; } return { level: lv, into: left, need }; };
  const TITLES = [[1, "Rookie"], [3, "Player"], [5, "Rising Star"], [8, "Pro"], [10, "Legend"], [15, "Mythic"]];
  const titleOf = (lv) => TITLES.reduce((t, [min, name]) => (lv >= min ? name : t), "Rookie");

  /* ---------- state ---------- */
  const blank = () => ({ xp: 0, counts: {}, day: { key: today(), counts: {}, xp: {}, games: [], quests: {} }, streak: { count: 0, best: 0, last: null }, unlocked: {}, games: {}, log: [] });
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s.xp === "number") return Object.assign(blank(), s); } catch (e) { /* storage blocked or corrupt */ }
    return blank();
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ } }

  const listeners = new Set();
  const notify = (ev) => listeners.forEach((fn) => { try { fn(ev); } catch (e) { console.error(e); } });

  function questsFor(key) {
    let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const pool = QUEST_POOL.slice(), out = [];
    while (out.length < 3) { h = (h * 1103515245 + 12345) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); }
    return out;
  }

  function rollDay(s) {
    const k = today();
    if (s.day.key !== k) s.day = { key: k, counts: {}, xp: {}, games: [], quests: {} };
  }

  function addXp(s, amount, reason, out) {
    if (amount <= 0) return;
    const before = levelOf(s.xp).level;
    s.xp += amount;
    out.xp += amount;
    s.log.unshift({ t: Date.now(), xp: amount, reason });
    s.log.length = Math.min(s.log.length, 40);
    const after = levelOf(s.xp).level;
    if (after > before) out.levelUp = after;
  }

  function check(s, out) {
    // quests
    for (const q of questsFor(s.day.key)) {
      if (s.day.quests[q.id]) continue;
      const v = q.stat === "games-today" ? s.day.games.length : s.day.counts[q.stat] || 0;
      if (v >= q.goal) { s.day.quests[q.id] = Date.now(); out.quests.push(q); addXp(s, q.xp, "Quest: " + q.title, out); }
    }
    // achievements (loop, since an unlock's XP can unlock a level achievement)
    for (let pass = 0; pass < 3; pass++) {
      let any = false;
      const lv = levelOf(s.xp).level;
      for (const a of ACH) {
        if (s.unlocked[a.id] || !a.test(s.counts, s.streak, lv, s.games)) continue;
        s.unlocked[a.id] = Date.now(); out.achievements.push(a); addXp(s, a.xp, "Achievement: " + a.title, out); any = true;
      }
      if (!any) break;
    }
  }

  function bump(s, stat, n = 1) {
    s.counts[stat] = (s.counts[stat] || 0) + n;
    s.day.counts[stat] = (s.day.counts[stat] || 0) + n;
  }

  // Record one event. Returns what changed so callers can celebrate it.
  function emit(type, data = {}) {
    const s = load(); rollDay(s);
    const out = { type, xp: 0, levelUp: 0, achievements: [], quests: [] };

    // derived stats
    if (type === "rps:win" || type === "rps:loss") {
      const practice = data.practice;
      const win = type === "rps:win";
      bump(s, "rps:played");
      if (win) bump(s, "rps:any-win");
      if (practice) { if (win && practice === "oracle") bump(s, "rps:beat-oracle"); type = win ? "rps:practice-win" : "rps:practice-loss"; }
    }
    if (type === "rps:box" && data.rarity === "legendary") { bump(s, "rps:legendary"); addXp(s, 50, "Legendary pull", out); }

    bump(s, type);
    const rule = XP[type];
    if (rule) {
      const [amt, cap] = rule;
      const got = s.day.xp[type] || 0;
      const give = cap ? Math.max(0, Math.min(amt, cap - got)) : amt;
      s.day.xp[type] = got + give;
      addXp(s, give, data.reason || REASON[type] || type, out);
    }
    check(s, out);
    save(s);
    out.state = view(s);
    notify(out);
    return out;
  }

  // Count today's first visit and the streak. Safe to call on every page load.
  function visit() {
    const s = load();
    const k = today();
    const last = s.streak.last;
    if (last === k) return null;
    rollDay(s);
    s.streak.count = last && dayDiff(last, k) === 1 ? s.streak.count + 1 : 1;
    s.streak.best = Math.max(s.streak.best, s.streak.count);
    s.streak.last = k;
    save(s);
    return emit("daily", { reason: "Daily visit" + (s.streak.count > 1 ? ` · ${s.streak.count}-day streak` : "") });
  }

  function launch(gameId) {
    const s = load(); rollDay(s);
    const g = s.games[gameId] || (s.games[gameId] = { launches: 0, minutes: 0, last: 0 });
    const first = !g.launches;
    g.launches++; g.last = Date.now();
    if (!s.day.games.includes(gameId)) s.day.games.push(gameId);
    save(s);
    return emit(first ? "first-launch" : "launch", { reason: (first ? "First time playing " : "Played ") + (GAMES[gameId]?.title || gameId) });
  }

  function minute(gameId) {
    const s = load();
    const g = s.games[gameId] || (s.games[gameId] = { launches: 0, minutes: 0, last: 0 });
    g.minutes++; g.last = Date.now();
    save(s);
    return emit("minute", { reason: "Time played" });
  }

  function view(s = load()) {
    rollDay(s);
    const lv = levelOf(s.xp);
    return {
      xp: s.xp, ...lv, title: titleOf(lv.level), streak: s.streak, games: s.games, counts: s.counts, log: s.log,
      achievements: ACH.map((a) => ({ ...a, test: undefined, unlocked: s.unlocked[a.id] || 0 })),
      quests: questsFor(s.day.key).map((q) => ({ ...q, value: Math.min(q.goal, q.stat === "games-today" ? s.day.games.length : s.day.counts[q.stat] || 0), done: s.day.quests[q.id] || 0 })),
      questsReset: new Date(new Date().setHours(24, 0, 0, 0)).getTime(),
    };
  }

  window.addEventListener("storage", (e) => { if (e.key === KEY) notify({ type: "sync", xp: 0, achievements: [], quests: [], state: view() }); });

  window.MaanXProgress = { emit, visit, launch, minute, view, on: (fn) => (listeners.add(fn), () => listeners.delete(fn)), GAMES, TIERS, levelOf };
})();
