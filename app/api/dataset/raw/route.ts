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
  // Prefer local file in dev if it exists (avoids network round-trip)
  if (fs.existsSync(LOCAL_FILE)) {
    return fs.createReadStream(LOCAL_FILE);
  }

  const res = await fetch(REMOTE_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to fetch remote CSV (HTTP ${res.status})`);
  }

  const nodeStream = Readable.fromWeb(res.body as import("stream/web").ReadableStream) as NodeJS.ReadableStream & { cancel?: () => void };
  // Attach cancel so callers can abort the HTTP download early
  nodeStream.cancel = () => res.body!.cancel().catch(() => {});
  return nodeStream;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10), 1), 200);
  const page  = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const skip  = (page - 1) * limit;

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
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];
    let rowIndex = 0;

    const parser = source!.pipe(csvParser());

    parser.on("headers", (h: string[]) => { headers = h; });

    parser.on("data", (row: Record<string, string>) => {
      if (rows.length >= limit) {
        // Stop immediately — destroy parser and cancel HTTP download
        parser.destroy();
        source!.cancel?.();
        return;
      }
      if (rowIndex >= skip) rows.push(row);
      rowIndex++;
    });

    parser.on("close", () => {
      resolve(NextResponse.json(
        { page, limit, count: rows.length, headers, rows },
        { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
      ));
    });

    parser.on("error", (err: Error) => {
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });
  });
}
