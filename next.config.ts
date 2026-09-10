import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Dibatasi ke 500KB — cukup untuk form data biasa.
      // Jika kelak ada upload file, naikkan sesuai kebutuhan.
      bodySizeLimit: '500kb',
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
          // Menonaktifkan API browser yang tidak dibutuhkan (kamera, mikrofon, GPS)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Memaksa browser selalu pakai HTTPS (aktif di production)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
