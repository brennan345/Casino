// All randomness goes through here: crypto.getRandomValues, no Math.random.
export function randomInt(n) { // uniform integer in [0, n), rejection sampling to avoid modulo bias
  const max = Math.floor(0x100000000 / n) * n, buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= max);
  return buf[0] % n;
}
export function shuffle(arr) { // Fisher-Yates, returns a new array
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
