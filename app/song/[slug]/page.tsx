import DataExplorer from "../../components/DataExplorer";

export default async function SongPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <DataExplorer
      requests={[
        { endpoint: "/song", label: "Song details" },
        { endpoint: "/song/ratings", label: "Community ratings" },
        { endpoint: "/song/critic-lists", label: "Critic lists" },
      ]}
      subtitle={`Song details, ratings, and critic-list appearances for ${slug}.`}
      title="Song"
    />
  );
}
