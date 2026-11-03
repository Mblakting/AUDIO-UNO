"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ApiResponse = {
  page: number;
  limit: number;
  count: number;
  headers: string[];
  rows: Record<string, string>[];
};

function TableSkeleton() {
  return (
    <div className="raw-skeleton" aria-label="Loading dataset…">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

export default function RawDataPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dataset/raw?limit=${limit}&page=${p}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dataset.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <main className="site-shell explorer-page">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        Raw Dataset
      </div>

      <section className="explorer-heading">
        <div>
          <p className="eyebrow">LOCAL CSV · AUDIO_Complete_BigData.csv</p>
          <h1>Raw Dataset</h1>
          <p className="explorer-subtitle">
            Streaming preview — {limit} rows per page. Full file is ~113 MB and is never fully loaded into memory.
          </p>
        </div>
      </section>

      {loading && <TableSkeleton />}

      {error && (
        <div className="empty-state" role="alert">
          <span className="empty-icon" aria-hidden="true">!</span>
          <h3>Could not load dataset</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={() => load(page)}>
            Retry <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="raw-table-meta">
            <span>Page {data.page}</span>
            <span>{data.count} rows shown · {data.headers.length} columns</span>
          </div>

          <div className="raw-table-wrap">
            <table className="raw-table">
              <thead>
                <tr>
                  <th className="raw-table-index">#</th>
                  {data.headers.map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    <td className="raw-table-index">{(page - 1) * limit + i + 1}</td>
                    {data.headers.map((h) => (
                      <td key={h} title={row[h]}>
                        {row[h] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              className="retry-button"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              style={{ opacity: page <= 1 ? 0.35 : 1 }}
            >
              ← Prev
            </button>
            <span>Page {page}</span>
            <button
              className="retry-button"
              disabled={data.count < limit}
              onClick={() => load(page + 1)}
              style={{ opacity: data.count < limit ? 0.35 : 1 }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </main>
  );
}
