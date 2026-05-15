/**
 * Dusk Office — compact syntax preview (English only).
 * Covers common tokens: types, literals, control flow, async, templates.
 */

const API_VERSION = 1;
const TAG_RE = /^[a-z][a-z0-9-]*$/i;
const DEFAULT_LOCALE = "en-US" as const;

type Status = "idle" | "loading" | "ok" | "error";

interface FetchResult<T> {
  status: Status;
  data?: T;
  message?: string;
}

/** Returns a delayed promise for theme / async highlighting. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadConfig(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<FetchResult<Record<string, unknown>>> {
  const url = `${baseUrl.replace(/\/$/, "")}/config.json`;

  try {
    await delay(12);
    const res = await fetch(url, { signal });
    if (!res.ok) {
      return { status: "error", message: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as Record<string, unknown>;
    return { status: "ok", data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { status: "error", message };
  }
}

export function validateTag(tag: string): boolean {
  if (tag.length === 0 || tag.length > 64) return false;
  return TAG_RE.test(tag);
}

// Numeric edge cases for highlighting
export const ratios = [0, 0.5, 1, 2.718_281_828, Number.NaN, Number.POSITIVE_INFINITY];

void (async () => {
  const r = await loadConfig("https://example.invalid", undefined);
  if (r.status === "ok" && r.data) {
    console.info("locale", DEFAULT_LOCALE, "version", API_VERSION);
  }
})();
