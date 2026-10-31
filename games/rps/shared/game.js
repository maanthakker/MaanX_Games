// Pure game rules shared by the server and the React client.
export const MOVES = ["rock", "paper", "scissors"];
export const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
export const BEATEN_BY = { rock: "paper", paper: "scissors", scissors: "rock" };
export const TARGET = 5; // first to 5 points

// 1 = a wins, -1 = b wins, 0 = tie
export const duel = (a, b) => (a === b ? 0 : BEATS[a] === b ? 1 : -1);

// teams: [[a1, a2?], [b1, b2?]]  picks: { playerId: move }
// Duos: player 1 faces player 1, player 2 faces player 2; each duel won = 1 point.
export function resolveRound(teams, picks) {
  const pts = [0, 0], duels = [];
  for (let i = 0; i < teams[0].length; i++) {
    const a = teams[0][i], b = teams[1][i], r = duel(picks[a], picks[b]);
    duels.push({ a, b, ma: picks[a], mb: picks[b], r });
    if (r > 0) pts[0]++; else if (r < 0) pts[1]++;
  }
  return { pts, duels };
}

// Winning team index, or -1 while nobody has reached the target with a lead.
export function winnerOf(score, target = TARGET) {
  if (Math.max(score[0], score[1]) < target || score[0] === score[1]) return -1;
  return score[0] > score[1] ? 0 : 1;
}

// Duo queue: groups are [uid] (solo) or [uid, uid] (friends teaming up), oldest first.
// Returns two teams of two and the queue indices used, or null.
export function formDuoTeams(queue) {
  const teams = [], used = [];
  let single = -1;
  for (let i = 0; i < queue.length && teams.length < 2; i++) {
    const g = queue[i];
    if (g.length === 2) { teams.push([...g]); used.push(i); }
    else if (single < 0) single = i;
    else { teams.push([queue[single][0], g[0]]); used.push(single, i); single = -1; }
  }
  return teams.length === 2 ? { teams, used } : null;
}
