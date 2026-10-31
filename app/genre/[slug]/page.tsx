import DataExplorer from "../../components/DataExplorer";

export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <DataExplorer
      requests={[
        { endpoint: "/genre", label: "Genre details and releases" },
        { endpoint: "/subgenres", label: "Subgenres" },
      ]}
      subtitle={`Genre chart and subgenre data for ${slug}.`}
      title="Genre"
    />
  );
}
