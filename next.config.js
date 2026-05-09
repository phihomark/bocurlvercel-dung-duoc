/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

// next.config.js
module.exports = {
  images: {
    domains: ['tinhlm.eatatsunset.net'], // Thay bằng domain chứa ảnh của bạn
  },
}
