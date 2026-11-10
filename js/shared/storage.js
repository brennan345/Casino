// Thin localStorage wrapper. Everything is namespaced and JSON-encoded; never throws.
const P = 'cp:';
export const storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(P + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(P + key, JSON.stringify(value)); } catch {} },
  remove(key) { try { localStorage.removeItem(P + key); } catch {} }
};
