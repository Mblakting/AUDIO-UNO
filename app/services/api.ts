import type { AlbumDetail, HealthResponse } from "./types";

export const AOTY_API_BASE_URL = "https://aoty.prigoana.com";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// ─── Core helper ────────────────────────────────────────────────────────────

export function fetchWithUA(url: string | URL, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    next: { revalidate: 3600 },
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
}

async function fetchJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, AOTY_API_BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  const response = await fetchWithUA(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AOTY API ${path} failed (${response.status})${body ? `: ${body}` : ""}`);
  }
  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new Error(`AOTY API ${path} returned invalid JSON.`, { cause });
  }
}

// ─── Type guard ──────────────────────────────────────────────────────────────

function isAlbumDetail(value: unknown): value is AlbumDetail {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.title === "string" &&
    typeof a.artist === "string" &&
    typeof a.url === "string" &&
    Array.isArray(a.tracklist)
  );
}

// ─── Slug utilities ──────────────────────────────────────────────────────────

/**
 * Returns true when the input is a bare numeric ID (e.g. "2916").
 * Bare numeric IDs always 500 on the upstream — they need a full slug.
 */
function isNumericOnly(s: string): boolean {
  return /^\d+$/.test(s.trim());
}

/**
 * Extracts artist + name tokens from a full slug like "362-radiohead-ok-computer".
 * Returns null when the slug has no usable tokens after the leading ID.
 */
function tokensFromSlug(slug: string): { artist: string; name: string } | null {
  const withoutId = slug.replace(/^\d+-/, "");
  const parts = withoutId.split("-").filter(Boolean);
  if (parts.length < 2) return null;
  return { artist: parts[0], name: parts.slice(1).join(" ") };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetchJson<unknown>("/health");
  if (
    typeof response !== "object" ||
    response === null ||
    Array.isArray(response) ||
    (response as Record<string, unknown>).status !== "ok"
  ) {
    throw new Error("AOTY health endpoint returned an unexpected response.");
  }
  return response as HealthResponse;
}

export async function getAlbum(slug: string): Promise<AlbumDetail> {
  if (!slug.trim()) throw new Error("An album slug is required.");
  const response = await fetchJson<unknown>("/album", { slug, minimal: "true" });
  if (!isAlbumDetail(response)) throw new Error("AOTY album endpoint returned an unexpected response.");
  return response;
}

/**
 * Resilient album loader.
 *
 * Runtime-verified behaviour (probe 2025):
 *   - Bare numeric IDs (e.g. "2916") always return 500 — upstream needs a full slug.
 *   - Full slugs (e.g. "362-radiohead-ok-computer") with minimal=true return 200.
 *   - /search/* endpoints all return 500 (upstream 403) — cannot be used for ID resolution.
 *
 * Strategy:
 *   1. Full slug → /album?slug&minimal=true          (fastest, most reliable)
 *   2. Full slug → /album/summary?slug&minimal=true  (lighter fallback)
 *   3. Tokens from slug → /album?artist&name&minimal=true
 *   4. Bare numeric ID → throw immediately with a clear message
 */
export async function getAlbumSmart(slugOrId: string): Promise<AlbumDetail> {
  const input = slugOrId.trim();
  if (!input) throw new Error("An album slug is required.");

  // Bare numeric IDs cannot be resolved — upstream always 500.
  if (isNumericOnly(input)) {
    throw new Error(
      `Numeric-only ID "${input}" cannot be resolved: the upstream API requires a full slug (e.g. "${input}-artist-album-title"). Follow a link from the home catalog to reach a valid album page.`,
    );
  }

  // Attempt 1: full slug with minimal=true
  try {
    const r = await fetchJson<unknown>("/album", { slug: input, minimal: "true" });
    if (isAlbumDetail(r)) return r;
  } catch { /* fall through */ }

  // Attempt 2: /album/summary (lighter — fewer PHP sub-requests)
  try {
    const r = await fetchJson<unknown>("/album/summary", { slug: input, minimal: "true" });
    if (isAlbumDetail(r)) return r;
  } catch { /* fall through */ }

  // Attempt 3: extract artist + name tokens from slug
  const tokens = tokensFromSlug(input);
  if (tokens) {
    try {
      const r = await fetchJson<unknown>("/album", {
        artist: tokens.artist,
        name: tokens.name,
        minimal: "true",
      });
      if (isAlbumDetail(r)) return r;
    } catch { /* fall through */ }
  }

  throw new Error(`Album "${input}" could not be loaded. All upstream attempts returned 403/500.`);
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

// Every entry below is runtime-verified (HTTP 200) with minimal=true.
const catalogLookups = [
  { artist: "Radiohead", name: "OK Computer" },
  { artist: "Radiohead", name: "Kid A" },
  { artist: "Radiohead", name: "In Rainbows" },
  { artist: "Kendrick Lamar", name: "good kid, m.A.A.d city" },
  { artist: "Kendrick Lamar", name: "DAMN." },
  { artist: "Kendrick Lamar", name: "untitled unmastered." },
  { artist: "Kanye West", name: "Graduation" },
  { artist: "Kanye West", name: "My Beautiful Dark Twisted Fantasy" },
  { artist: "Kanye West", name: "The College Dropout" },
  { artist: "Kanye West", name: "Late Registration" },
  { artist: "Frank Ocean", name: "Blonde" },
  { artist: "Frank Ocean", name: "channel ORANGE" },
  { artist: "The Beatles", name: "Abbey Road" },
  { artist: "The Beatles", name: "Revolver" },
  { artist: "Daft Punk", name: "Discovery" },
  { artist: "Nas", name: "Illmatic" },
  { artist: "OutKast", name: "Aquemini" },
  { artist: "Tyler, The Creator", name: "Flower Boy" },
  { artist: "Drake", name: "Take Care" },
  { artist: "Amy Winehouse", name: "Back to Black" },
  { artist: "The Weeknd", name: "After Hours" },
  { artist: "J. Cole", name: "2014 Forest Hills Drive" },
] as const;

async function getAlbumByArtistAndName(artist: string, name: string): Promise<AlbumDetail | null> {
  try {
    const response = await fetchJson<unknown>("/album", { artist, name, minimal: "true" });
    return isAlbumDetail(response) ? response : null;
  } catch {
    return null;
  }
}

export async function getVerifiedAlbumCatalog(): Promise<AlbumDetail[]> {
  const results = await Promise.all(
    catalogLookups.map(({ artist, name }) => getAlbumByArtistAndName(artist, name)),
  );
  return results.filter((r): r is AlbumDetail => r !== null);
}
