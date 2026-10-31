import DataExplorer from "../../components/DataExplorer";

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return (
    <DataExplorer
      requests={[
        { endpoint: "/user", label: "User profile" },
        { endpoint: "/user/ratings", label: "Ratings" },
        { endpoint: "/user/reviews", label: "Reviews" },
        { endpoint: "/user/stats", label: "User statistics" },
      ]}
      subtitle={`Profile, ratings, reviews, and listening statistics for ${username}.`}
      title="AOTY user"
    />
  );
}
