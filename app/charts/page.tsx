import DataExplorer from "../components/DataExplorer";

export default function ChartsPage() {
  return (
    <DataExplorer
      requests={[
        { endpoint: "/ratings?source=6-highest-rated&period=2026&page=1", label: "Top-rated albums" },
        { endpoint: "/songs/top?period=2026", label: "Top songs" },
        { endpoint: "/top-artists", label: "Top artists" },
      ]}
      subtitle="Live community and critic rankings from Album of the Year."
      title="Charts"
    />
  );
}
