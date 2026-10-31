import Link from "next/link";
import AlbumCard from "../components/AlbumCard";
import { getVerifiedAlbumCatalog } from "../services/api";
import type { AlbumDetail } from "../services/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <main className="site-shell explorer-page">
        <div className="breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span>Search</div>
        <section className="explorer-heading">
          <div>
            <p className="eyebrow">AOTY REAL-TIME EXPLORER</p>
            <h1>Search</h1>
            <p className="explorer-subtitle">Search albums in the currently verified live catalog.</p>
          </div>
        </section>
      </main>
    );
  }

  let matches: AlbumDetail[] = [];
  let error: string | undefined;
  try {
    const albums = await getVerifiedAlbumCatalog();
    const normalizedQuery = query.toLocaleLowerCase();
    matches = albums.filter((album) =>
      `${album.title} ${album.artist}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "The live album search failed.";
  }

  return (
    <main className="site-shell explorer-page">
      <div className="breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span>Search</div>
      <section className="explorer-heading">
        <div>
          <p className="eyebrow">VERIFIED LIVE ALBUMS</p>
          <h1>Search</h1>
          <p className="explorer-subtitle">Results for “{query}” within the live albums available from the verified API endpoint.</p>
        </div>
      </section>
      {error ? (
        <div className="api-error" role="alert">
          <strong>Search data could not be loaded.</strong>
          <p>{error}</p>
        </div>
      ) : matches.length ? (
        <section aria-label="Album search results" className="album-grid search-results">
          {matches.map((album, index) => (
            <AlbumCard album={album} index={index} key={`${album.id}-${album.title}`} />
          ))}
        </section>
      ) : (
        <div className="empty-state" role="status">
          <span className="empty-icon" aria-hidden="true">⌕</span>
          <h3>No matching album in the verified live catalog</h3>
          <p>The API search endpoint is currently returning upstream errors, so results are limited to successfully retrieved album records.</p>
        </div>
      )}
    </main>
  );
}
