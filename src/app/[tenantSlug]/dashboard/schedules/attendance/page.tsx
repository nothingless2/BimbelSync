import { requireStaffSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AttendanceMonitoringClient from "./client-page";

export const metadata = {
  title: "Monitoring Presensi Siswa | BimbelSync",
};

export default async function AttendanceMonitoringPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;
  const resolvedSearchParams = await searchParams;
  const initialFilter = (resolvedSearchParams?.filter as string) || "ALL";
  const initialProgramId = (resolvedSearchParams?.programId as string) || "ALL";

  const auth = await requireStaffSession();
  if ("error" in auth) {
    redirect(`/${tenantSlug}/login`);
  }
  const session = auth.session;

  if (session.tenant_slug !== tenantSlug) {
    redirect(`/${session.tenant_slug}/dashboard`);
  }

  const isTutor = session.role === "TUTOR";
  const academyId = session.academy_id;
  const now = new Date();

  // 1. Fetch programs taught by tutor (or all programs if ADMIN) with active enrollments & students
  const programs = await prisma.program.findMany({
    where: {
      academy_id: academyId,
      deleted_at: null,
      ...(isTutor
        ? {
            schedules: {
              some: { tutor_id: session.id },
            },
          }
        : {}),
    },
    include: {
      enrollments: {
        where: {
          status: "ACTIVE",
          student: { deleted_at: null },
        },
        include: {
          student: true,
        },
        orderBy: {
          student: {
            full_name: "asc",
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Fetch schedules for these programs (and this tutor if role=TUTOR)
  const schedules = await prisma.schedule.findMany({
    where: {
      program: { academy_id: academyId },
      ...(isTutor ? { tutor_id: session.id } : {}),
    },
    include: {
      program: {
        select: {
          id: true,
          name: true,
        },
      },
      room: {
        select: {
          id: true,
          name: true,
        },
      },
      tutor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attendances: {
        select: {
          id: true,
          student_id: true,
          attendance_status: true,
        },
      },
    },
    orderBy: {
      start_time: "desc",
    },
    take: 200,
  });

  // Calculate quick metrics & flags
  const nowTime = now.getTime();
  const serializedSchedules = schedules.map((sch) => {
    const isPast = new Date(sch.end_time).getTime() < nowTime;
    const isOngoing =
      new Date(sch.start_time).getTime() <= nowTime &&
      new Date(sch.end_time).getTime() >= nowTime;
    const isUpcoming = new Date(sch.start_time).getTime() > nowTime;
    const isCancelled = sch.status === "CANCELLED";
    const attendancesCount = sch.attendances.length;
    const isLupaAbsen = isPast && !isCancelled && attendancesCount === 0;

    const presentCount = sch.attendances.filter(
      (a) => a.attendance_status === "PRESENT"
    ).length;
    const excusedCount = sch.attendances.filter(
      (a) => a.attendance_status === "EXCUSED"
    ).length;
    const absentCount = sch.attendances.filter(
      (a) => a.attendance_status === "ABSENT"
    ).length;

    return {
      id: sch.id,
      programId: sch.program.id,
      programName: sch.program.name,
      roomName: sch.room.name,
      tutorName: sch.tutor.name || sch.tutor.email,
      startTime: sch.start_time.toISOString(),
      endTime: sch.end_time.toISOString(),
      status: sch.status,
      isPast,
      isOngoing,
      isUpcoming,
      isLupaAbsen,
      attendancesCount,
      presentCount,
      excusedCount,
      absentCount,
      attendances: sch.attendances,
    };
  });

  const pendingCount = serializedSchedules.filter((s) => s.isLupaAbsen).length;

  return (
    <AttendanceMonitoringClient
      tenantSlug={tenantSlug}
      isTutor={isTutor}
      userName={session.staff.name || session.staff.email}
      programs={programs.map((p) => ({
        id: p.id,
        name: p.name,
        students: p.enrollments.map((e) => ({
          id: e.student.id,
          name: e.student.full_name,
          email: e.student.email,
          phone: e.student.parent_whatsapp,
        })),
      }))}
      schedules={serializedSchedules}
      pendingCount={pendingCount}
      initialFilter={initialFilter}
      initialProgramId={initialProgramId}
    />
  );
}
