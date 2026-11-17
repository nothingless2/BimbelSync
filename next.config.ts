import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'www.bimbelsync.web.id',
        'bimbelsync.web.id',
      ],
    },
  },
  async headers() {
    return [
      {
        // Berlaku untuk semua halaman
        source: '/(.*)',
        headers: [
          // Mencegah halaman dimuat di dalam <iframe> (Clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Mencegah browser "menebak" tipe file (MIME Sniffing Attack)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Mengontrol informasi apa yang dikirim di header Referer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Menonaktifkan API browser yang tidak dibutuhkan, tapi mengizinkan kamera
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          // Memaksa browser selalu pakai HTTPS (aktif di production)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Isolasi origin browser (Lighthouse COOP check)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // Optimasi DNS prefetch
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // [NEW M4] Content Security Policy — mencegah XSS dan injeksi konten berbahaya
          // unsafe-inline diperlukan untuk Tailwind CSS v4 (inline styles) dan Next.js hydration
          // Perketat ke nonce-based CSP ketika sudah production-stable
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Script: hanya dari domain sendiri + inline Next.js (diperlukan untuk hydration)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
              // Style: izinkan inline (Tailwind CSS v4 menggunakan style injection)
              "style-src 'self' 'unsafe-inline'",
              // Gambar: domain sendiri + data URI (untuk bukti bayar base64) + CDN Supabase
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.com",
              // Font: domain sendiri
              "font-src 'self'",
              // Koneksi API: domain sendiri + Supabase + Google Analytics
              "connect-src 'self' https://*.supabase.co https://*.supabase.com https://www.google-analytics.com https://analytics.google.com",
              // Form action: hanya domain sendiri
              "form-action 'self'",
              // Frame: tidak diizinkan (konsisten dengan X-Frame-Options: DENY)
              "frame-ancestors 'none'",
              // Object: tidak ada embed/plugin
              "object-src 'none'",
              // Base URI: hanya domain sendiri (mencegah base tag injection)
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
