import prisma from "@/lib/prisma";
import { getDataRetentionConfig, DataRetentionConfig } from "@/lib/platform-settings";

export interface PurgeResult {
  cutoffDate: Date;
  retentionDays: number;
  autoPurgeEnabled: boolean;
  purgedStaffCount: number;
  purgedStudentCount: number;
  purgedAcademyCount: number;
  purgedStaffDetails: Array<{ id: string; email: string; role: string }>;
  purgedStudentDetails: Array<{ id: string; username: string; name: string }>;
  purgedAcademyDetails: Array<{ id: string; name: string; path_url: string }>;
  status: "completed" | "skipped_disabled" | "error";
  message?: string;
}

export interface RetentionStats {
  config: DataRetentionConfig;
  cutoffDate: Date;
  students: {
    totalInactive: number;
    expiredCount: number;
  };
  staff: {
    totalInactive: number;
    expiredCount: number;
  };
  academies: {
    totalInactive: number;
    expiredCount: number;
  };
  lastPurgeAt: string | null;
  lastPurgeSummary: PurgeResult | null;
}

/**
 * Melakukan cascading hard delete untuk sebuah Akademi beserta seluruh relasi terkait.
 */
export async function cascadeDeleteAcademy(academyId: string) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Ambil ID dari entitas tingkat pertama
      const students = await tx.student.findMany({ where: { academy_id: academyId }, select: { id: true } });
      const studentIds = students.map((s: any) => s.id);

      const invoices = await tx.invoice.findMany({ where: { academy_id: academyId }, select: { id: true } });
      const invoiceIds = invoices.map((i: any) => i.id);

      const programs = await tx.program.findMany({ where: { academy_id: academyId }, select: { id: true } });
      const programIds = programs.map((p: any) => p.id);

      const rooms = await tx.room.findMany({ where: { academy_id: academyId }, select: { id: true } });
      const roomIds = rooms.map((r: any) => r.id);

      // Cari seluruh jadwal kelas yang terkait dengan program atau ruangan bimbel ini
      const schedules = await tx.schedule.findMany({
        where: {
          OR: [
            { program_id: { in: programIds } },
            { room_id: { in: roomIds } },
          ],
        },
        select: { id: true },
      });
      const scheduleIds = schedules.map((s: any) => s.id);

      // 2. Hapus entitas tingkat ketiga (bergantung pada entitas tingkat kedua)
      if (scheduleIds.length > 0) {
        await tx.attendance.deleteMany({ where: { schedule_id: { in: scheduleIds } } });
        await tx.schedule.deleteMany({ where: { id: { in: scheduleIds } } });
      }

      if (studentIds.length > 0) {
        await tx.attendance.deleteMany({ where: { student_id: { in: studentIds } } });
        await tx.enrollment.deleteMany({ where: { student_id: { in: studentIds } } });
      }

      if (invoiceIds.length > 0) {
        await tx.installment.deleteMany({ where: { invoice_id: { in: invoiceIds } } });
        await tx.invoiceItem.deleteMany({ where: { invoice_id: { in: invoiceIds } } });
      }

      // 3. Hapus entitas tingkat kedua yang bergantung langsung pada akademi
      await tx.studentEvaluation.deleteMany({ where: { academy_id: academyId } });
      await tx.learningMaterial.deleteMany({ where: { academy_id: academyId } });
      await tx.invoice.deleteMany({ where: { academy_id: academyId } });
      await tx.platformInvoice.deleteMany({ where: { academy_id: academyId } });
      await tx.auditLog.deleteMany({ where: { academy_id: academyId } });

      // 4. Hapus entitas tingkat pertama
      await tx.student.deleteMany({ where: { academy_id: academyId } });
      await tx.staff.deleteMany({ where: { academy_id: academyId } });
      await tx.program.deleteMany({ where: { academy_id: academyId } });
      await tx.room.deleteMany({ where: { academy_id: academyId } });

      // 5. Akhirnya, hapus akademi itu sendiri
      return await tx.academy.delete({ where: { id: academyId } });
    },
    { timeout: 30000 }
  );
}

/**
 * Melakukan cascading hard delete untuk akun Staff beserta seluruh relasi terkait.
 */
