# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Full stack, one Node 20+ process: Express serves the marketplace (static HTML/CSS/JS) and mounts each game. Rock Paper Scissors runs its Express API and Socket.IO under `/rps`; Voxel Realms runs its REST API and WebSocket under `/voxelrealms`. One MongoDB (Atlas when hosted). Hosted on Render (long-lived process, WebSockets).

## Users

Two audiences, weighted equally (confirmed by the user):

1. Players: Maan's friends, classmates and family, mostly kids, who open the site to play right now, on phones, tablets and laptops.
2. Grown-ups who want to see what Maan builds: parents, teachers, mentors, school and the wider maker community.

## Product Purpose

MaanX Games is the home of every game Maan Thakker (GitHub: maanthakker, age 8) has made. It lets anyone play his games in the browser, online with friends, and earn progress across all of them. Success: a kid lands, is inside a game within two taps, and comes back for the streak; an adult leaves knowing an 8-year-old built real, playable, multiplayer games.

## Positioning

Not a portal of third-party games: every title here is made by one young builder, and the site grows as he ships. The arcade and the maker's portfolio are the same place.

## Operating Context

- Games come from Maan's GitHub. Current titles: Voxel Realms (multiplayer voxel sandbox, three.js) and Rock Paper Scissors (online 1v1 / 2v2, bots, coins, mystery boxes). Repos that are forks of other people's projects (Craft, Paper, MinecraftForge, luanti) are not Maan's games and are not listed as his.
- New games are added by adding an entry to the catalog file and the game folder.
- Played on shared family devices and school laptops; sessions are short.

## Capabilities and Constraints

- Online play needs MongoDB; Voxel Realms falls back to in-memory worlds without it.
- Site-wide progression (XP, level, streak, badges, quests) is kept per browser; it is not an account system.
- No ads, no purchases, no real money. Coins in Rock Paper Scissors are in-game only.

## Brand Commitments

- Name: MaanX Games. Credit Maan by his handle @maanthakker.
- Dark theme (user-pinned).
- Credit lines the family uses: "Proud dad of @maanthakker, building the future together."

## Evidence on Hand

- The two games and their READMEs (features, controls, bots, rarity odds).
- No player counts, reviews, ratings or press exist. Do not invent them.

## Product Principles

1. Play first: the fastest path into a game wins every layout argument.
2. Every game is Maan's: credit is specific and visible, never generic.
3. Progress across games, not inside one: the site's rewards make trying the next game feel natural.
4. Kid-safe and honest: no dark patterns, no fake numbers, no pressure loops.

## Accessibility & Inclusion

Kids aged 6 to 12 are core users: large targets (44px+), plain words, readable contrast, reduced-motion respected, keyboard usable.
