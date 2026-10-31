/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.albumoftheyear.org", pathname: "/**" },
      { protocol: "https", hostname: "cdn2.albumoftheyear.org", pathname: "/**" },
      { protocol: "https", hostname: "albumoftheyear.org", pathname: "/**" },
      { protocol: "https", hostname: "www.albumoftheyear.org", pathname: "/**" },
    ],
  },
};

export default nextConfig;
