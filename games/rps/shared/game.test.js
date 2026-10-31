import assert from "node:assert/strict";
import { duel, resolveRound, winnerOf, formDuoTeams } from "./game.js";
import { rollItem, ITEMS, RARITY } from "./catalog.js";

assert.equal(duel("rock", "scissors"), 1);
assert.equal(duel("rock", "paper"), -1);
assert.equal(duel("paper", "paper"), 0);
assert.deepEqual(resolveRound([["a"], ["b"]], { a: "rock", b: "scissors" }).pts, [1, 0]);
assert.deepEqual(resolveRound([["a", "c"], ["b", "d"]], { a: "rock", b: "paper", c: "paper", d: "rock" }).pts, [1, 1]);
assert.equal(winnerOf([4, 3]), -1);
assert.equal(winnerOf([5, 3]), 0);
assert.equal(winnerOf([5, 5]), -1);   // duos can tie at 5-5: keep playing
assert.equal(winnerOf([6, 5]), 0);
assert.equal(winnerOf([2, 5]), 1);
assert.equal(formDuoTeams([["a"], ["b"], ["c"]]), null);
assert.deepEqual(formDuoTeams([["a"], ["b"], ["c"], ["d"]]).teams, [["a", "b"], ["c", "d"]]);
assert.deepEqual(formDuoTeams([["a"], ["x", "y"], ["b"]]).teams, [["x", "y"], ["a", "b"]]);
assert.deepEqual(formDuoTeams([["x", "y"], ["p", "q"], ["a"]]).used, [0, 1]);
assert.equal(formDuoTeams([["x", "y"], ["a"]]), null);

const n = 200000, counts = {};
for (let i = 0; i < n; i++) { const it = rollItem(); counts[it.rarity] = (counts[it.rarity] || 0) + 1; }
assert.equal(counts.starter, undefined);
for (const [k, r] of Object.entries(RARITY)) if (r.weight) assert.ok(Math.abs(counts[k] / n * 100 - r.weight) < 0.6, k);
assert.ok(ITEMS.every((i) => i.id && i.slot));
console.log("shared rules: all tests passed", counts);
