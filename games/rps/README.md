# Rock Paper Scissors

Rock paper scissors with animated full-body characters, online matches against real players, friends, coins and mystery boxes. Built on the MERN stack (MongoDB, Express, React, Node) with Socket.IO for live matches.

## Features

### Play modes
- **Play vs random (1v1):** get matched with another online player. First to 5 points wins; a tie round gives no point. The winner lifts the trophy and earns **20 coins**.
- **Duos vs random (2v2):** two teams of two. Each round, player 1 faces player 1 and player 2 faces player 2, and every duel won is a point. The first team to 5 with a lead wins, and both winners earn 20 coins.
- **Play with friends:** search any player by name to see their character, wins, losses and online status. Invite them to a 1v1, or team up and enter Duos together against a random pair.
- **Practice vs bots:** first to 5 against one of five bots. Each bot gives you an exact chance to win every round, with no ties. Practice doesn't pay coins.

| Bot | Look | Difficulty | Your win chance |
|---|---|---|---|
| 😴 Sleepy Sam | pajamas and a nightcap | Easy | 90% |
| 😎 Chill Charlie | hoodie and sunglasses | Casual | 75% |
| ⚖️ Even Steven | suit, holding scales | Fair | 50% |
| 🦊 Sly Sofia | fox ears and a tail | Hard | 25% |
| 🔮 The Oracle | robe and glowing eyes | Brutal | 10% |

### Match flow
- 15 seconds to pick each round; if time runs out, a random move is picked for you.
- Characters bob during the "rock… paper… scissors…" countdown, then reveal their throw on a raised arm. Round winners jump and cheer, losers slump.
- Leaving a match counts as a forfeit, and the other side wins.

### Friends and notifications
- Send friend requests by name. If they already sent you one, you become friends straight away.
- Friend requests and game invites appear under the 🔔 button, with a badge showing how many are waiting. Invites expire after 2 minutes.
- Your friends list shows who is online, with quick 1v1 and team-up buttons.

### Coins and mystery boxes
- Win online matches to earn 20 coins each.
- **100 coins opens a mystery box** with a random shirt, pants, shoes or accessory from 28 items.
- Odds: Common 60%, Rare 28%, Epic 9%, Legendary 3%. Legendaries include the Crown, Fox Ears, Golden Jacket, Gold Pants and Golden Boots.
- A duplicate is converted into **25 coins**.

### Your character
- Full-body SVG character: head, face, torso, arms, legs and shoes.
- Free to change at any time: 7 skin tones, 6 hair styles (short, long, curly, buzz, ponytail, bald) and 8 hair colors.
- Clothes come from boxes: shirts (T-shirt, long sleeve, stripes, hoodie, tank), pants, sneakers or boots, and accessories (glasses, cap, headphones, shades, night cap, fox ears, crown). Equip anything you own in the Locker.

### Leaderboard
- Top players, ranked by match wins (fewest losses breaks ties).

### Design and accessibility
- Mobile-first layout with light and dark themes and safe-area padding for phones with notches.
- Animations respect the reduced-motion setting, results are announced to screen readers, and every button is at least 44px tall.

### Fair play
- Matches, scores, coins and box rolls are decided on the server, so they can't be changed from the browser. Passwords are hashed with bcrypt and sessions use signed tokens.

## Tech stack
| Layer | Technology |
|---|---|
| Database | MongoDB (Atlas) with Mongoose |
| Backend | Node.js 20 + Express |
| Real-time | Socket.IO (matchmaking, rounds, live notifications) |
| Frontend | React 18, built with Vite |
| Hosting | Render web service (serves the API and the built React app) |

## Project structure
```
shared/   game rules and clothing catalog, used by server and client
server/   Express API, MongoDB models, Socket.IO match engine
client/   React app (Vite)
render.yaml  Render blueprint
```

## Run locally
Needs Node 20+ and a MongoDB database (a free MongoDB Atlas cluster works).
```bash
cp .env.example .env          # fill in MONGODB_URI and JWT_SECRET
npm install --prefix server
npm install --prefix client
npm run dev:server            # API and sockets on http://localhost:3001
npm run dev:client            # app on http://localhost:5173
npm test                      # game rules and match engine tests
```
To try multiplayer alone, open the app in a normal window and a private window and log in as two different players.

## Deploy on Render
1. In MongoDB Atlas, create a database user and allow network access from `0.0.0.0/0` (Render's free plan has no fixed IPs). Copy the connection string.
2. In Render, create a **Web Service** from this repo: build command `npm run build`, start command `npm start`, and environment variables `MONGODB_URI`, `JWT_SECRET` (a long random string) and `NODE_ENV=production`. Or use **New → Blueprint**, which reads `render.yaml`.
3. Every push to `main` redeploys automatically.

## Good to know
- Queues and live matches are kept in server memory, so run a single instance. A restart ends matches in progress; accounts, coins and items are safe in MongoDB.
- Render's free plan sleeps after 15 minutes without visitors, so the first visit after that takes about a minute.
