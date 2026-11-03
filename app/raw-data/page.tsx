"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const CSV_URL =
  "https://github.com/Mblakting/AUDIO-UNO/releases/download/v1.0.0/AUDIO_Complete_BigData.csv";

const ALL_COLS = ["url","artist","title","cover","mediaType","releaseDate",
  "criticScore","criticCount","userScore","userCount","mustHear","audio_category","page_source"];

const DEFAULT_HIDDEN = new Set(["url","cover","criticCount","userCount","page_source"]);

type Row = Record<string, string>;
type ApiResponse = {
  page: number; limit: number; count: number; totalMatched: number;
  headers: string[]; rows: Row[];
};

// ── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ rows }: { rows: Row[] }) {
  const scores = (key: string) => rows.map(r => parseFloat(r[key])).filter(n => !isNaN(n));
  const avg = (arr: number[]) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : "—";
  const mustHearCount = rows.filter(r => r.mustHear?.toLowerCase() === "true").length;
  const cats: Record<string,number> = {};
  rows.forEach(r => { if (r.audio_category) cats[r.audio_category] = (cats[r.audio_category]??0)+1; });
  const topCats = Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,3);

  return (
    <div className="stats-bar">
      <div className="stat-chip"><span>Rows shown</span><strong>{rows.length}</strong></div>
      <div className="stat-chip"><span>Avg Critic</span><strong>{avg(scores("criticScore"))}</strong></div>
      <div className="stat-chip"><span>Avg User</span><strong>{avg(scores("userScore"))}</strong></div>
      <div className="stat-chip"><span>Must Hear</span><strong>{mustHearCount}</strong></div>
      {topCats.map(([cat,n]) => (
        <div className="stat-chip" key={cat}><span>{cat}</span><strong>{n}</strong></div>
      ))}
    </div>
  );
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="raw-overlay" role="presentation"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="raw-panel" ref={ref} role="dialog" aria-modal="true" aria-label="Row detail">
        <header className="raw-header">
          <div>
            <p className="eyebrow">ROW DETAIL</p>
            <h2>{row.title || "—"}</h2>
            <p style={{ margin:"4px 0 0", color:"var(--muted)", fontSize:13 }}>{row.artist}</p>
          </div>
          <button className="raw-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        {row.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/proxy-image?url=${encodeURIComponent(row.cover)}`}
            alt={row.title} referrerPolicy="no-referrer"
            style={{ width:120, height:120, objectFit:"cover", border:"1px solid var(--line)", margin:"16px 0" }}
            onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
        )}

        <div className="raw-metadata" style={{ flexDirection:"column", gap:6 }}>
          {ALL_COLS.map(col => (
            <div key={col} style={{ display:"flex", gap:12, fontSize:12, padding:"5px 0",
              borderBottom:"1px solid var(--line)" }}>
              <span style={{ color:"var(--muted)", minWidth:120, fontFamily:"Courier New,monospace",
                fontSize:10, textTransform:"uppercase" }}>{col}</span>
              <span style={{ color:"var(--foreground)", wordBreak:"break-all" }}>{row[col] || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Export utils ─────────────────────────────────────────────────────────────
function exportCsv(headers: string[], rows: Row[]) {
  const lines = [headers.join(","),
    ...rows.map(r => headers.map(h => `"${(r[h]??"").replace(/"/g,'""')}"`).join(","))];
  const blob = new Blob([lines.join("\n")], { type:"text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "filtered_view.csv"; a.click();
}

function exportJson(rows: Row[]) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type:"application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "filtered_view.json"; a.click();
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="raw-skeleton" aria-label="Loading dataset…">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RawDataPage() {
  const [data, setData]           = useState<ApiResponse | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("");
  const [mustHear, setMustHear]   = useState("");
  const [sortBy, setSortBy]       = useState("");
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("desc");
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(DEFAULT_HIDDEN));
  const [showColMenu, setShowColMenu] = useState(false);
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const limit = 50;

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ limit: String(limit), page: String(p) });
    if (search)    params.set("search", search);
    if (category)  params.set("category", category);
    if (mustHear)  params.set("mustHear", mustHear);
    if (sortBy)    params.set("sortBy", sortBy);
    if (sortBy)    params.set("sortOrder", sortOrder);
    return `/api/dataset/raw?${params}`;
  }, [search, category, mustHear, sortBy, sortOrder]);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(buildUrl(p));
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setData(await res.json()); setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dataset.");
    } finally { setLoading(false); }
  }, [buildUrl]);

  useEffect(() => { load(1); }, [load]);

  const visibleCols = ALL_COLS.filter(c => !hiddenCols.has(c));
  const toggleCol = (col: string) =>
    setHiddenCols(prev => { const s = new Set(prev); s.has(col) ? s.delete(col) : s.add(col); return s; });

  return (
    <main className="site-shell explorer-page">
      <div className="breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>Raw Dataset
      </div>

      <section className="explorer-heading">
        <div>
          <p className="eyebrow">RAW CSV · AUDIO_Complete_BigData.csv · 113 MB</p>
          <h1>Raw Dataset</h1>
          <p className="explorer-subtitle">
            Stream-filtered preview — {limit} rows per page, never fully loaded into memory.
          </p>
        </div>
        <a className="retry-button" href={CSV_URL} target="_blank" rel="noreferrer">
          ↓ Download Full CSV
        </a>
      </section>

      {/* ── Controls ── */}
      <div className="raw-controls">
        <input className="raw-search" placeholder="Search artist or title…"
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)} />

        <select className="raw-select" value={category} onChange={e => { setCategory(e.target.value); }}>
          <option value="">All categories</option>
          {["New Albums","Anticipated","Top Rated","Singles & EPs"].map(c =>
            <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="raw-select" value={mustHear} onChange={e => setMustHear(e.target.value)}>
          <option value="">All</option>
          <option value="true">Must Hear only</option>
          <option value="false">Non-Must Hear</option>
        </select>

        <select className="raw-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="">No sort</option>
          <option value="criticScore">Critic Score</option>
          <option value="userScore">User Score</option>
          <option value="releaseDate">Release Date</option>
        </select>

        <button className="raw-sort-btn" onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>
          {sortOrder === "desc" ? "↓ DESC" : "↑ ASC"}
        </button>

        <button className="retry-button" onClick={() => load(1)}>Apply</button>

        {/* Column toggle */}
        <div style={{ position:"relative" }}>
          <button className="raw-sort-btn" onClick={() => setShowColMenu(v => !v)}>
            Columns ({visibleCols.length})
          </button>
          {showColMenu && (
            <div className="col-menu">
              {ALL_COLS.map(col => (
                <label key={col} className="col-menu-item">
                  <input type="checkbox" checked={!hiddenCols.has(col)}
                    onChange={() => toggleCol(col)} />
                  {col}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Export buttons */}
        {data && <>
          <button className="raw-sort-btn"
            onClick={() => exportCsv(data.headers, data.rows)}>↓ CSV</button>
          <button className="raw-sort-btn"
            onClick={() => exportJson(data.rows)}>↓ JSON</button>
        </>}
      </div>

      {loading && <TableSkeleton />}

      {error && (
        <div className="empty-state" role="alert">
          <span className="empty-icon" aria-hidden="true">!</span>
          <h3>Could not load dataset</h3><p>{error}</p>
          <button className="retry-button" onClick={() => load(page)}>Retry ↗</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <StatsBar rows={data.rows} />

          <div className="raw-table-meta">
            <span>Page {data.page} · {data.count} rows shown</span>
            <span>{data.totalMatched} matched · {visibleCols.length} columns visible</span>
          </div>

          <div className="raw-table-wrap">
            <table className="raw-table">
              <thead>
                <tr>
                  <th className="raw-table-index">#</th>
                  {visibleCols.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="raw-table-row" onClick={() => setDetailRow(row)}
                    title="Click for full detail">
                    <td className="raw-table-index">{(page-1)*limit+i+1}</td>
                    {visibleCols.map(h => (
                      <td key={h} title={row[h]}>{row[h] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="retry-button" disabled={page<=1}
              onClick={() => load(page-1)} style={{ opacity: page<=1 ? 0.35 : 1 }}>← Prev</button>
            <span>Page {page}</span>
            <button className="retry-button" disabled={data.count < limit}
              onClick={() => load(page+1)} style={{ opacity: data.count<limit ? 0.35 : 1 }}>Next →</button>
          </div>
        </>
      )}

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </main>
  );
}
