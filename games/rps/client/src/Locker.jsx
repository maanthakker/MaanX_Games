import { useState } from "react";
import { api, wait } from "./api.js";
import { Fig, ItemIcon, specFromUser } from "./draw.jsx";
import { ITEMS, ITEM_BY_ID, RARITY, SLOTS, SKINS, HAIR_STYLES, HAIR_COLORS, BOX_PRICE, DUP_REFUND, WIN_COINS } from "../../shared/catalog.js";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const BOX_TOTAL = ITEMS.filter((i) => i.rarity !== "starter").length;

export default function Locker({ me, setMe, say }) {
  const [box, setBox] = useState(null);
  const owned = new Set(me.inventory);
  const collected = me.inventory.filter((id) => ITEM_BY_ID[id] && ITEM_BY_ID[id].rarity !== "starter").length;

  const setLook = async (patch) => {
    const look = { ...me.look, ...patch };
    setMe({ ...me, look });
    try { setMe((await api("/me/look", { method: "PUT", body: look })).me); } catch (e) { say(e.message); }
  };
  const equip = async (it) => {
    setMe({ ...me, equipped: { ...me.equipped, [it.slot]: it.id } });
    try { setMe((await api("/me/equip", { method: "PUT", body: { itemId: it.id } })).me); } catch (e) { say(e.message); }
  };
  const open = async () => {
    setBox({ phase: "shake" });
    try {
      const [d] = await Promise.all([api("/box/open", { method: "POST" }), wait(1300)]);
      setBox({ phase: "show", ...d });
      window.MaanX?.emit("rps:box", { rarity: d.item?.rarity, duplicate: d.duplicate });
      setMe(d.me);
    } catch (e) { setBox(null); say(e.message); }
  };

  const opts = (label, key, values, swatch) => (
    <fieldset>
      <legend>{label}</legend>
      <div className="opts">{values.map((v, i) => {
        const val = swatch ? i : v;
        return <button key={i} className={swatch ? "sw" : ""} style={swatch ? { background: v } : undefined} aria-pressed={me.look[key] === val}
          aria-label={swatch ? `${label} ${i + 1}` : undefined} onClick={() => setLook({ [key]: val })}>{swatch ? "" : cap(v)}</button>;
      })}</div>
    </fieldset>
  );

  return (
    <>
      <section className="card hero">
        <Fig spec={specFromUser(me)} label="Your character" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>🎁 Mystery box</b>
          <p className="muted" style={{ margin: "4px 0 10px" }}>A random shirt, pants, shoes or accessory. Duplicates turn into {DUP_REFUND} coins.</p>
          <button className="btn pri" style={{ width: "100%" }} disabled={me.coins < BOX_PRICE || !!box} onClick={open}>Open for {BOX_PRICE} 🪙</button>
          {me.coins < BOX_PRICE && <p className="muted" style={{ margin: "6px 0 0" }}>{BOX_PRICE - me.coins} more coins needed. Each match win pays {WIN_COINS}.</p>}
        </div>
      </section>
      <section className="card">
        <h2>Your clothes <span className="muted">· {collected} of {BOX_TOTAL} collected</span></h2>
        {SLOTS.map(([slot, label]) => (
          <fieldset key={slot}>
            <legend>{label}</legend>
            <div className="items">{ITEMS.filter((i) => i.slot === slot && owned.has(i.id)).map((it) => (
              <button key={it.id} className="item" style={{ "--r": RARITY[it.rarity].color }} aria-pressed={me.equipped[slot] === it.id} onClick={() => equip(it)}>
                <ItemIcon item={it} /><span>{it.name}<small>{RARITY[it.rarity].label}</small></span>
              </button>
            ))}</div>
          </fieldset>
        ))}
      </section>
      <section className="card">
        <h2>Body</h2>
        {opts("Skin tone", "skin", SKINS, true)}
        {opts("Hair style", "hair", HAIR_STYLES, false)}
        {opts("Hair color", "hairColor", HAIR_COLORS, true)}
      </section>
      {box && <BoxModal box={box} me={me} onClose={() => setBox(null)} onWear={(it) => { equip(it); setBox(null); }} />}
    </>
  );
}

const BoxArt = ({ shake }) => (
  <svg className={"mbox" + (shake ? " shake" : "")} viewBox="0 0 100 100" aria-hidden="true">
    <rect x="14" y="40" width="72" height="50" rx="8" fill="#6d4aff" />
    <rect x="8" y="28" width="84" height="18" rx="6" fill="#8a6dff" />
    <rect x="44" y="28" width="12" height="62" fill="#ffc247" />
    <path d="M50 28C38 10 22 18 32 28M50 28C62 10 78 18 68 28" fill="none" stroke="#ffc247" strokeWidth="6" strokeLinecap="round" />
    <text x="29" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">?</text>
  </svg>
);

function BoxModal({ box, me, onClose, onWear }) {
  const it = box.item;
  return (
    <div className="overlay">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="bt" aria-live="polite">
        {box.phase === "shake" ? <><BoxArt shake /><h2 id="bt">Opening…</h2></> : (
          <>
            <span className="rar" style={{ "--r": RARITY[it.rarity].color }}>{RARITY[it.rarity].label}</span>
            <h2 id="bt" style={{ fontSize: "1.4rem", margin: "8px 0" }}>{it.name}</h2>
            <Fig className="boxfig" spec={specFromUser({ ...me, equipped: { ...me.equipped, [it.slot]: it.id } })} label={`You wearing ${it.name}`} state="win" />
            <p>{box.duplicate ? <>You already had this, so it became <span className="coins">+{box.refund} coins 🪙</span></> : "New! It's in your locker."}</p>
            <div className="row" style={{ justifyContent: "center" }}>
              {!box.duplicate && <button className="btn pri" onClick={() => onWear(it)}>Wear it</button>}
              <button className="btn" onClick={onClose}>{box.duplicate ? "OK" : "Later"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
