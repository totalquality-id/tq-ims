/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/ims', destination: '/d-iso', permanent: true },
      { source: '/panduan-fitur-tq-ims.md', destination: '/panduan-fitur-d-iso.md', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Situs demo: boleh dibuka lewat tautan, tetapi tidak diindeks mesin pencari.
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ] }];
  },
};

export default nextConfig;
