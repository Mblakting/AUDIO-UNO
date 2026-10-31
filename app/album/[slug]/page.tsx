import Link from "next/link";
import RawDataViewer from "../../components/RawDataViewer";
import { getAlbumSmart } from "../../services/api";
import type { AlbumDetail } from "../../services/types";
import AlbumCoverImage from "./AlbumCoverImage";

function formatCoverUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  let full = url;
  if (url.startsWith("//")) full = `https:${url}`;
  else if (url.startsWith("/")) full = `https://cdn2.albumoftheyear.org${url}`;
  return `/api/proxy-image?url=${encodeURIComponent(full)}`;
}

function Score({ label, value, count }: { label: string; value: string; count: string }) {
  return (
    <div className="entity-score">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{count} ratings</small>
    </div>
  );
}

function AlbumDetails({ album }: { album: AlbumDetail }) {
  return (
    <>
      <section className="album-detail-hero">
        <div className="album-detail-cover">
          <AlbumCoverImage src={formatCoverUrl(album.cover)} alt={`${album.title} cover`} />
        </div>
        <div className="album-detail-copy">
          <p className="eyebrow">ALBUM / {album.format}</p>
          <h1>{album.title}</h1>
          <p className="album-detail-artist">{album.artist}</p>
          <p className="album-detail-meta">
            {album.datePublished} {album.label ? `· ${album.label}` : ""}
          </p>
          <div className="entity-scores">
            <Score label="Critic" value={album.criticScore} count={album.criticCount} />
            <Score label="Community" value={album.userScore} count={album.userCount} />
          </div>
          <div className="genre-chips">
            {album.genres.map((genre) => <span key={genre}>{genre}</span>)}
            {album.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
          </div>
        </div>
        <RawDataViewer data={album} fetchedAt={new Date().toISOString()} />
      </section>

      <section className="album-data-section">
        <div>
          <p className="eyebrow">TRACKLIST</p>
          <h2>{album.tracklist.length} tracks</h2>
          <ol className="album-tracklist">
            {album.tracklist.map((track) => (
              <li key={`${track.number}-${track.url}`}>
                <span className="track-number">{track.number}</span>
                <span className="track-title">{track.title}</span>
                <span className="track-duration">{track.length}</span>
                <span className="track-rating">{track.rating}</span>
              </li>
            ))}
          </ol>
        </div>
        <aside className="album-side-data">
          <div>
            <p className="eyebrow">LISTEN</p>
            {album.streamingLinks.map((link) => (
              <a href={link.url} key={`${link.platform}-${link.url}`} rel="noreferrer" target="_blank">
                {link.platform} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <div>
            <p className="eyebrow">CRITIC REVIEWS</p>
            {album.reviews.map((review, index) => (
              <article className="critic-review" key={`${review.publication}-${index}`}>
                <strong>{review.publication}</strong>
                <span>{review.score} · {review.author || "Staff"}</span>
                {review.text && <p>{review.text}</p>}
              </article>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let album: AlbumDetail | undefined;
  let error: string | undefined;
  try {
    album = await getAlbumSmart(slug);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Album request failed.";
  }

  return (
    <main className="site-shell explorer-page">
      <div className="breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span>Album</div>
      {album ? (
        <AlbumDetails album={album} />
      ) : (
        <div className="empty-state" role="status">
          <span className="empty-icon" aria-hidden="true">♪</span>
          <h3>Album unavailable</h3>
          <p>This album could not be loaded from the provider. It may require a full slug — try navigating from the home catalog.</p>
          {error && <p className="error-detail">{error}</p>}
          <Link className="retry-button" href="/">Back to catalog <span aria-hidden="true">↗</span></Link>
        </div>
      )}
    </main>
  );
}
