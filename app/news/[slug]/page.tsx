import DataExplorer from "../../components/DataExplorer";

export default async function NewsItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <DataExplorer
      requests={[{ endpoint: "/news-item", label: `News article (${slug})` }]}
      subtitle={`Full article data for ${slug}.`}
      title="News item"
    />
  );
}
