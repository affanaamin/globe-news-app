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
      {
        source: '/logo.svg',
        destination: '/gev/logo.svg',
      },
      {
        source: '/mic.svg',
        destination: '/gev/mic.svg',
      },
      {
        source: '/pin.svg',
        destination: '/gev/pin.svg',
      },
      {
        source: '/location.svg',
        destination: '/gev/location.svg',
      },
      {
        source: '/visual-presets.svg',
        destination: '/gev/visual-presets.svg',
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
      {
        source: '/boost/:path*',
        destination: '/?mode=recon',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
