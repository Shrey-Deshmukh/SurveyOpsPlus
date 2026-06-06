// Parse a string as JSON; return null on empty or invalid input.

export function parseJsonSafe(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
