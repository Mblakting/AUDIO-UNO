import Link from "next/link";

export type DataRequest = {
  endpoint: string;
  label: string;
};

const validationStatus: Record<string, "failed" | "untested"> = {
  "/releases": "failed",
  "/discover": "failed",
  "/discover/top-rated": "failed",
  "/album/summary": "failed",
  "/album/tracklist": "failed",
  "/artist": "failed",
  "/artist/discography": "failed",
  "/search/autocomplete": "failed",
  "/search/all": "failed",
  "/user": "failed",
  "/user/stats": "failed",
  "/ratings": "failed",
  "/songs/top": "failed",
  "/top-artists": "failed",
  "/genre": "failed",
  "/news": "failed",
};

export default function DataExplorer({
  title,
  subtitle,
  requests,
}: {
  title: string;
  subtitle: string;
  requests: DataRequest[];
  inspectRaw?: boolean;
}) {
  return (
    <main className="site-shell explorer-page">
      <div className="breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span>{title}</div>
      <section className="explorer-heading">
        <div>
          <p className="eyebrow">AOTY REAL-TIME EXPLORER</p>
          <h1>{title}</h1>
          <p className="explorer-subtitle">{subtitle}</p>
        </div>
      </section>
      <section className="endpoint-list" aria-label="Endpoint status">
        {requests.map((request) => {
          const status = validationStatus[request.endpoint] ?? validationStatus[request.endpoint.split("?")[0]] ?? "untested";
          return (
            <article className="endpoint-card" key={request.endpoint}>
              <div className="endpoint-summary">
                <span>{request.label}</span>
                <span className="endpoint-status-badge">
                  {status === "failed" ? "Temporarily unavailable" : "Not tested"}
                </span>
              </div>
              <p className="endpoint-unavailable-note">
                {status === "failed"
                  ? "This data source is currently unavailable from the provider. Check back later."
                  : "This endpoint has not been validated yet."}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
