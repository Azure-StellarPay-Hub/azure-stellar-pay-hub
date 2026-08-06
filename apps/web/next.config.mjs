/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@stellar-pay/sdk',
    '@stellar-pay/shared',
    '@stellar-pay/types',
    '@stellar-pay/ui',
    '@stellar-pay/wallet',
  ],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
