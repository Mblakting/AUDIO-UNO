import csvParser from "csv-parser";
import fs from "fs";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";

const CSV_FILE = path.join(process.cwd(), "AUDIO_Complete_BigData.csv");

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10), 1), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const skip = (page - 1) * limit;

  if (!fs.existsSync(CSV_FILE)) {
    return NextResponse.json({ error: "Dataset file not found." }, { status: 404 });
  }

  return new Promise<NextResponse>((resolve) => {
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];
    let rowIndex = 0;
    let collected = 0;

    const stream = fs.createReadStream(CSV_FILE)
      .pipe(csvParser());

    stream.on("headers", (h: string[]) => { headers = h; });

    stream.on("data", (row: Record<string, string>) => {
      if (collected >= limit) {
        stream.destroy();
        return;
      }
      if (rowIndex >= skip) {
        rows.push(row);
        collected++;
      }
      rowIndex++;
    });

    stream.on("close", () => {
      resolve(NextResponse.json(
        { page, limit, count: rows.length, headers, rows },
        { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
      ));
    });

    stream.on("error", (err: Error) => {
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });
  });
}
