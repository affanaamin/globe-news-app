import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/gev',
        destination: '/gev/index.html',
      },
      {
        source: '/gev/',
        destination: '/gev/index.html',
      },
      {
        source: '/cesium/:path*',
        destination: '/gev/cesium/:path*',
      },
      {
        source: '/models/:path*',
        destination: '/gev/models/:path*',
      },
      {
        source: '/events/:path*',
        destination: '/gev/events/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/boost',
        destination: '/?mode=recon',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
