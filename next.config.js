/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required: prevents Next.js from pre-rendering pages that use browser APIs
  // All pages in this app are client-side only (authenticated dashboard)
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
