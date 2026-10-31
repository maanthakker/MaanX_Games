// Full-body characters drawn as inline SVG strings (no images).
import { ITEM_BY_ID, SKINS, HAIR_STYLES, HAIR_COLORS, DEFAULT_EQUIP } from "../../shared/catalog.js";

const O = 'stroke="rgba(30,20,60,.4)" stroke-width="1.2"', INK = "#2a1d12";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const shade = (h, f) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * f).toString(16).padStart(2, "0")).join("");

export function hand(m, s) {
  const f = `fill="${s}" ${O}`;
  if (m === "paper") return [-8, -3.7, 0.6, 4.9].map((x, i) => `<rect x="${x}" y="${i === 1 || i === 2 ? -22 : -19}" width="3.5" height="18" rx="1.7" ${f}/>`).join("")
    + `<rect x="-13" y="2" width="9" height="4.5" rx="2.2" transform="rotate(-25 -9 4)" ${f}/><rect x="-8" y="-4" width="16" height="15" rx="5" ${f}/>`;
  if (m === "scissors") return `<rect x="-5.5" y="-22" width="4.2" height="21" rx="2.1" transform="rotate(-16 -3.4 0)" ${f}/><rect x="1.3" y="-22" width="4.2" height="21" rx="2.1" transform="rotate(16 3.4 0)" ${f}/><rect x="-8" y="-3" width="16" height="14" rx="5" ${f}/><rect x="-9" y="3" width="12" height="5" rx="2.5" ${f}/>`;
  return `<rect x="-9" y="-9" width="18" height="18" rx="7" ${f}/><path d="M-3-8v7M3-8v7" fill="none" ${O}/><rect x="-8" y="2" width="12" height="6" rx="3" ${f}/>`;
}
const trophy = () => `<path d="M-14-44h28v8a14 14 0 0 1-28 0z" fill="#ffc247" ${O}/><path d="M-14-40h-5a5 5 0 0 0 5 10M14-40h5a5 5 0 0 1-5 10" fill="none" stroke="#ffc247" stroke-width="3"/><rect x="-3" y="-22" width="6" height="10" fill="#e8b923"/><rect x="-11" y="-14" width="22" height="6" rx="2" fill="#b07a00"/><circle cx="-6" cy="-37" r="3" fill="#fff" opacity=".45"/>`;

