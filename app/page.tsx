import Link from "next/link";
import AlbumCard from "./components/AlbumCard";
import { getVerifiedAlbumCatalog } from "./services/api";
import type { AlbumDetail } from "./services/types";

export default async function Home() {
  let albums: AlbumDetail[] = [];
  let apiError: string | undefined;
  try {
    albums = await getVerifiedAlbumCatalog();
  } catch (error) {
    apiError =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while loading the verified album.";
  }

  return (
    <main className="site-shell">
      <section className="hero">
        <p className="eyebrow">YOUR NEXT FAVORITE ALBUM STARTS HERE</p>
        <h1>Music worth<br /><span>your attention.</span></h1>
        <p className="hero-copy">
          Explore a live-verified collection of essential albums, with ratings, tracklists, and reviews.
        </p>
        <div className="hero-decoration" aria-hidden="true">♪</div>
      </section>

      <section className="release-section" aria-labelledby="release-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AOTY ALBUM EXPLORER</p>
            <h2 id="release-heading">Albums to explore</h2>
          </div>
          <span className="page-indicator">{albums.length} LIVE ALBUMS</span>
        </div>

        {apiError ? (
          <div className="empty-state" role="status">
            <span className="empty-icon" aria-hidden="true">!</span>
            <h3>Verified album data is unavailable</h3>
            <p>
              This page only uses the album endpoint that returned valid live data during endpoint
              checks. The current request failed, so no stale or fabricated data is shown.
            </p>
            <p className="error-detail">{apiError}</p>
            <Link className="retry-button" href="/">
              Retry <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : albums.length ? (
          <div className="album-grid">
            {albums.map((album, index) => (
              <AlbumCard
                album={album}
                index={index}
                key={`${album.id}-${album.title}`}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state" role="status">
            <span className="empty-icon" aria-hidden="true">♪</span>
            <h3>No album data</h3>
            <p>The API did not return a validated album response.</p>
          </div>
        )}
      </section>

      <footer className="site-footer">
        <span>AOTY.EXPLORER</span>
        <span>Made for people who listen closely.</span>
      </footer>
    </main>
  );
}
