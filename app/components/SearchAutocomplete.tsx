"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Suggestion = {
  label: string;
  href: string;
  kind: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

function getSuggestions(payload: unknown): Suggestion[] {
  const records: Array<{ value: Record<string, unknown>; kind: string }> = [];
  if (isRecord(payload)) {
    if (Array.isArray(payload.suggestions)) {
      for (const item of payload.suggestions) {
        if (isRecord(item)) {
          records.push({ value: item, kind: asText(item.type) ?? "search" });
        }
      }
    } else {
      for (const kind of ["albums", "artists", "songs", "labels", "users"]) {
        const items = payload[kind];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (isRecord(item)) records.push({ value: item, kind: kind.slice(0, -1) });
          }
        }
      }
    }
  }

  return records.slice(0, 8).flatMap(({ value, kind }) => {
    const label = asText(value.label) ?? asText(value.title) ??
      asText(value.name) ?? asText(value.username) ?? asText(value.value);
    if (!label) return [];
    const rawUrl = asText(value.link) ?? asText(value.url) ?? asText(value.href);
    const safeKind = ["album", "artist", "song", "label", "user"].includes(kind)
      ? kind
      : "search";
    let href = safeKind === "search"
      ? `/search?q=${encodeURIComponent(label)}`
      : `/${safeKind}/${encodeURIComponent(asText(value.slug) ?? asText(value.id) ?? label)}`;
    if (rawUrl) {
      try {
        const url = new URL(rawUrl, "https://www.albumoftheyear.org");
        const segments = url.pathname.split("/").filter(Boolean);
        const route = segments.find((segment) => ["album", "artist", "song", "label", "user"].includes(segment));
        if (url.hostname.endsWith("albumoftheyear.org") && route && segments[segments.indexOf(route) + 1]) {
          href = `/${route}/${segments[segments.indexOf(route) + 1].replace(/\.php$/, "")}`;
        }
      } catch {
        // The API-provided label remains usable even if its link is malformed.
      }
    }
    return [{ label, href, kind }];
  });
}

export default function SearchAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      setSuggestions([]);
      try {
        const response = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(value)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const results: unknown = await response.json();
        if (!response.ok) {
          const message =
            isRecord(results) && typeof results.error === "string"
              ? results.error
              : `Search failed with status ${response.status}.`;
          throw new Error(message);
        }
        if (!controller.signal.aborted) setSuggestions(getSuggestions(results));
      } catch (cause) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setError(cause instanceof Error ? cause.message : "Autocomplete request failed.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <form action="/search" className="search-form" role="search">
      <label className="sr-only" htmlFor="site-search">Search albums, artists, songs, and labels</label>
      <input
        autoComplete="off"
        id="site-search"
        name="q"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search music..."
        value={query}
      />
      <button aria-label="Search" type="submit">⌕</button>
      {query.trim().length >= 2 && (suggestions.length > 0 || error || loading) && (
        <div className="search-suggestions" role="listbox">
          {loading && <p className="search-message">Searching...</p>}
          {error && <p className="search-message search-error" role="status">{error}</p>}
          {suggestions.map((suggestion, index) => (
            <Link
              className="search-suggestion"
              href={suggestion.href}
              key={`${suggestion.kind}-${suggestion.href}-${index}`}
              onClick={() => setSuggestions([])}
              role="option"
            >
              <span>{suggestion.label}</span>
              <small>{suggestion.kind}</small>
            </Link>
          ))}
          <Link className="search-all" href={`/search?q=${encodeURIComponent(query.trim())}`}>
            View all results <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
    </form>
  );
}