export async function cascadeDeleteStaff(userId: string) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Lepaskan relasi pada materi pembelajaran
      await tx.learningMaterial.updateMany({
        where: { created_by_staff_id: userId },
        data: { created_by_staff_id: null },
      });

      // 2. Lepaskan relasi verifikasi invoice dan installment
      await tx.invoice.updateMany({
        where: { verified_by_staff_id: userId },
        data: { verified_by_staff_id: null },
      });
      await tx.installment.updateMany({
        where: { verified_by_staff_id: userId },
        data: { verified_by_staff_id: null },
      });

      // 3. Hapus evaluasi yang dibuat oleh staf ini
      await tx.studentEvaluation.deleteMany({
        where: { evaluator_id: userId },
      });

      // 4. Hapus jadwal kelas yang diajar oleh tutor ini beserta presensinya
      const schedules = await tx.schedule.findMany({
        where: { tutor_id: userId },
        select: { id: true },
      });
      const scheduleIds = schedules.map((s) => s.id);
      if (scheduleIds.length > 0) {
        await tx.attendance.deleteMany({
          where: { schedule_id: { in: scheduleIds } },
        });
        await tx.schedule.deleteMany({
          where: { id: { in: scheduleIds } },
        });
      }

      // 5. Lepaskan referensi pada audit log
      await tx.auditLog.updateMany({
        where: { staff_id: userId },
        data: { staff_id: null },
      });

      // 6. Hapus permanen akun staf
      return await tx.staff.delete({
        where: { id: userId },
      });
    },
    { timeout: 15000 }
  );
}

/**
 * Melakukan cascading hard delete untuk akun Student beserta seluruh relasi terkait.
 */
export async function cascadeDeleteStudent(userId: string) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Hapus presensi siswa
      await tx.attendance.deleteMany({
        where: { student_id: userId },
      });

      // 2. Hapus pendaftaran kelas (enrollment)
      await tx.enrollment.deleteMany({
        where: { student_id: userId },
      });

      // 3. Hapus evaluasi nilai siswa
      await tx.studentEvaluation.deleteMany({
        where: { student_id: userId },
      });

      // 4. Hapus invoice SPP & cicilannya
      const invoices = await tx.invoice.findMany({
        where: { student_id: userId },
        select: { id: true },
      });
      const invoiceIds = invoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await tx.installment.deleteMany({
          where: { invoice_id: { in: invoiceIds } },
        });
        await tx.invoiceItem.deleteMany({
          where: { invoice_id: { in: invoiceIds } },
        });
        await tx.invoice.deleteMany({
          where: { id: { in: invoiceIds } },
        });
      }

      // 5. Hapus permanen akun siswa
      return await tx.student.delete({
        where: { id: userId },
      });
    },
    { timeout: 15000 }
  );
}

/**
 * Memeriksa dan membersihkan secara permanen akun Staff, Student, dan Academy
 * yang telah berstatus nonaktif (deleted_at) melebihi masa retensi dinamis.
 */
