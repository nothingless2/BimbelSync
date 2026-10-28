import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import GradebookClientPage from "./client-page";

export const metadata = {
  title: "Gradebook Akhir | Nusantara",
};

export default async function GradebookPage({ params, searchParams }: any) {
  const { tenantSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const programId = resolvedSearchParams?.programId;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) return redirect("/login");

  const session = await decrypt(sessionCookie);
  if (!session || !session.id) return redirect("/login");

  // Fetch academy by tenantSlug
  const academy = await prisma.academy.findUnique({
    where: { path_url: tenantSlug, deleted_at: null },
    select: { id: true, name: true }
  });

  if (!academy || academy.id !== session.academy_id) {
    return notFound();
  }

  // Find user to check role
  let userRole = "TUTOR";
  const superadmin = await prisma.superadmin.findUnique({ where: { id: session.id } });
  if (superadmin) {
    userRole = "SUPERADMIN";
  } else {
    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (staff) {
      userRole = staff.role; // ADMIN or TUTOR
    }
  }

  // Require programId
  if (!programId) {
    return redirect(`/${tenantSlug}/dashboard/evaluations`);
  }

  // Fetch the program data to get weights
  const program = await prisma.program.findUnique({
    where: { id: programId, academy_id: academy.id, deleted_at: null },
  });

  if (!program) {
    return redirect(`/${tenantSlug}/dashboard/evaluations`);
  }

  // Fetch students for this program
  const students = await prisma.student.findMany({
    where: {
      academy_id: academy.id,
      deleted_at: null,
      enrollments: {
        some: {
          program_id: programId,
          status: "ACTIVE"
        }
      }
    },
    select: {
      id: true,
      full_name: true,
      username: true,
    }
  });

  // Fetch only PUBLISHED evaluations for this program
  const evaluations = await prisma.studentEvaluation.findMany({
    where: {
      academy_id: academy.id,
      program_id: programId,
      status: "PUBLISHED"
    },
    select: {
      id: true,
      student_id: true,
      title: true,
      evaluation_type: true,
      score: true,
      created_at: true,
    }
  });

  // Feature Gating: E-Rapor & Evaluasi Siswa hanya untuk paket Pro
  const { checkFeatureAccess } = await import("@/lib/subscription");
  const { FeatureLockBanner } = await import("@/components/feature-lock-banner");
  const access = await checkFeatureAccess(academy.id, "erapor");

  if (!access.allowed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Gradebook Akhir</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rekapitulasi akumulasi nilai berbobot dan status kelulusan siswa.
          </p>
        </div>
        <FeatureLockBanner
          title="Gradebook & Rekap Nilai Akhir"
          description={access.reason || "Fitur rekap nilai akhir dan e-rapor siswa hanya tersedia pada paket Pro."}
          requiredPlan="Pro"
          tenantSlug={tenantSlug}
          currentPlanName={access.planName}
        />
      </div>
    );
  }

  return (
    <div>
      <GradebookClientPage
        tenantSlug={tenantSlug}
        program={program}
        students={students}
        evaluations={evaluations}
        userRole={userRole}
      />
    </div>
  );
}
