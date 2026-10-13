import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  // 1. Validasi Sesi Login di Server
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionToken ? await decrypt(sessionToken) : null;

  if (!session || !session.id || session.role !== "ADMIN") {
    redirect("/login");
  }

  // 2. Cek apakah Admin ini sudah memiliki Bimbel di Database
  const staff = await prisma.staff.findUnique({
    where: { id: session.id },
    include: { academy: true },
  });

  if (!staff) {
    redirect("/login");
  }

  // Jika sudah memiliki Bimbel, jangan biarkan mengisi lagi, langsung ke dashboard-nya
  if (staff.academy_id && staff.academy) {
    redirect(`/${staff.academy.path_url}/dashboard`);
  }

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-600 selection:text-white">
      {/* KIRI - Visual Foto Asli & Keterangan Ringkas (Sembunyi di Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-slate-200/80">
        {/* Background Photo Nyata */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/photo-1.avif" 
            alt="Suasana Belajar Bimbingan Belajar" 
            fill 
            className="object-cover opacity-65 filter brightness-105 contrast-100"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-900/30 z-10" />
        </div>

        {/* Top Header / Branding */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm">
            <Image 
              src="/logo.png" 
              alt="BimbelSync Logo" 
              width={32} 
              height={32} 
              className="rounded-md"
            />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">BimbelSync</span>
            <p className="text-xs text-blue-200/80 font-medium">Sistem Manajemen Bimbingan Belajar Terpadu</p>
          </div>
        </div>

        {/* Middle / Setup Bimbel Message */}
        <div className="relative z-20 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide mb-6">
            Inisialisasi Bimbingan Belajar
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-sm">
            Selamat Datang di BimbelSync!
          </h2>
          
          <p className="text-slate-200 text-base xl:text-lg leading-relaxed font-normal drop-shadow-xs max-w-md">
            Satu langkah lagi sebelum masuk ke dashboard: Masukkan nama lembaga bimbel dan tautan portal unik Anda.
          </p>
        </div>

        {/* Bottom footer credit */}
        <div className="relative z-20 text-xs text-slate-300/80">
          © {new Date().getFullYear()} BimbelSync. Platform manajemen bimbingan belajar profesional.
        </div>
      </div>
      
      {/* KANAN - Form Setup Bimbel (Ditengahkan Secara Sempurna) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-8 relative z-10 overflow-y-auto min-h-screen">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Header Brand */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="BimbelSync Logo" 
                width={34} 
                height={34} 
                className="rounded-lg shadow-sm"
              />
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                BimbelSync
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
              Buat Bimbingan Belajar Anda
            </h1>
            <p className="text-slate-500 text-sm">
              Tentukan nama bimbel dan alamat URL portal untuk mulai menggunakan dashboard.
            </p>
          </div>
          
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
