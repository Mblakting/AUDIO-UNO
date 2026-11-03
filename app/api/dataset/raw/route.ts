import csvParser from "csv-parser";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { type NextRequest, NextResponse } from "next/server";

const REMOTE_URL =
  process.env.CSV_DATASET_URL ??
  "https://github.com/Mblakting/AUDIO-UNO/releases/download/v1.0.0/AUDIO_Complete_BigData.csv";

const LOCAL_FILE = path.join(process.cwd(), "AUDIO_Complete_BigData.csv");

async function openCsvStream(): Promise<NodeJS.ReadableStream & { cancel?: () => void }> {
  if (fs.existsSync(LOCAL_FILE)) return fs.createReadStream(LOCAL_FILE);
  const res = await fetch(REMOTE_URL);
  if (!res.ok || !res.body) throw new Error(`Failed to fetch remote CSV (HTTP ${res.status})`);
  const nodeStream = Readable.fromWeb(
    res.body as import("stream/web").ReadableStream,
  ) as NodeJS.ReadableStream & { cancel?: () => void };
  nodeStream.cancel = () => res.body!.cancel().catch(() => {});
  return nodeStream;
}

function matchesFilters(
  row: Record<string, string>,
  search: string,
  category: string,
  mustHear: string,
): boolean {
  if (search) {
    const q = search.toLowerCase();
    if (
      !row.artist?.toLowerCase().includes(q) &&
      !row.title?.toLowerCase().includes(q)
    ) return false;
  }
  if (category && row.audio_category !== category && row.mediaType !== category) return false;
  if (mustHear === "true" && row.mustHear?.toLowerCase() !== "true") return false;
  return true;
}

function numVal(s: string | undefined): number {
  const n = parseFloat(s ?? "");
  return isNaN(n) ? -Infinity : n;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const limit     = Math.min(Math.max(parseInt(sp.get("limit") ?? "50", 10), 1), 200);
  const page      = Math.max(parseInt(sp.get("page") ?? "1", 10), 1);
  const search    = sp.get("search")?.trim() ?? "";
  const category  = sp.get("category")?.trim() ?? "";
  const mustHear  = sp.get("mustHear")?.trim() ?? "";
  const sortBy    = sp.get("sortBy")?.trim() ?? "";   // criticScore | userScore | releaseDate
  const sortOrder = sp.get("sortOrder") === "asc" ? "asc" : "desc";

  // When sorting we must collect all matching rows first, then slice
  const needsSort = !!sortBy;
  const skip = needsSort ? 0 : (page - 1) * limit;

  let source: (NodeJS.ReadableStream & { cancel?: () => void }) | null = null;
  try {
    source = await openCsvStream();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not open dataset." },
      { status: 502 },
    );
  }

  return new Promise<NextResponse>((resolve) => {
    const matched: Record<string, string>[] = [];
    let headers: string[] = [];

    const parser = source!.pipe(csvParser());

    parser.on("headers", (h: string[]) => { headers = h; });

    parser.on("data", (row: Record<string, string>) => {
      if (!matchesFilters(row, search, category, mustHear)) return;

      if (!needsSort && matched.length >= skip + limit) {
        parser.destroy();
        source!.cancel?.();
        return;
      }
      matched.push(row);
    });

    parser.on("close", () => {
      let result = matched;

      if (needsSort) {
        result = [...matched].sort((a, b) => {
          let cmp = 0;
          if (sortBy === "criticScore" || sortBy === "userScore") {
            cmp = numVal(a[sortBy]) - numVal(b[sortBy]);
          } else if (sortBy === "releaseDate") {
            cmp = (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "");
          }
          return sortOrder === "asc" ? cmp : -cmp;
        });
      }

      const sliced = needsSort
        ? result.slice((page - 1) * limit, page * limit)
        : result.slice(skip, skip + limit);

      resolve(NextResponse.json(
        { page, limit, count: sliced.length, totalMatched: matched.length, headers, rows: sliced },
        { headers: { "Cache-Control": "no-store" } },
      ));
    });

    parser.on("error", (err: Error) => {
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });
  });
}
