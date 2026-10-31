import { type NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.albumoftheyear.org/",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

async function tryFetch(url: string): Promise<Response | null> {
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, next: { revalidate: 86400 } });
    if (r.ok) return r;
  } catch { /* ignore */ }
  return null;
}

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");
  if (!imageUrl) return new NextResponse("Missing URL", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  if (!parsed.hostname.includes("albumoftheyear.org")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Try AOTY CDN directly
  const upstream = await tryFetch(parsed.toString());
  if (upstream) {
    const contentType = upstream.headers.get("Content-Type") ?? "image/jpeg";
    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  // AOTY CDN blocked — redirect browser to fetch directly (no server hop)
  return NextResponse.redirect(parsed.toString(), { status: 302 });
}
