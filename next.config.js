/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    PIN_CODE: process.env.PIN_CODE,
    ADMIN_PIN: process.env.ADMIN_PIN,
  },
};

export default nextConfig;