function hairBack(h, c) {
  if (h === "long") return `<path d="M35 36Q35 12 60 12Q85 12 85 36L88 78Q60 72 32 78Z" fill="${c}"/>`;
  if (h === "ponytail") return `<path d="M80 26Q104 24 100 56Q98 72 92 80Q94 56 78 44Z" fill="${c}"/>`;
  if (h === "curly") return [[38, 34], [44, 22], [54, 16], [66, 16], [76, 22], [82, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`).join("");
  return "";
}
function hairFront(h, c) {
  if (h === "short" || h === "long" || h === "ponytail") return `<path d="M37 40Q35 14 60 14Q85 14 83 40Q80 29 70 27Q60 33 50 27Q40 29 37 40Z" fill="${c}"/>`;
  if (h === "buzz") return `<path d="M38 36Q38 17 60 17Q82 17 82 36Q60 25 38 36Z" fill="${c}" opacity=".9"/>`;
  if (h === "curly") return [[48, 24], [60, 20], [72, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`).join("");
  return "";
}
function acc(a) {
  switch (a) {
    case "glasses": return { front: `<g fill="rgba(255,255,255,.3)" stroke="${INK}" stroke-width="2"><circle cx="52" cy="41" r="8"/><circle cx="68" cy="41" r="8"/></g>` };
    case "cap": return { front: `<path d="M37 34Q37 11 60 11Q83 11 83 34Z" fill="#e5304f" ${O}/><path d="M58 32H97Q99 38 88 38H58Z" fill="#b01f3a" ${O}/>` };
    case "crown": return { front: `<path d="M42 22L46 6L53 16L60 3L67 16L74 6L78 22Z" fill="#ffc247" stroke="#b07a00" stroke-width="1.2" stroke-linejoin="round"/><circle cx="60" cy="16" r="2" fill="#e5304f"/>` };
    case "headphones": return { front: `<path d="M37 42Q37 12 60 12Q83 12 83 42" fill="none" stroke="#333a55" stroke-width="4"/><rect x="31" y="36" width="9" height="17" rx="4" fill="#333a55"/><rect x="80" y="36" width="9" height="17" rx="4" fill="#333a55"/>` };
    case "shades": return { eyes: "", front: `<rect x="42" y="35" width="16" height="10" rx="4" fill="#15112b"/><rect x="62" y="35" width="16" height="10" rx="4" fill="#15112b"/><path d="M58 39h4" stroke="#15112b" stroke-width="2.4"/><path d="M45 38h4M65 38h4" stroke="#fff" stroke-width="1.5" opacity=".4"/>` };
    case "nightcap": return { eyes: `<path d="M47 41q5 4 10 0M63 41q5 4 10 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`, front: `<path d="M38 31Q40 6 68 8Q90 10 94 30Q80 20 82 31Z" fill="#5b6bd6" ${O}/><rect x="37" y="28" width="46" height="8" rx="4" fill="#f4f1ff" ${O}/><circle cx="94" cy="31" r="5.5" fill="#f4f1ff" ${O}/>` };
    case "foxears": return { back: `<path d="M38 28L42 2L58 20Z" fill="#e8702a" ${O}/><path d="M82 28L78 2L62 20Z" fill="#e8702a" ${O}/><path d="M43 20L45 9L53 18ZM77 20L75 9L67 18Z" fill="#7a2f1a" opacity=".6"/>`, front: `<path d="M57 46h6l-3 4z" fill="${INK}"/>` };
    case "glow": return { eyes: [52, 68].map((x) => `<circle cx="${x}" cy="41" r="6.5" fill="#55ddff" opacity=".3"/><circle cx="${x}" cy="41" r="3.3" fill="#b8f3ff"/>`).join("") };
    default: return {};
  }
}
function deco(b) {
  const gold = "#e8c35a";
  if (b === "sam") return { bd: [[46, 90], [66, 84], [56, 108], [72, 104], [47, 140], [70, 152]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="9" fill="#fff" opacity=".85">✦</text>`).join("") };
  if (b === "steven") return { bd: `<path d="M50 70L60 98L70 70Z" fill="#f4f1ff" ${O}/><path d="M58 76h4l1.5 24-3.5 5-3.5-5z" fill="#d63a4a"/><path d="M50 70L42 100M70 70L78 100" stroke="#232744" stroke-width="2.2" fill="none"/>`,
    held: `<path d="M27 112V86M14 88H40" stroke="${gold}" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M16 88L11 102M16 88L21 102M38 88L33 102M38 88L43 102" stroke="${gold}" stroke-width="1" fill="none"/><path d="M8 102H24Q16 112 8 102ZM30 102H46Q38 112 30 102Z" fill="${gold}" ${O}/>` };
  if (b === "sofia") return { bk: `<path d="M38 128C6 118-4 160 22 170C14 150 28 142 40 144Z" fill="#e8702a" ${O}/><path d="M12 150C8 160 14 168 22 170C18 162 18 156 22 150Z" fill="#fff"/>`, face: `<path d="M38 44L52 50L42 55ZM82 44L68 50L78 55Z" fill="#fff"/>` };
  if (b === "oracle") return { bk: `<path d="M34 46Q32 10 60 10Q88 10 86 46L92 80H28Z" fill="${shade("#3b2a7a", 0.75)}" ${O}/>`,
    bd: `<path d="M34 72H86Q90 120 100 170H20Q30 120 34 72Z" fill="#3b2a7a" ${O}/><path d="M20 168H100" stroke="${gold}" stroke-width="4"/><path d="M60 76V168" stroke="${gold}" stroke-width="1.5" opacity=".6"/><text x="53" y="104" font-size="15" fill="${gold}">✦</text>` };
  return {};
}

// p: {skin, hair, hc, sh, sc, pc, shoe:{c,t}, acc, bot}
export function charSVG(p, { label = "", flip = false, move = "rock", state = "", trophy: cup = false } = {}) {
  const sleeve = p.sh === "tank" ? 0 : p.sh === "tee" ? 42 : 100, d = deco(p.bot), a = acc(p.acc);
  const arm = (path) => `<path d="${path}" fill="none" stroke="${p.skin}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`
    + (sleeve ? `<path d="${path}" pathLength="100" fill="none" stroke="${p.sc}" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${sleeve} 100"/>` : "");
  const shoe = (x) => p.shoe.t === "b"
    ? `<rect x="${x - 7.5}" y="158" width="15" height="15" rx="4" fill="${p.shoe.c}" ${O}/><ellipse cx="${x}" cy="173" rx="11.5" ry="5.5" fill="${p.shoe.c}" ${O}/>`
    : `<ellipse cx="${x}" cy="172" rx="11.5" ry="6" fill="${p.shoe.c}" ${O}/><rect x="${x - 11.5}" y="174" width="23" height="3.2" rx="1.6" fill="rgba(255,255,255,.85)" ${O}/>`;
  let st = "";
  if (p.sh === "stripe") st = [84, 96, 108].map((y) => `<path d="M36 ${y}H84" stroke="${shade(p.sc, 0.7)}" stroke-width="5" opacity=".7"/>`).join("");
  if (p.sh === "hoodie") st = `<ellipse cx="60" cy="69" rx="23" ry="9" fill="${shade(p.sc, 0.78)}" ${O}/><path d="M44 106h32l4 14H40z" fill="${shade(p.sc, 0.86)}"/><path d="M55 76v13M65 76v13" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
  const eyes = a.eyes !== undefined ? a.eyes : `<circle cx="52" cy="41" r="2.6" fill="${INK}"/><circle cx="68" cy="41" r="2.6" fill="${INK}"/>`;
  const held = cup ? trophy() + hand("rock", p.skin) : hand(move, p.skin);
  return `<svg class="c ${state}" data-bot="${p.bot || ""}" viewBox="0 0 120 190" role="img" aria-label="${esc(label)}"><g${flip ? ' transform="translate(120 0) scale(-1 1)"' : ""}>`
    + `<ellipse cx="60" cy="178" rx="30" ry="5" fill="rgba(0,0,0,.16)"/><g class="body">${d.bk || ""}${hairBack(p.hair, p.hc)}${a.back || ""}`
    + [42, 63].map((x) => `<rect x="${x}" y="118" width="15" height="54" rx="6" fill="${p.pc}" ${O}/>`).join("") + shoe(49.5) + shoe(70.5)
    + `<rect x="34" y="70" width="52" height="56" rx="15" fill="${p.sc}" ${O}/>${st}${d.bd || ""}`
    + `<g class="armL">${arm("M36 80L27 112")}${d.held || ""}<circle cx="27" cy="114" r="6" fill="${p.skin}" ${O}/></g>`
    + `<g class="armR">${arm("M84 80L97 90L102 58")}<g transform="translate(102 48)">${held}</g></g>`
    + `<rect x="53" y="56" width="14" height="18" rx="5" fill="${p.skin}" ${O}/>`
    + `<g class="head"><circle cx="38" cy="43" r="4.5" fill="${p.skin}" ${O}/><circle cx="82" cy="43" r="4.5" fill="${p.skin}" ${O}/><circle cx="60" cy="40" r="22" fill="${p.skin}" ${O}/>${d.face || ""}${eyes}`
    + `<circle cx="46" cy="49" r="3.5" fill="#ff7a9a" opacity=".28"/><circle cx="74" cy="49" r="3.5" fill="#ff7a9a" opacity=".28"/>`
    + `<path class="mo-idle" d="M53 50Q60 56 67 50" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path class="mo-win" d="M51 48Q60 64 69 48Z" fill="#7a1f3a" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path class="mo-lose" d="M53 55Q60 48 67 55" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
    + `${hairFront(p.hair, p.hc)}${a.front || ""}</g></g></g></svg>`;
}

export function specFromUser(u) {
  const L = u?.look || {}, E = { ...DEFAULT_EQUIP, ...(u?.equipped || {}) };
  const g = (slot) => ITEM_BY_ID[E[slot]] || ITEM_BY_ID[DEFAULT_EQUIP[slot]];
  const sh = g("shirt"), pa = g("pants"), so = g("shoes"), ac = g("acc");
  return { skin: SKINS[L.skin] ?? SKINS[1], hair: HAIR_STYLES.includes(L.hair) ? L.hair : "short", hc: HAIR_COLORS[L.hairColor] ?? HAIR_COLORS[1],
    sh: sh.style, sc: sh.color, pc: pa.color, shoe: { c: so.color, t: so.style }, acc: ac.style, bot: "" };
}

export function Fig({ spec, label, flip, move, state, trophy, className = "" }) {
  return <div className={"fig " + className} dangerouslySetInnerHTML={{ __html: charSVG(spec, { label, flip, move, state, trophy }) }} />;
}

const ACC_ICON = { none: "🚫", glasses: "👓", cap: "🧢", headphones: "🎧", shades: "🕶️", nightcap: "🌙", foxears: "🦊", crown: "👑" };
export function ItemIcon({ item }) {
  if (item.slot === "acc") return <span className="ico" aria-hidden="true">{ACC_ICON[item.style] || "✨"}</span>;
  const c = item.color, path = item.slot === "shirt" ? "M9 6l7-4h8l7 4 6 7-6 4v17H9V17l-6-4z"
    : item.slot === "pants" ? "M10 3h20l3 32h-9l-4-20-4 20H7z"
    : item.style === "b" ? "M12 4h12v18h10a4 4 0 0 1 0 8H8a4 4 0 0 1-4-4V22h8z" : "M4 22q2-10 14-10l6 6h8a5 5 0 0 1 0 10H8a4 4 0 0 1-4-4z";
  return <svg className="ico" viewBox="0 0 40 38" aria-hidden="true"><path d={path} fill={c} stroke="rgba(30,20,60,.45)" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

export const BOTS = [
  { id: "sam", name: "Sleepy Sam", emoji: "😴", chance: 0.9, label: "Easy", line: "Barely awake. Free win.", color: "#12a150",
    look: { skin: "#f3cfb0", hair: "short", hc: "#6b3f1d", sh: "long", sc: "#8fb8ff", pc: "#8fb8ff", shoe: { c: "#ffb3d9", t: "s" }, acc: "nightcap", bot: "sam" } },
  { id: "charlie", name: "Chill Charlie", emoji: "😎", chance: 0.75, label: "Casual", line: "Relaxed, kinda predictable.", color: "#1aa6c9",
    look: { skin: "#c98a5e", hair: "short", hc: "#1d1630", sh: "hoodie", sc: "#19b3a6", pc: "#3b4f8a", shoe: { c: "#f4f1ff", t: "s" }, acc: "shades", bot: "charlie" } },
  { id: "steven", name: "Even Steven", emoji: "⚖️", chance: 0.5, label: "Fair", line: "Totally fair. Pure luck.", color: "#6d4aff",
    look: { skin: "#e8b894", hair: "short", hc: "#8a8a99", sh: "long", sc: "#3a3f58", pc: "#3a3f58", shoe: { c: "#15112b", t: "b" }, acc: "none", bot: "steven" } },
  { id: "sofia", name: "Sly Sofia", emoji: "🦊", chance: 0.25, label: "Hard", line: "She always seems to know.", color: "#e07a10",
    look: { skin: "#f6d2b8", hair: "long", hc: "#e8702a", sh: "tee", sc: "#f0803c", pc: "#3d2b4f", shoe: { c: "#4a2d1c", t: "b" }, acc: "foxears", bot: "sofia" } },
  { id: "oracle", name: "The Oracle", emoji: "🔮", chance: 0.1, label: "Brutal", line: "Has seen every move. Good luck.", color: "#e5304f",
    look: { skin: "#cdbfe8", hair: "bald", hc: "#000000", sh: "long", sc: "#3b2a7a", pc: "#3b2a7a", shoe: { c: "#e8c35a", t: "s" }, acc: "glow", bot: "oracle" } },
];
