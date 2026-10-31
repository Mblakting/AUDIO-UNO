"use client";

import { useMemo, useState, type ReactNode } from "react";

type RawDataViewerProps = {
  data: unknown;
  fetchedAt: string;
};

const jsonTokens = /"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function getTokenClass(json: string, token: string, index: number): string {
  if (token.startsWith('"')) {
    let cursor = index + token.length;
    while (/\s/.test(json[cursor] ?? "")) cursor += 1;
    return json[cursor] === ":" ? "json-key" : "json-string";
  }
  if (token === "null") return "json-null";
  if (token === "true" || token === "false") return "json-boolean";
  return "json-number";
}

function highlightJson(json: string) {
  const segments: ReactNode[] = [];
  let previousIndex = 0;
  for (const match of json.matchAll(jsonTokens)) {
    const index = match.index ?? 0;
    if (index > previousIndex) segments.push(json.slice(previousIndex, index));
    segments.push(
      <span className={getTokenClass(json, match[0], index)} key={index}>
        {match[0]}
      </span>,
    );
    previousIndex = index + match[0].length;
  }
  if (previousIndex < json.length) segments.push(json.slice(previousIndex));
  return segments;
}

export default function RawDataViewer({ data, fetchedAt }: RawDataViewerProps) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const json = useMemo(() => JSON.stringify(data, null, 2) ?? "null", [data]);
  const topLevelKeys =
    data !== null && typeof data === "object"
      ? Array.isArray(data)
        ? data.length
        : Object.keys(data).length
      : 0;

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      setNotice("Raw JSON copied.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Unable to copy JSON: ${error.message}`
          : "Unable to copy JSON.",
      );
    }
  }

  function downloadJson() {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aoty-raw-data.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <>
      <button className="raw-trigger" type="button" onClick={() => setOpen(true)}>
        Inspect Raw JSON Data
      </button>
      {open && (
        <div className="raw-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section
            aria-labelledby="raw-viewer-title"
            aria-modal="true"
            className="raw-panel"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            role="dialog"
          >
            <header className="raw-header">
              <div>
                <p className="eyebrow">DATA INSPECTOR</p>
                <h2 id="raw-viewer-title">Raw API payload</h2>
              </div>
              <button
                aria-label="Close raw data inspector"
                className="raw-close"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="raw-metadata" aria-label="Payload metadata">
              <span><b>Total Keys</b>{topLevelKeys.toLocaleString()}</span>
              <span><b>Payload Size</b>{new Blob([json]).size.toLocaleString()} bytes</span>
              <span><b>Timestamp Fetch</b>{fetchedAt}</span>
            </div>
            <div className="raw-actions">
              <button className="raw-action" onClick={copyJson} type="button">
                Copy JSON
              </button>
              <button className="raw-action" onClick={downloadJson} type="button">
                Download .json
              </button>
              {notice && <span role="status">{notice}</span>}
            </div>
            <pre className="raw-code"><code>{highlightJson(json)}</code></pre>
          </section>
        </div>
      )}
    </>
  );
}
