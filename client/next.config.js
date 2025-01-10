/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  reactStrictMode: false,
  distDir: process.env.BUILD_DIR || ".next"
}

module.exports = nextConfig
