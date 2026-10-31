import DataExplorer from "../../components/DataExplorer";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <DataExplorer
      requests={[
        { endpoint: "/artist", label: "Artist details" },
        { endpoint: "/artist/discography", label: "Discography" },
        { endpoint: "/artist/songs", label: "Songs" },
        { endpoint: "/artist/similar", label: "Similar artists" },
      ]}
      subtitle={`Discography, songs, and related artists for ${slug}.`}
      title="Artist"
    />
  );
}
