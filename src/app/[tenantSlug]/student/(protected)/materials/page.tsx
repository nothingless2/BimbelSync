import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentMaterialsClientPage from "./client-page";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Materi Belajar | BimbelSync",
};

export default async function StudentMaterialsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionToken);
  if (!session || !session.id || session.role !== 'STUDENT') {
    redirect(`/${tenantSlug}/login`);
  }

  // Get student's enrolled programs
  const student = await prisma.student.findUnique({
    where: { id: session.id as string },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' }
      }
    }
  });

  if (!student) redirect(`/${tenantSlug}/login`);

  const enrolledProgramIds = student.enrollments.map(e => e.program_id);

  const materials = await prisma.learningMaterial.findMany({
    where: {
      academy_id: student.academy_id,
      program_id: { in: enrolledProgramIds },
      deleted_at: null
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
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="px-4 sm:px-8 pt-6 max-w-4xl mx-auto">
        {/* Header Profile Style */}
        <div className="bg-blue-700 rounded-3xl p-6 sm:p-8 text-white mb-8">
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-800/50 rounded-lg flex items-center justify-center mb-4">
              <BookOpen size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Materi Belajar</h1>
            <p className="text-blue-100 bg-blue-800/50 px-4 py-1.5 rounded-md text-sm font-medium">Akses modul, latihan soal, dan video dari tutormu</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-16 relative z-20 max-w-4xl mx-auto">
        <StudentMaterialsClientPage materials={materials} />
      </div>
    </div>
  );
}
