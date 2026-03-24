/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.ibb.co', 'lh3.googleusercontent.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  output: 'standalone',
  async redirects() {
    return [
      { source: '/home-2', destination: '/', permanent: true },
      { source: '/home-3', destination: '/', permanent: true },
      { source: '/home-4', destination: '/', permanent: true },
      { source: '/shop-right-sidebar', destination: '/shop', permanent: true },
      { source: '/shop-hidden-sidebar', destination: '/shop', permanent: true },
      { source: '/shop-category', destination: '/shop', permanent: true },
      { source: '/blog-grid', destination: '/blog', permanent: true },
      { source: '/blog-list', destination: '/blog', permanent: true },
      { source: '/blog-details/:path*', destination: '/blog', permanent: true },
      { source: '/blog-details-2/:path*', destination: '/blog', permanent: true },
      { source: '/product-details-countdown', destination: '/', permanent: true },
      { source: '/product-details-swatches', destination: '/', permanent: true },
      { source: '/product-details-video', destination: '/', permanent: true },
    ];
  },
}

module.exports = nextConfig
