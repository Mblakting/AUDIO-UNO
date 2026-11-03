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

// ── Badge helpers ─────────────────────────────────────────────────────────────
const MEDIA_COLORS: Record<string, string> = {
  lp:      "bg-violet-500/20 text-violet-300",
  ep:      "bg-blue-500/20 text-blue-300",
  single:  "bg-sky-500/20 text-sky-300",
  reissue: "bg-amber-500/20 text-amber-300",
  mixtape: "bg-pink-500/20 text-pink-300",
  live:    "bg-teal-500/20 text-teal-300",
  compilation: "bg-orange-500/20 text-orange-300",
};

function Badge({ value, col }: { value: string; col: string }) {
  if (!value) return <span className="text-white/20">—</span>;

  if (col === "mustHear") {
    return value.toLowerCase() === "true"
      ? <span title="Must Hear" className="text-amber-400 text-base leading-none">★</span>
      : <span className="text-white/20">—</span>;
  }

  if (col === "mediaType") {
    const key = value.toLowerCase().replace(/\s+/g, "");
    const cls = MEDIA_COLORS[key] ?? "bg-white/10 text-white/50";
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${cls}`}>
        {value}
      </span>
    );
  }

  if (col === "audio_category") {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/50 border border-white/10">
        {value}
      </span>
    );
  }

  return null;
}

function CellValue({ col, value }: { col: string; value: string }) {
  const badgeCols = new Set(["mustHear","mediaType","audio_category"]);
  const numericCols = new Set(["criticScore","userScore","criticCount","userCount","page_source"]);

  if (badgeCols.has(col)) return <Badge value={value} col={col} />;

  if (numericCols.has(col)) {
    return (
      <span className="tabular-nums text-right block text-white/70 font-mono text-xs">
        {value || "—"}
      </span>
    );
  }

  if (col === "releaseDate") {
    return <span className="text-white/50 text-xs whitespace-nowrap">{value || "—"}</span>;
  }

  return (
    <span className="text-white/85 truncate block max-w-[200px]" title={value}>
      {value || "—"}
    </span>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ rows }: { rows: Row[] }) {
  const scores = (key: string) => rows.map(r => parseFloat(r[key])).filter(n => !isNaN(n));
  const avg = (arr: number[]) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : "—";
  const mustHearCount = rows.filter(r => r.mustHear?.toLowerCase() === "true").length;
  const cats: Record<string,number> = {};
  rows.forEach(r => { if (r.audio_category) cats[r.audio_category] = (cats[r.audio_category]??0)+1; });
  const topCats = Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,3);

  const metrics = [
    { label: "Rows Shown",  value: String(rows.length) },
    { label: "Avg Critic",  value: avg(scores("criticScore")), accent: true },
    { label: "Avg User",    value: avg(scores("userScore")),   accent: true },
    { label: "Must Hear",   value: String(mustHearCount),      star: true },
    ...topCats.map(([cat, n]) => ({ label: cat, value: String(n) })),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
      {metrics.map(({ label, value, accent, star }) => (
        <div key={label}
          className="flex flex-col gap-1.5 p-3 rounded-lg border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent">
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">{label}</span>
          <strong className={`text-2xl font-bold leading-none tabular-nums ${
            accent ? "text-[#d1f267]" : star ? "text-amber-400" : "text-white"
          }`}>
            {star && value !== "0" ? "★ " : ""}{value}
          </strong>
        </div>
      ))}
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Row detail"
        className="flex flex-col w-full max-w-lg h-full bg-[#111114] border-l border-white/[0.08] shadow-2xl overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/[0.07]">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#d1f267] mb-1">Row Detail</p>
            <h2 className="text-xl font-semibold tracking-tight text-white truncate">{row.title || "—"}</h2>
            <p className="text-sm text-white/50 mt-0.5">{row.artist}</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors text-lg">
            ×
          </button>
        </div>

        {/* Cover */}
        {row.cover && (
          <div className="px-6 pt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/proxy-image?url=${encodeURIComponent(row.cover)}`}
              alt={row.title} referrerPolicy="no-referrer"
              className="w-28 h-28 object-cover rounded-lg border border-white/10"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col px-6 py-4 gap-0">
          {ALL_COLS.map(col => (
            <div key={col} className="flex gap-4 py-2.5 border-b border-white/[0.05] last:border-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/30 w-28 flex-shrink-0 pt-0.5">
                {col}
              </span>
              <span className="text-sm text-white/80 break-all">{row[col] || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Export utils ──────────────────────────────────────────────────────────────
function exportCsv(headers: string[], rows: Row[]) {
  const lines = [headers.join(","),
    ...rows.map(r => headers.map(h => `"${(r[h]??"").replace(/"/g,'""')}"`).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "filtered_view.csv"; a.click();
}
function exportJson(rows: Row[]) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "filtered_view.json"; a.click();
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-2" aria-label="Loading dataset…">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-9 rounded-md bg-white/[0.03] animate-pulse"
          style={{ opacity: 1 - i * 0.09 }} />
      ))}
    </div>
  );
}

// ── Shared input/button classes ───────────────────────────────────────────────
const inputCls = "h-9 px-3 rounded-md border border-white/10 bg-white/5 text-white/80 text-xs placeholder:text-white/30 focus:outline-none focus:border-[#d1f267]/50 focus:bg-white/[0.07] transition-colors";
const btnCls   = "h-9 px-3 rounded-md border border-white/10 bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white/90 hover:border-white/20 transition-colors whitespace-nowrap";
const accentBtnCls = "h-9 px-4 rounded-md bg-[#d1f267]/10 border border-[#d1f267]/30 text-[#d1f267] text-xs font-semibold hover:bg-[#d1f267]/20 transition-colors";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RawDataPage() {
  const [data, setData]             = useState<ApiResponse | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("");
  const [mustHear, setMustHear]     = useState("");
  const [sortBy, setSortBy]         = useState("");
  const [sortOrder, setSortOrder]   = useState<"asc"|"desc">("desc");
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(DEFAULT_HIDDEN));
  const [showColMenu, setShowColMenu] = useState(false);
  const [detailRow, setDetailRow]   = useState<Row | null>(null);
  const limit = 50;

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ limit: String(limit), page: String(p) });
    if (search)   params.set("search", search);
    if (category) params.set("category", category);
    if (mustHear) params.set("mustHear", mustHear);
    if (sortBy)   { params.set("sortBy", sortBy); params.set("sortOrder", sortOrder); }
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
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>Raw Dataset
      </div>

      {/* Page header */}
      <section className="flex items-end justify-between gap-6 pb-6 border-b border-white/[0.07]">
        <div>
          <p className="eyebrow">RAW CSV · AUDIO_Complete_BigData.csv · 113 MB</p>
          <h1 className="text-4xl font-bold tracking-tight mt-2 mb-3">Raw Dataset</h1>
          <p className="text-sm text-white/40 max-w-lg leading-relaxed">
            Stream-filtered preview — {limit} rows per page, never fully loaded into memory.
          </p>
        </div>
        <a href={CSV_URL} target="_blank" rel="noreferrer"
          className="flex-shrink-0 flex items-center gap-2 h-9 px-4 rounded-md border border-white/10 bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white/90 transition-colors">
          ↓ Full CSV
        </a>
      </section>

      {/* ── Controls — Row 1: search + filters ── */}
      <div className="mt-5 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">⌕</span>
          <input className={`${inputCls} w-full pl-8`}
            placeholder="Search artist or title…"
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load(1)} />
        </div>

        <select className={`${inputCls} cursor-pointer`} value={category}
          onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {["New Albums","Anticipated","Top Rated","Singles & EPs"].map(c =>
            <option key={c} value={c}>{c}</option>)}
        </select>

        <select className={`${inputCls} cursor-pointer`} value={mustHear}
          onChange={e => setMustHear(e.target.value)}>
          <option value="">All</option>
          <option value="true">★ Must Hear</option>
          <option value="false">Non-Must Hear</option>
        </select>

        <select className={`${inputCls} cursor-pointer`} value={sortBy}
          onChange={e => setSortBy(e.target.value)}>
          <option value="">No sort</option>
          <option value="criticScore">Critic Score</option>
          <option value="userScore">User Score</option>
          <option value="releaseDate">Release Date</option>
        </select>

        <button className={btnCls}
          onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>
          {sortOrder === "desc" ? "↓ DESC" : "↑ ASC"}
        </button>

        <button className={accentBtnCls} onClick={() => load(1)}>Apply</button>
      </div>

      {/* ── Controls — Row 2: action buttons ── */}
      <div className="mt-2 flex flex-wrap gap-2 items-center justify-end">
        {/* Column toggle */}
        <div className="relative">
          <button className={btnCls} onClick={() => setShowColMenu(v => !v)}>
            ⊞ Columns ({visibleCols.length}/{ALL_COLS.length})
          </button>
          {showColMenu && (
            <div className="absolute right-0 top-full mt-1.5 z-20 w-48 py-1 rounded-lg border border-white/10 bg-[#17171b] shadow-2xl">
              {ALL_COLS.map(col => (
                <label key={col}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/60 hover:bg-white/5 cursor-pointer transition-colors">
                  <input type="checkbox" checked={!hiddenCols.has(col)}
                    onChange={() => toggleCol(col)}
                    className="accent-[#d1f267] cursor-pointer" />
                  <span className="font-mono">{col}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {data && <>
          <button className={btnCls} onClick={() => exportCsv(data.headers, data.rows)}>
            ↓ Export CSV
          </button>
          <button className={btnCls} onClick={() => exportJson(data.rows)}>
            ↓ Export JSON
          </button>
        </>}
      </div>

      {/* States */}
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

          {/* Table meta */}
          <div className="flex items-center justify-between mt-6 mb-2 text-[11px] font-mono text-white/30">
            <span>Page {data.page} · {data.count} rows</span>
            <span>{data.totalMatched} matched · {visibleCols.length} cols visible</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
            <table className="w-full text-xs border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-[#17171b]">
                <tr>
                  <th className="px-3 py-3 text-right text-[10px] font-mono uppercase tracking-wider text-white/25 border-b border-white/[0.07] w-10">#</th>
                  {visibleCols.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/40 border-b border-white/[0.07]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} onClick={() => setDetailRow(row)}
                    className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors last:border-0">
                    <td className="px-3 py-3 text-right font-mono text-[10px] text-white/20">
                      {(page-1)*limit+i+1}
                    </td>
                    {visibleCols.map(h => (
                      <td key={h} className="px-4 py-3 max-w-[220px]">
                        <CellValue col={h} value={row[h] ?? ""} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5">
            <button className={btnCls} disabled={page<=1}
              onClick={() => load(page-1)}
              style={{ opacity: page<=1 ? 0.3 : 1 }}>← Prev</button>
            <span className="text-xs font-mono text-white/30">Page {page}</span>
            <button className={btnCls} disabled={data.count < limit}
              onClick={() => load(page+1)}
              style={{ opacity: data.count<limit ? 0.3 : 1 }}>Next →</button>
          </div>
        </>
      )}

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </main>
  );
}
