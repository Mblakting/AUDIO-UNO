"use client";

import { useState } from "react";

export default function AlbumCoverImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="cover-placeholder" aria-hidden="true">♪</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  );
}
