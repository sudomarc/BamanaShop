/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bamanashop/contracts", "@bamanashop/domain"],
  experimental: {
    optimizePackageImports: ["@bamanashop/contracts", "@bamanashop/domain"],
  },
};

module.exports = nextConfig;
