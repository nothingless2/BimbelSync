import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserCircle, LogOut, KeyRound, Phone, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { logoutStudentAction } from "./actions";

export default async function StudentProfilePage({
  params
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) redirect(`/${tenantSlug}/student/login`);

  const session = await decrypt(sessionToken);
  if (!session || session.role !== "STUDENT") {
    redirect(`/${tenantSlug}/student/login`);
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id as string },
    include: {
      academy: true,
      enrollments: {
        include: { program: true }
      }
    }
  });

  if (!student) redirect(`/${tenantSlug}/student/login`);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      
      {/* Header Profile */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl mb-4">
            <UserCircle size={64} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{student.full_name}</h1>
          <p className="text-blue-100 bg-white/10 px-3 py-1 rounded-full text-sm font-medium">@{student.username}</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-16 relative z-20 space-y-4 max-w-lg mx-auto">
        
        {/* Info Card */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Informasi Akun</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Bimbel (Akademi)</p>
                <p className="font-semibold text-slate-900 dark:text-white">{student.academy.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Nomor WhatsApp Orang Tua</p>
                <p className="font-semibold text-slate-900 dark:text-white">{student.parent_whatsapp || "Belum diatur"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments Card */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Program Aktif</h2>
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded-md">
              {student.enrollments.length}
            </span>
          </div>
          
          {student.enrollments.length > 0 ? (
            <div className="space-y-3">
              {student.enrollments.map((enr) => (
                <div key={enr.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{enr.program.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-2">Belum terdaftar di program apapun.</p>
          )}
        </div>

        {/* Actions Card */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-2 shadow-sm border border-slate-200 dark:border-slate-800">
          <Link 
            href={`/${tenantSlug}/student/change-password`}
            className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">Ganti Password</p>
              <p className="text-xs text-slate-500">Perbarui kata sandi akun Anda</p>
            </div>
          </Link>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4"></div>

          <form action={async () => {
            "use server";
            await logoutStudentAction(tenantSlug);
          }}>
            <button 
              type="submit"
              className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <LogOut size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-600 dark:text-red-400">Keluar (Logout)</p>
                <p className="text-xs text-slate-500">Akhiri sesi Anda di perangkat ini</p>
              </div>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
