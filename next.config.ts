import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', '127.0.0.1:3000', 'localhost:3000'],
};

export default nextConfig;
