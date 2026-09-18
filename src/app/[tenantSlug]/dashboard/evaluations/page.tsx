import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import EvaluationsClientPage from "./client-page";

export const metadata = {
  title: "Evaluations | BimbelSync",
};

export default async function EvaluationsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionCookie);
  if (!session || !session.id) redirect(`/${tenantSlug}/login`);

  const dbUser = await prisma.staff.findUnique({
    where: { id: session.id as string }
  });

  if (!dbUser) redirect(`/${tenantSlug}/login`);

  // Admins see all evaluations, Tutors see evaluations for students in their programs or evaluations they created
  const isAdmin = dbUser.role === 'ADMIN';

  const evaluations = await prisma.studentEvaluation.findMany({
    where: {
      academy_id: dbUser.academy_id,
      ...(isAdmin ? {} : { evaluator_id: dbUser.id }) // Simplify: tutors only see evaluations they created for now
    },
    include: {
      student: true,
      program: true,
      evaluator: {
        select: {
          name: true,
          email: true,
          avatar_url: true,
        }
      }
    },
    orderBy: { created_at: "desc" },
  });

  const students = await prisma.student.findMany({
    where: { academy_id: dbUser.academy_id, deleted_at: null },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { program: true }
      }
    },
    orderBy: { full_name: "asc" }
  });

  const programs = await prisma.program.findMany({
    where: { academy_id: dbUser.academy_id, deleted_at: null },
    orderBy: { name: "asc" }
  });

  const serializedEvaluations = evaluations.map(e => ({
    ...e,
    score: e.score ? Number(e.score) : null
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EvaluationsClientPage 
        evaluations={serializedEvaluations} 
        students={students}
        programs={programs} 
        tenantSlug={tenantSlug} 
        academyId={dbUser.academy_id} 
        userRole={dbUser.role}
      />
    </div>
  );
}
