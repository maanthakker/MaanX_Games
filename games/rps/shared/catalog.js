// Everything a character can wear. Starter items are owned by every new player;
// the rest only come from mystery boxes.
export const BOX_PRICE = 100;
export const DUP_REFUND = 25;
export const WIN_COINS = 20;

export const SKINS = ["#ffe0c7", "#f3cfb0", "#e0ac82", "#c98a5e", "#a66a43", "#7a4a2c", "#4f2f1c"];
export const HAIR_STYLES = ["short", "long", "curly", "buzz", "ponytail", "bald"];
export const HAIR_COLORS = ["#2a1d12", "#6b3f1d", "#c9871f", "#e8c35a", "#c8431b", "#8a8a99", "#3b7ddd", "#d94fa0"];

export const RARITY = {
  starter:   { label: "Starter",   color: "#8a8fa8", weight: 0 },
  common:    { label: "Common",    color: "#7a8296", weight: 60 },
  rare:      { label: "Rare",      color: "#2b7de9", weight: 28 },
  epic:      { label: "Epic",      color: "#9a4dff", weight: 9 },
  legendary: { label: "Legendary", color: "#e0a000", weight: 3 },
};
export const SLOTS = [["shirt", "Shirts"], ["pants", "Pants"], ["shoes", "Shoes"], ["acc", "Accessories"]];

const I = (id, slot, name, rarity, style, color) => ({ id, slot, name, rarity, style, color });
export const ITEMS = [
  I("tee-violet", "shirt", "Violet Tee", "starter", "tee", "#6d4aff"),
  I("jeans-blue", "pants", "Blue Jeans", "starter", null, "#3b4f8a"),
  I("sneakers-white", "shoes", "White Sneakers", "starter", "s", "#f4f1ff"),
  I("acc-none", "acc", "Nothing", "starter", "none", null),

  I("tee-red", "shirt", "Cherry Tee", "common", "tee", "#e5304f"),
  I("long-green", "shirt", "Forest Long Sleeve", "common", "long", "#12a150"),
  I("tank-sun", "shirt", "Sunny Tank", "common", "tank", "#ffb020"),
  I("stripe-sky", "shirt", "Sky Stripes", "common", "stripe", "#1aa6c9"),
  I("hoodie-pink", "shirt", "Bubblegum Hoodie", "rare", "hoodie", "#ff7ab8"),
  I("stripe-navy", "shirt", "Sailor Stripes", "rare", "stripe", "#333a55"),
  I("hoodie-night", "shirt", "Midnight Hoodie", "epic", "hoodie", "#1d1630"),
  I("long-gold", "shirt", "Golden Jacket", "legendary", "long", "#e8b923"),

  I("pants-black", "pants", "Black Pants", "common", null, "#2a2a35"),
  I("pants-khaki", "pants", "Khakis", "common", null, "#9a8560"),
  I("pants-gray", "pants", "Gray Joggers", "common", null, "#7a8aa8"),
  I("pants-maroon", "pants", "Maroon Pants", "rare", null, "#8a3b5e"),
  I("pants-moss", "pants", "Moss Cargo", "rare", null, "#4a7a4f"),
  I("pants-snow", "pants", "Snow Pants", "epic", null, "#eeeaff"),
  I("pants-gold", "pants", "Gold Pants", "legendary", null, "#e8b923"),

  I("sneakers-red", "shoes", "Red Sneakers", "common", "s", "#e5304f"),
  I("sneakers-blue", "shoes", "Blue Sneakers", "common", "s", "#2b7de9"),
  I("boots-black", "shoes", "Black Boots", "rare", "b", "#2a2a35"),
  I("boots-yellow", "shoes", "Rain Boots", "rare", "b", "#ffc247"),
  I("sneakers-lime", "shoes", "Lime Kicks", "epic", "s", "#12a150"),
  I("boots-gold", "shoes", "Golden Boots", "legendary", "b", "#e8b923"),

  I("acc-glasses", "acc", "Round Glasses", "common", "glasses", null),
  I("acc-cap", "acc", "Red Cap", "rare", "cap", null),
  I("acc-headphones", "acc", "Headphones", "rare", "headphones", null),
  I("acc-shades", "acc", "Shades", "epic", "shades", null),
  I("acc-nightcap", "acc", "Night Cap", "epic", "nightcap", null),
  I("acc-foxears", "acc", "Fox Ears", "legendary", "foxears", null),
  I("acc-crown", "acc", "Crown", "legendary", "crown", null),
];
export const ITEM_BY_ID = Object.assign(Object.create(null), Object.fromEntries(ITEMS.map((i) => [i.id, i])));
export const STARTER = ITEMS.filter((i) => i.rarity === "starter").map((i) => i.id);
export const DEFAULT_EQUIP = { shirt: "tee-violet", pants: "jeans-blue", shoes: "sneakers-white", acc: "acc-none" };

// Pick a rarity by weight, then an item of that rarity uniformly.
export function rollItem(rand = Math.random) {
  const tiers = Object.entries(RARITY).filter(([, r]) => r.weight > 0);
  let x = rand() * tiers.reduce((s, [, r]) => s + r.weight, 0), tier = tiers[0][0];
  for (const [k, r] of tiers) { if (x < r.weight) { tier = k; break; } x -= r.weight; }
  const pool = ITEMS.filter((i) => i.rarity === tier);
  return pool[Math.floor(rand() * pool.length)];
}
