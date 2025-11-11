import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    CONTRACT_ADDRESS_VOTING: process.env.CONTRACT_ADDRESS_VOTING,
    CONTRACT_ADDRESS_COUNTER: process.env.CONTRACT_ADDRESS_COUNTER,
    DB_URI: process.env.DB_URI,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
