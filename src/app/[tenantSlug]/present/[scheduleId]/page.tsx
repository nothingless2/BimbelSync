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

  return (
    <PresentClientPage 
      schedule={schedule}
      tenantSlug={tenantSlug}
    />
  );
}
