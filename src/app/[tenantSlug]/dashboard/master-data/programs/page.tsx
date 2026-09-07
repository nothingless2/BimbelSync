import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AddProgramModal } from "@/components/modals/add-program-modal";
import { redirect } from "next/navigation";
import { BookOpen, Users2, CalendarDays } from "lucide-react";

export default async function ProgramsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  // Fetch programs for this academy
  const programs = await prisma.program.findMany({
    where: {
      academy_id: session.academy_id,
      deleted_at: null
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Program</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola daftar program belajar, kapasitas, dan tarif biaya bulanannya.
          </p>
        </div>
        
        {/* Modal untuk tambah program */}
        <AddProgramModal tenantSlug={tenantSlug} />
      </div>

      {/* Tabel Data */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Nama Program</th>
                <th scope="col" className="px-6 py-4 font-semibold">Kapasitas Maks.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Durasi</th>
                <th scope="col" className="px-6 py-4 font-semibold">Biaya per Bulan</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada data program.<br/>Klik "Tambah Program" untuk mulai membuat.
                  </td>
                </tr>
              ) : (
                programs.map((program) => (
                  <tr key={program.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {program.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users2 size={16} className="text-slate-400" />
                        <span>{program.max_capacity} Siswa</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-slate-400" />
                        <span>{program.duration_months ? `${program.duration_months} Bulan` : "Reguler (Aktif)"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(program.monthly_fee)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* TODO: Add Edit/Delete actions in future iterations */}
                      <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
