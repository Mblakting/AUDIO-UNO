"use client";

import Link from "next/link";
import { useState } from "react";
import type { AlbumDetail } from "../services/types";

function formatCoverUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  let full = url;
  if (url.startsWith("//")) full = `https:${url}`;
  else if (url.startsWith("/")) full = `https://cdn2.albumoftheyear.org${url}`;
  return `/api/proxy-image?url=${encodeURIComponent(full)}`;
}

function getText(record: AlbumDetail, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function getAlbumPath(album: AlbumDetail): string | undefined {
  const directSlug = getText(album, ["id"]);
  if (directSlug) return `/album/${encodeURIComponent(directSlug)}`;
  const link = getText(album, ["url"]);
  if (!link) return undefined;
  try {
    const parsed = new URL(link, "https://www.albumoftheyear.org");
    if (!parsed.hostname.endsWith("albumoftheyear.org")) return undefined;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const albumIndex = segments.indexOf("album");
    const slug = albumIndex >= 0 ? segments[albumIndex + 1] : undefined;
    return slug ? `/album/${encodeURIComponent(slug.replace(/\.php$/, ""))}` : undefined;
  } catch {
    return undefined;
  }
}

function AlbumCover({
  image,
  title,
  index,
}: {
  image?: string;
  title: string;
  index: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = formatCoverUrl(image);
  return (
    <div className={`album-cover cover-tone-${index % 6}`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${title} cover`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        <span className="cover-placeholder" aria-hidden="true">♪</span>
      )}
    </div>
  );
}

export default function AlbumCard({
  album,
  index,
}: {
  album: AlbumDetail;
  index: number;
}) {
  const title = album.title || "Untitled release";
  const artist = album.artist || "Unknown artist";
  const image = album.cover;
  const date = album.datePublished;
  const rating = getText(album, ["criticScore"]);
  const link = getAlbumPath(album);
  const score = rating ? Number(rating) : NaN;
  const displayedRating = Number.isFinite(score) ? (score / 10).toFixed(1) : rating;

  return (
    <article className="album-card">
      {link ? (
        <Link className="album-cover-link" href={link} aria-label={`View ${title} by ${artist}`}>
          <AlbumCover image={image} title={title} index={index} />
        </Link>
      ) : (
        <div className="album-cover-link">
          <AlbumCover image={image} title={title} index={index} />
        </div>
      )}
      <div className="album-info">
        <div className="album-heading">
          <h2>{title}</h2>
          {displayedRating && <span className="rating">{displayedRating}</span>}
        </div>
        <p className="album-artist">{artist}</p>
        {date && <p className="album-date">{date}</p>}
      </div>
    </article>
  );
}
