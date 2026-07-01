/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 3D components are dynamically imported with ssr:false in the
  // components that use them, so no special webpack config is needed
  // here for @react-three/fiber.
};

module.exports = nextConfig;
