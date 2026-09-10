import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PresentClientPage from "./client-page";

export default async function PresentSchedulePage({
  params
}: {
  params: Promise<{ tenantSlug: string, scheduleId: string }>;
}) {
  const resolvedParams = await params;
  const { tenantSlug, scheduleId } = resolvedParams;

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

  // Ensure the URL tenant matches the schedule's academy path_url
  if (schedule.program.academy.path_url !== tenantSlug) {
    notFound();
  }

  return (
    <PresentClientPage 
      schedule={schedule}
      tenantSlug={tenantSlug}
    />
  );
}
