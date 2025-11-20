export function calcBackoff(attempt: number, baseMs = 1000, maxMs = 60000) {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitter = Math.floor(Math.random() * (exp * 0.2));
  return exp + jitter;
}
