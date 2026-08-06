/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@stellar-pay/sdk',
    '@stellar-pay/types',
    '@stellar-pay/ui',
  ],
};

export default nextConfig;
