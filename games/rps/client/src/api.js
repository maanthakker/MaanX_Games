const KEY = "rock-paper-scissors-token";
export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* storage blocked */ } };

export async function api(path, { method = "GET", body } = {}) {
  const t = getToken();
  const res = await fetch("/rps/api" + path, {
    method,
    headers: { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
