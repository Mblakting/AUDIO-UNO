import Link from "next/link";
import SearchAutocomplete from "./SearchAutocomplete";

export default function SiteHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="AOTY Explorer home">
        <span className="brand-mark">a</span>
        <span>AOTY<span className="brand-light">.explorer</span></span>
      </Link>
      <nav aria-label="Main navigation" className="main-nav">
        <Link href="/charts">Charts</Link>
        <Link href="/news">News</Link>
        <Link href="/raw-data">Raw Dataset</Link>
      </nav>
      <SearchAutocomplete />
      <span className="topbar-note"><span className="status-dot" /> LIVE DATA</span>
    </header>
  );
}
