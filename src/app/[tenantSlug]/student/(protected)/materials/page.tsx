import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentMaterialsClientPage from "./client-page";

export const metadata = {
  title: "Materi Belajar | BimbelSync",
};

export default async function StudentMaterialsPage({ params }: { params: { tenantSlug: string } }) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) redirect(`/${tenantSlug}/student/login`);

  const session = await decrypt(sessionCookie);
  if (!session || !session.id || session.role !== 'STUDENT') {
    redirect(`/${tenantSlug}/student/login`);
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

  if (!student) redirect(`/${tenantSlug}/student/login`);

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
    <div className="p-4 sm:p-6 lg:p-8">
      <StudentMaterialsClientPage materials={materials} />
    </div>
  );
}
