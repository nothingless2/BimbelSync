import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentEvaluationsClientPage from "./client-page";

export const metadata = {
  title: "Rapor & Evaluasi | BimbelSync",
};

export default async function StudentEvaluationsPage({ params }: { params: { tenantSlug: string } }) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionCookie);
  if (!session || !session.id || session.role !== 'STUDENT') {
    redirect(`/${tenantSlug}/login`);
  }

  const evaluations = await prisma.studentEvaluation.findMany({
    where: {
      student_id: session.id as string,
    },
    include: {
      program: true,
      evaluator: {
        select: {
          name: true,
        }
      }
    },
    orderBy: { created_at: "desc" },
  });

  const serializedEvaluations = evaluations.map(e => ({
    ...e,
    score: e.score ? Number(e.score) : null
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <StudentEvaluationsClientPage evaluations={serializedEvaluations} />
    </div>
  );
}
