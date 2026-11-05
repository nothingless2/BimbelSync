import prisma from "@/lib/prisma";

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
 * Memeriksa dan membersihkan secara permanen seluruh akun Staff dan Student
 * yang telah berstatus nonaktif (deleted_at) melebihi masa retensi 30 hari.
 */
export async function purgeExpiredTenantUsers() {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const expiredStaff = await prisma.staff.findMany({
    where: { deleted_at: { lte: cutoffDate } },
    include: { academy: true },
  });

  const expiredStudents = await prisma.student.findMany({
    where: { deleted_at: { lte: cutoffDate } },
    include: { academy: true },
  });

  const purgedStaffDetails = [];
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

  const purgedStudentDetails = [];
  for (const student of expiredStudents) {
    try {
      await cascadeDeleteStudent(student.id);
      await prisma.auditLog.create({
        data: {
          academy_id: student.academy_id,
          action: "AUTO_PURGE_EXPIRED_USER",
          entity_type: "Student",
          entity_id: student.id,
          details: {
            username: student.username,
            full_name: student.full_name,
            deleted_at: student.deleted_at,
            purged_at: new Date(),
          },
        },
      });
      purgedStudentDetails.push({
        id: student.id,
        username: student.username,
        name: student.full_name,
      });
    } catch (err) {
      console.error(`Failed to auto-purge student ${student.id}:`, err);
    }
  }

  return {
    cutoffDate,
    purgedStaffCount: purgedStaffDetails.length,
    purgedStudentCount: purgedStudentDetails.length,
    purgedStaffDetails,
    purgedStudentDetails,
  };
}

