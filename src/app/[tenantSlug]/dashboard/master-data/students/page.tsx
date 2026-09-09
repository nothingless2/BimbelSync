import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AddStudentModal } from "@/components/modals/add-student-modal";
import { redirect } from "next/navigation";
import StudentsClientPage from "./client-page";

export default async function StudentsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
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

  // Fetch students and programs concurrently for better performance
  const [students, programs] = await Promise.all([
    prisma.student.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null
      },
      include: {
        enrollments: {
          include: {
            program: true
          },
          orderBy: {
            enrolled_date: 'desc'
          }
        }
      },
      orderBy: {
        full_name: 'asc'
      }
    }),
    prisma.program.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null
      },
      orderBy: {
        name: 'asc'
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Siswa</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola data siswa dan pendaftaran mereka ke program bimbingan belajar.
          </p>
        </div>
        
        <AddStudentModal tenantSlug={tenantSlug} programs={programs} />
      </div>

      <StudentsClientPage 
        students={students} 
        programs={programs}
        tenantSlug={tenantSlug} 
      />
    </div>
  );
}
