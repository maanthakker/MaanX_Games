# MaanX Games

Every game [Maan Thakker](https://github.com/maanthakker) has built, playable online in one place, with XP, levels, a daily streak, achievements and daily quests that carry across all of them.

**Games so far**

| Game | What it is | Where it runs |
|---|---|---|
| Voxel Realms | Multiplayer voxel sandbox: 13 biomes, survival and creative, the Nether, the End, the Ender Dragon | `/voxelrealms/` |
| Rock Paper Scissors | Online 1v1 and 2v2 matches, five bots, coins, mystery boxes and a character locker | `/rps/` |

## How it fits together

One Node process (`server.js`) serves everything:

```
web/                      the store (plain HTML, CSS and JS, no framework)
  index.html              shell; store.js renders the pages client-side
  maanx/catalog.js        the list of games. Add a game here and it appears in the store
  maanx/progress.js       XP, levels, streak, achievements and quests (saved in the browser)
  maanx/bridge.js         loaded inside each game; games call MaanX.emit("event")
  maanx/tokens.css        design tokens (see DESIGN.md)
  media/<game>/           real screenshots used as cover and hero art
games/rps/                Rock Paper Scissors (React client, Express API, Socket.IO)
games/voxel-realms/       Voxel Realms (three.js game, lobby, WebSocket rooms)
```

Games report what happens through the bridge, for example `MaanX.emit("rps:win")` or `MaanX.emit("vr:dragon")`, and the store turns that into XP, achievement unlocks and quest progress. Toasts appear over the game as they happen.

## Run locally

Needs Node 20+ and MongoDB (a free MongoDB Atlas cluster works; without one, Voxel Realms uses in-memory worlds and Rock Paper Scissors online play is off).

```sh
cp .env.example .env     # set MONGODB_URI and JWT_SECRET
npm install
npm run build            # builds the Rock Paper Scissors client
npm start                # http://localhost:3000
npm test                 # game rules and match engine tests
```

## Deploy

Render, Railway or Fly.io (anything that runs a long-lived Node process; the games use WebSockets). `render.yaml` is a ready blueprint: create a Blueprint from this repo and paste your `MONGODB_URI`.

## Adding a game

1. Put the game under `games/<id>/` and mount it in `server.js`.
2. Add `<script src="/maanx/bridge.js" data-game="<id>" defer></script>` to its page.
3. Call `MaanX.emit("<id>:something")` where things happen; add XP values, achievements and quests for it in `web/maanx/progress.js`.
4. Add the catalog entry and screenshots in `web/maanx/catalog.js` and `web/media/<id>/`.

## Credits

- Every game here is Maan's. Voxel Realms and Rock Paper Scissors are by [@maanthakker](https://github.com/maanthakker).
- Proud dad of [@maanthakker](https://github.com/maanthakker), building the future together.
- Maan is the successor to the vision behind everything I build, and part of the next generation of builders in our family.
