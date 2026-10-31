# Design

<!-- impeccable:design-schema 1 -->

## World

A dark game store, played straight: the visitor chose the category standard (the storefronts kids already know) over a themed world. Everything else is craft. The page is a black shelf on which the games' own art is the only colour; chrome stays near-monochrome so Maan's screenshots carry the page. One warm accent (marigold) marks progress, rewards and the primary action, never decoration.

Mode: Experience on the home and game pages (the games lead), Operate on Library, Achievements and Quests.

## Colour

Tokens live in `web/maanx/tokens.css`.

- Ground `--bg #0d0e11`; surfaces step up `--s1 #15161b`, `--s2 #1d1e24`, `--s3 #26272f`, `--s4 #31323b`. Elevation is declared once per element: a surface step OR a shadow, never a 1px border under a shadow.
- Text `--t1 #f4f2ee` (headings, body), `--t2 #b3b1ba` (secondary, 7.6:1 on bg), `--t3 #8e8c97` (captions, 4.9:1 on bg; never on `--s3` or above).
- Accent `--accent #ffc53d` with `--on-accent #1b1400` (13:1). Used for: primary buttons, XP numerals and the XP bar, streak flame, the current nav item, focus rings, selection, caret.
- Rarity scale: common `#a7adb8`, rare `#5b9bff`, epic `#b98bff`, legendary = accent. Rarity colour appears only as the icon well and a label on an achievement, never as a card border.
- Status: ok `#43d17f`, danger `#ff7a6b`.
- Banned here: purple-to-cyan gradients, gradient text, glass panels, neon glows, zero-offset halos.

## Type

- Display: Archivo Variable, self-hosted, weight 800, width 118% for titles and the wordmark, tracking -0.02em. Game titles on cards: 700, width 110%.
- Body and UI: Figtree Variable, 400 body, 600 labels, 700 buttons.
- Numerals (XP, levels, counts, timers): Figtree with `font-variant-numeric: tabular-nums` (`.num`).
- Scale: 13 caption, 14 secondary, 16 body, 18 lead, 22 section, 28 panel heading, clamp(40px, 6vw, 72px) hero title. Max display 72px. Headings `text-wrap: balance`.
- Measure: paragraphs capped at 62ch.

## Space and shape

- Spacing unit 4px. Section gaps 64px desktop / 40px mobile; within a section, groups sit 12 to 16px apart and the heading carries 24px above, 12px below.
- Radii: 6 (chips), 10 (buttons, inputs), 12 (cards), 16 (hero and large panels). Pills only on small chips.
- Shadows: `--shadow-md 0 6px 18px rgba(0,0,0,.35)` and `--shadow-lg 0 24px 60px rgba(0,0,0,.5)`, always offset, always blurred. Used on hover lift and the hero art only.
- Touch targets 44px minimum, 48px on primary controls.

## Layout

- Max content width 1200px, 24px gutters (16px under 600px).
- Home: a full-bleed hero of the featured game (its real screenshot, a gradient scrim from the bottom, title set in Archivo, Play as the single primary action). Below it, a horizontal shelf of game cards sized by cover art (3:4 portrait covers, not identical icon cards), then "Your progress" as one wide panel (level ring + XP bar + streak + today's quests), then "The maker" as an editorial two-column block about Maan.
- Game page: screenshot strip you can scroll, then title, one-line pitch, Play, then how-to-play columns and that game's achievements.
- Library, Achievements, Quests: Operate lists with real controls (filters are buttons, not decoration).
- Top bar: wordmark, three links, search, and the player chip (level, XP). Mobile: bottom tab bar with four tabs, 56px tall, safe-area padded.

## Motion

One authored moment: the hero. On load its art settles in from a slight scale (1.04 to 1) with the title rising 12px, 900ms, exponential ease-out; nothing else fades in on scroll. Micro-motion is reserved for state: the XP bar fills with a 700ms ease-out when XP changes; a level-up pulses the level ring once; achievement toasts slide down 16px and settle. Cards lift 4px with a shadow on hover (200ms). Everything respects `prefers-reduced-motion` (motion collapses to instant opacity).

## Icons

Lucide, inlined as an SVG sprite (`web/maanx/icons.svg`), 2px stroke, 20px in text and 24px in buttons. No emoji as icons in MaanX chrome (the games' own UI keeps theirs).

## Copy

Direct and short, written for an eight-year-old and readable by an adult: "Play", "Join a world", "Back to the store". Progress copy names the action ("Place 50 blocks in Voxel Realms"), never the system ("Complete objective"). No invented numbers: no player counts, ratings or reviews.

## Browser surfaces

Selection marigold on dark ink, caret marigold, scrollbar themed from `--s4` on `--bg`, focus ring 2px marigold with 3px offset, underline offset .2em.
