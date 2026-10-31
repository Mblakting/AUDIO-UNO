const AOTY_API_BASE_URL = "https://aoty.prigoana.com";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) {
    return Response.json({ error: "A search query is required." }, { status: 400 });
  }

  const url = new URL("/search/autocomplete", AOTY_API_BASE_URL);
  url.searchParams.set("q", q);

  try {
    const upstream = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": BROWSER_UA, Accept: "application/json" },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const data: unknown = await upstream.json();
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Upstream blocked or unavailable — return empty suggestions so UI stays clean
    return Response.json(
      { query: q, suggestions: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
