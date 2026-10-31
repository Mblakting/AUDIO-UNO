import DataExplorer from "../components/DataExplorer";

export default function NewsPage() {
  return (
    <DataExplorer
      requests={[{ endpoint: "/news?type=newsworthy&page=1", label: "Latest music news" }]}
      subtitle="The latest music stories and updates from the AOTY feed."
      title="News"
    />
  );
}
