import Constants from "expo-constants";

// Extracts the laptop/dev host from Expo runtime metadata so physical Expo Go
// can call local backend services on the same host.
// Example: "exp://10.221.123.70:8081/--/" -> "10.221.123.70"
function parseHostFromExpoValue(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return null;
  }

  if (trimmed.includes("://")) {
    try {
      const host = new URL(trimmed).hostname || null;
      return host && /^[a-zA-Z0-9.-]+$/.test(host) ? host : null;
    } catch {
      return null;
    }
  }

  // Metro debugger host, e.g. "192.168.4.46:8081"
  const host = trimmed.split(":")[0] ?? null;
  return host && /^[a-zA-Z0-9.-]+$/.test(host) ? host : null;
}

export function resolveExpoGoDevHost(): string | null {
  const constantsAny = Constants as typeof Constants & {
    expoGoConfig?: {
      debuggerHost?: string;
      developer?: {
        debuggerHost?: string;
      };
    } | null;
  };

  const candidates: unknown[] = [
    Constants.expoConfig?.hostUri,
    constantsAny.expoGoConfig?.debuggerHost,
    constantsAny.expoGoConfig?.developer?.debuggerHost,
    Constants.linkingUri,
    Constants.experienceUrl,
  ];

  for (const candidate of candidates) {
    const host = parseHostFromExpoValue(candidate);
    if (host) {
      return host;
    }
  }

  return null;
}