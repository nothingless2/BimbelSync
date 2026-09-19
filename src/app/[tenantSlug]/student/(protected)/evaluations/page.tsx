import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentEvaluationsClientPage from "./client-page";
import { BarChart } from "lucide-react";

export const metadata = {
  title: "Evaluasi | BimbelSync",
};

export default async function StudentEvaluationsPage({
  params
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionToken);
  if (!session || session.role !== "STUDENT") {
    redirect(`/${tenantSlug}/login`);
  }

  // Fetch all evaluations for this student
  const rawEvaluations = await prisma.studentEvaluation.findMany({
    where: { 
      student_id: session.id as string,
      status: "PUBLISHED"
    },
    include: {
      program: true,
      evaluator: true,
    },
    orderBy: { created_at: "desc" },
  });

  const evaluations = rawEvaluations.map(ev => ({
    ...ev,
    score: Number(ev.score)
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Profile Style */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl mb-4">
            <BarChart size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Rapor & Nilai</h1>
          <p className="text-blue-100 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium">Pantau perkembangan belajarmu</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-16 relative z-20 max-w-3xl mx-auto">
        <StudentEvaluationsClientPage evaluations={evaluations} />
      </div>
    </div>
  );
}
