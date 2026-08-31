import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.spotifycdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coverartarchive.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.setlist.fm',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', '127.0.0.1:3000', 'localhost:3000', '127.0.0.1:3001', 'localhost:3001'],
};

export default nextConfig;
