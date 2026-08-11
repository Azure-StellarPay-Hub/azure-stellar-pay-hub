/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@stellar-pay/sdk',
    '@stellar-pay/shared',
    '@stellar-pay/types',
    '@stellar-pay/ui',
  ],
};

export default nextConfig;
