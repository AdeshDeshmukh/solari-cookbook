/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@solarisdk/browser", "patchright-core"],
  },
};

export default nextConfig;
