import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TenantLoginForm } from './login-form';
import type { Metadata } from 'next';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  const academy = await prisma.academy.findUnique({
    where: { path_url: tenantSlug, deleted_at: null },
    select: { name: true },
  });

  if (!academy) {
    return {
      title: 'Bimbel Tidak Ditemukan | BimbelSync',
    };
  }

  return {
    title: `Masuk - ${academy.name} | BimbelSync`,
    description: `Portal login resmi siswa, orang tua, tentor, dan manajemen ${academy.name}. Didukung oleh BimbelSync.`,
  };
}

export default async function TenantLoginPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const academy = await prisma.academy.findUnique({
    where: { path_url: tenantSlug, deleted_at: null },
    select: {
      id: true,
      name: true,
      path_url: true,
      logo_url: true,
    },
  });

  if (!academy) {
    notFound();
  }

  // Ambil inisial nama bimbel (misal "Bimbel Juara" -> "BJ")
  const initials = academy.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'BS';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Sisi Kiri: Hero Panel Branding Bimbel (Desktop) */}
      <div className="hidden md:flex flex-col justify-between w-5/12 bg-slate-900 relative p-12 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/photo-1.avif"
            alt="Students background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40"></div>
        </div>

        {/* Top Header Logo Bimbel */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 bg-white rounded-2xl p-2 shadow-md flex items-center justify-center shrink-0">
            {academy.logo_url ? (
              <img
                src={academy.logo_url}
                alt={academy.name}
                width={36}
                height={36}
                className="w-full h-full object-contain"
                fetchPriority="high"
              />
            ) : (
              <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-lg font-bold text-white tracking-tight block truncate">
              {academy.name}
            </span>
            <span className="text-[11px] text-blue-300 font-medium tracking-wide uppercase">
              Portal Akademik
            </span>
          </div>
        </div>

        {/* Middle Typography Hero */}
        <div className="relative z-10 mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-md border border-blue-400/20">
            <span>Portal Resmi Pembelajaran</span>
          </div>
          <h1 className="text-[2.5rem] font-bold text-white leading-[1.2] tracking-tight">
            Selamat Datang di <br />
            <span className="text-blue-400">{academy.name}</span>
          </h1>
          <p className="text-slate-300 text-base max-w-sm leading-relaxed font-normal">
            Satu portal terpadu untuk absensi kelas, jadwal belajar, materi pembelajaran, dan administrasi siswa.
          </p>
        </div>

        {/* Bottom Platform Credit */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Platform didukung oleh</span>
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Image src="/logo.png" alt="BimbelSync" width={16} height={16} className="object-contain" />
            <span>BimbelSync</span>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-[#F8FAFC]">
        {/* Mobile Header Top */}
        <div className="md:hidden w-full max-w-md mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
              {academy.logo_url ? (
                <img
                  src={academy.logo_url}
                  alt={academy.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  fetchPriority="high"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block truncate">
                {academy.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Portal Akademik</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-slate-100">
          {/* Logo Emblem on Card */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 p-2.5 mx-auto mb-4 flex items-center justify-center shadow-sm">
              {academy.logo_url ? (
                <img
                  src={academy.logo_url}
                  alt={academy.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  fetchPriority="high"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-inner">
                  {initials}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Masuk ke Akun Anda</h2>
            <p className="text-xs text-slate-500 mt-1">
              Portal Resmi <strong className="text-slate-700 font-semibold">{academy.name}</strong>
            </p>
          </div>

          <TenantLoginForm tenantSlug={tenantSlug} />

          {/* Footer Card */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Koneksi Aman</span>
            </div>
            <span>Powered by BimbelSync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
