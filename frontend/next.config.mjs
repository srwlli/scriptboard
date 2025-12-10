/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Electron packaging
  output: 'standalone',
  // Disable image optimization for Electron (not needed)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

