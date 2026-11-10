import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizzesClientPage from "./client-page";

export const metadata = {
  title: "Kuis & Latihan Soal | BimbelSync",
};

export default async function QuizzesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionCookie);
  if (!session || !session.academy_id) redirect(`/${tenantSlug}/login`);

  const isTutor = session.role === "TUTOR";

  const [quizzes, programs] = await Promise.all([
    prisma.quiz.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null,
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
        submissions: {
          select: {
            score: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.program.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedQuizzes = quizzes.map((q) => {
    const scores = q.submissions.map((s) => Number(s.score));
    const avgScore =
      scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

    return {
      id: q.id,
      title: q.title,
      description: q.description,
      durationMinutes: q.duration_minutes,
      isPublished: q.is_published,
      createdAt: q.created_at.toISOString(),
      programId: q.program_id,
      programName: q.program.name,
      creatorName: q.creator?.name || "Tutor",
      creatorEmail: q.creator?.email || "",
      creatorAvatar: q.creator?.avatar_url || null,
      totalQuestions: q._count.questions,
      totalSubmissions: q._count.submissions,
      avgScore,
    };
  });

  return (
    <QuizzesClientPage
      quizzes={serializedQuizzes}
      programs={programs}
      tenantSlug={tenantSlug}
      academyId={session.academy_id}
      userRole={session.role}
    />
  );
}

