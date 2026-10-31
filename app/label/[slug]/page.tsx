import DataExplorer from "../../components/DataExplorer";

export default async function LabelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <DataExplorer
      requests={[
        { endpoint: "/label", label: "Label releases" },
        { endpoint: "/label/singles", label: "Label singles" },
      ]}
      subtitle={`Album and single releases associated with ${slug}.`}
      title="Record label"
    />
  );
}