export async function purgeExpiredTenantUsers(options?: { force?: boolean }): Promise<PurgeResult> {
  const config = await getDataRetentionConfig();

  // Jika pembersihan otomatis dinonaktifkan dan bukan force run manual
  if (!options?.force && !config.autoPurgeEnabled) {
    return {
      cutoffDate: new Date(),
      retentionDays: config.retentionDays,
      autoPurgeEnabled: false,
      purgedStaffCount: 0,
      purgedStudentCount: 0,
      purgedAcademyCount: 0,
      purgedStaffDetails: [],
      purgedStudentDetails: [],
      purgedAcademyDetails: [],
      status: "skipped_disabled",
      message: "Pembersihan otomatis dinonaktifkan dalam pengaturan Superadmin.",
    };
  }

  const cutoffDate = new Date(Date.now() - config.retentionDays * 24 * 60 * 60 * 1000);

  const purgedStaffDetails: Array<{ id: string; email: string; role: string }> = [];
  const purgedStudentDetails: Array<{ id: string; username: string; name: string }> = [];
  const purgedAcademyDetails: Array<{ id: string; name: string; path_url: string }> = [];

  // 1. Purge Staff jika targetStaff aktif
  if (config.targetStaff) {
    const expiredStaff = await prisma.staff.findMany({
      where: { deleted_at: { lte: cutoffDate } },
      select: { id: true, email: true, role: true, academy_id: true, deleted_at: true },
    });

    for (const staff of expiredStaff) {
      try {
        await cascadeDeleteStaff(staff.id);
        if (staff.academy_id) {
          await prisma.auditLog.create({
            data: {
              academy_id: staff.academy_id,
              action: "AUTO_PURGE_EXPIRED_USER",
              entity_type: "Staff",
              entity_id: staff.id,
              details: {
                email: staff.email,
                role: staff.role,
                retention_days: config.retentionDays,
                deleted_at: staff.deleted_at,
                purged_at: new Date(),
              },
            },
          });
        }
        purgedStaffDetails.push({ id: staff.id, email: staff.email, role: staff.role });
      } catch (err) {
        console.error(`Failed to auto-purge staff ${staff.id}:`, err);
      }
    }
  }

  // 2. Purge Student jika targetStudent aktif
  if (config.targetStudent) {
    const expiredStudents = await prisma.student.findMany({
      where: { deleted_at: { lte: cutoffDate } },
      select: { id: true, username: true, full_name: true, academy_id: true, deleted_at: true },
    });

    for (const student of expiredStudents) {
      try {
        await cascadeDeleteStudent(student.id);
        if (student.academy_id) {
          await prisma.auditLog.create({
            data: {
              academy_id: student.academy_id,
              action: "AUTO_PURGE_EXPIRED_USER",
              entity_type: "Student",
              entity_id: student.id,
              details: {
                username: student.username,
                full_name: student.full_name,
                retention_days: config.retentionDays,
                deleted_at: student.deleted_at,
                purged_at: new Date(),
              },
            },
          });
        }
        purgedStudentDetails.push({
          id: student.id,
          username: student.username,
          name: student.full_name,
        });
      } catch (err) {
        console.error(`Failed to auto-purge student ${student.id}:`, err);
      }
    }
  }

  // 3. Purge Academy jika targetAcademy aktif
  if (config.targetAcademy) {
    const expiredAcademies = await prisma.academy.findMany({
      where: { deleted_at: { lte: cutoffDate } },
      select: { id: true, name: true, path_url: true, deleted_at: true },
    });

    for (const academy of expiredAcademies) {
      try {
        await cascadeDeleteAcademy(academy.id);
        purgedAcademyDetails.push({
          id: academy.id,
          name: academy.name,
          path_url: academy.path_url,
        });
      } catch (err) {
        console.error(`Failed to auto-purge academy ${academy.id}:`, err);
      }
    }
  }

  const result: PurgeResult = {
    cutoffDate,
    retentionDays: config.retentionDays,
    autoPurgeEnabled: config.autoPurgeEnabled,
    purgedStaffCount: purgedStaffDetails.length,
    purgedStudentCount: purgedStudentDetails.length,
    purgedAcademyCount: purgedAcademyDetails.length,
    purgedStaffDetails,
    purgedStudentDetails,
    purgedAcademyDetails,
    status: "completed",
    message: `Pembersihan selesai: ${purgedStudentDetails.length} siswa, ${purgedStaffDetails.length} staf, ${purgedAcademyDetails.length} bimbel (nonaktif > ${config.retentionDays} hari) dihapus permanen.`,
  };

  // Simpan riwayat pembersihan terakhir ke tabel PlatformSetting
  try {
    await prisma.$transaction([
      prisma.platformSetting.upsert({
        where: { key: "last_retention_purge_at" },
        create: { key: "last_retention_purge_at", value: new Date().toISOString() },
        update: { value: new Date().toISOString() },
      }),
      prisma.platformSetting.upsert({
        where: { key: "last_retention_purge_summary" },
        create: { key: "last_retention_purge_summary", value: JSON.stringify(result) },
        update: { value: JSON.stringify(result) },
      }),
    ]);
  } catch (error) {
    console.error("Gagal mencatat riwayat pembersihan ke PlatformSetting:", error);
  }

  return result;
}

/**
 * Mengambil ringkasan statistik retensi data untuk portal Superadmin.
 */
export async function getRetentionStats(): Promise<RetentionStats> {
  const config = await getDataRetentionConfig();
  const cutoffDate = new Date(Date.now() - config.retentionDays * 24 * 60 * 60 * 1000);

  const [
    totalInactiveStudents,
    expiredStudents,
    totalInactiveStaff,
    expiredStaff,
    totalInactiveAcademies,
    expiredAcademies,
    lastPurgeSettings,
  ] = await Promise.all([
    prisma.student.count({ where: { deleted_at: { not: null } } }),
    prisma.student.count({ where: { deleted_at: { lte: cutoffDate } } }),
    prisma.staff.count({ where: { deleted_at: { not: null } } }),
    prisma.staff.count({ where: { deleted_at: { lte: cutoffDate } } }),
    prisma.academy.count({ where: { deleted_at: { not: null } } }),
    prisma.academy.count({ where: { deleted_at: { lte: cutoffDate } } }),
    prisma.platformSetting.findMany({
      where: { key: { in: ["last_retention_purge_at", "last_retention_purge_summary"] } },
    }),
  ]);

  const map = new Map(lastPurgeSettings.map((s) => [s.key, s.value]));
  const lastPurgeAt = map.get("last_retention_purge_at") || null;
  let lastPurgeSummary: PurgeResult | null = null;
  const rawSummary = map.get("last_retention_purge_summary");
  if (rawSummary) {
    try {
      lastPurgeSummary = JSON.parse(rawSummary);
    } catch {
      lastPurgeSummary = null;
    }
  }

  return {
    config,
    cutoffDate,
    students: {
      totalInactive: totalInactiveStudents,
      expiredCount: expiredStudents,
    },
    staff: {
      totalInactive: totalInactiveStaff,
      expiredCount: expiredStaff,
    },
    academies: {
      totalInactive: totalInactiveAcademies,
      expiredCount: expiredAcademies,
    },
    lastPurgeAt,
    lastPurgeSummary,
  };
}
