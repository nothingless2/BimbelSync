import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import PresentClientPage from "./client-page";
import { getSession } from "@/lib/session";

export default async function PresentSchedulePage({
  params
}: {
  params: Promise<{ tenantSlug: string, scheduleId: string }>;
}) {
  const resolvedParams = await params;
  const { tenantSlug, scheduleId } = resolvedParams;

  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TUTOR")) {
    redirect(`/${tenantSlug}/login`);
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      program: {
        include: {
          academy: true
        }
      },
      room: true,
      tutor: true
    }
  });

  if (!schedule) {
    notFound();
  }

  // Ensure the user and the URL tenant match the schedule's academy
  if (schedule.program.academy.path_url !== tenantSlug || session.academy_id !== schedule.program.academy_id) {
    notFound();
  }

  // Feature Gating: Absensi QR dinamis hanya untuk paket Growth dan Pro
  const { checkFeatureAccess } = await import("@/lib/subscription");
  const { FeatureLockBanner } = await import("@/components/feature-lock-banner");
  const access = await checkFeatureAccess(schedule.program.academy_id, "qr_attendance");

  if (!access.allowed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <FeatureLockBanner
          title="Absensi QR Dinamis"
          description={access.reason || "Fitur absensi QR dinamis hanya tersedia pada paket Growth dan Pro. Silakan gunakan absensi manual."}
          requiredPlan="Growth"
          tenantSlug={tenantSlug}
          currentPlanName={access.planName}
        />
        <a 
          href={`/${tenantSlug}/dashboard/schedules/${scheduleId}`}
          className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Kembali ke Detail Jadwal (Absensi Manual)
        </a>
      </div>
    );
  }

  return (
    <PresentClientPage 
      schedule={schedule}
      tenantSlug={tenantSlug}
    />
  );
}
