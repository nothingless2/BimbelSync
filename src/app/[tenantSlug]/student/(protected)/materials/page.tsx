import prisma from "@/lib/prisma";
import { requireStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import StudentMaterialsClientPage from "./client-page";
import { BookOpen } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Materi Belajar | BimbelSync",
};

export default async function StudentMaterialsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;

  const auth = await requireStudentSession();
  if ('error' in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;

  // Query student's active programs and learning materials concurrently
  const [student, materials] = await Promise.all([
    prisma.student.findFirst({
      where: {
        id: session.id,
        academy_id: session.academy_id,
        deleted_at: null,
      },
      select: {
        enrollments: {
          where: { status: 'ACTIVE' },
          select: {
            program: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    }),
    prisma.learningMaterial.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null,
        program: {
          enrollments: {
            some: { student_id: session.id as string, status: 'ACTIVE' }
          }
        }
      },
      include: {
        program: true,
        creator: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { created_at: "desc" },
    })
  ]);

  if (!student) redirect(`/${tenantSlug}/student/login`);

  const programs = student.enrollments.map((e) => e.program);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 pt-8 pb-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            Portal Siswa
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Materi Belajar
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Akses modul, latihan soal, dan video dari tutormu
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-8 relative z-20 max-w-4xl mx-auto">
        <Suspense fallback={<div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400">Memuat materi belajar...</div>}>
          <StudentMaterialsClientPage materials={materials} programs={programs} />
        </Suspense>
      </div>
    </div>
  );
}
