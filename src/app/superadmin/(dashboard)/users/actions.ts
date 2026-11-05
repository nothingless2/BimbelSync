"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { validatePassword } from "@/lib/auth";
import { requireSuperadminSession } from "@/lib/session";
import { logAuditAction } from "../search/actions";
import { revalidatePath } from "next/cache";

export async function resetTenantUserPasswordAction(
  userId: string,
  userType: "STAFF" | "STUDENT",
  newPassword: string
) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };

    if (!newPassword || newPassword.length < 8) {
      return { error: "Password baru minimal 8 karakter." };
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return { error: passwordCheck.errorMsg || "Password baru belum memenuhi kriteria keamanan." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (userType === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { id: userId },
        include: { academy: { select: { id: true, name: true } } },
      });
      if (!staff) return { error: "Pengguna staf tidak ditemukan." };

      await prisma.staff.update({
        where: { id: userId },
        data: { password_hash: hashedPassword },
      });

      if (staff.academy_id) {
        await logAuditAction("SUPERADMIN_RESET_PASSWORD", "Staff", staff.academy_id, {
          staff_id: staff.id,
          email: staff.email,
          role: staff.role,
          academy_name: staff.academy?.name,
        });
      }

      revalidatePath("/superadmin/users");
      return { success: true, message: `Password untuk staf ${staff.email} berhasil diperbarui.` };
    } else {
      const student = await prisma.student.findUnique({
        where: { id: userId },
        include: { academy: { select: { id: true, name: true } } },
      });
      if (!student) return { error: "Siswa tidak ditemukan." };

      await prisma.student.update({
        where: { id: userId },
        data: { 
          password_hash: hashedPassword,
          must_change_password: false,
        },
      });

      await logAuditAction("SUPERADMIN_RESET_PASSWORD", "Student", student.academy_id, {
        student_id: student.id,
        username: student.username,
        full_name: student.full_name,
        academy_name: student.academy?.name,
      });

      revalidatePath("/superadmin/users");
      return { success: true, message: `Password untuk siswa ${student.full_name} (${student.username}) berhasil diperbarui.` };
    }
  } catch (error: any) {
    console.error("resetTenantUserPasswordAction error:", error);
    return { error: "Gagal memperbarui password pengguna." };
  }
}

export async function toggleTenantUserStatusAction(
  userId: string,
  userType: "STAFF" | "STUDENT",
  targetAction: "DEACTIVATE" | "ACTIVATE"
) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };

    const newDeletedAt = targetAction === "DEACTIVATE" ? new Date() : null;

    if (userType === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { id: userId },
        include: { academy: true },
      });
      if (!staff) return { error: "Pengguna staf tidak ditemukan." };

      if (targetAction === "ACTIVATE" && staff.academy?.deleted_at) {
        return { 
          error: `Akademi "${staff.academy.name}" saat ini berada di tempat sampah. Silakan pulihkan akademi terlebih dahulu sebelum mengaktifkan staf.` 
        };
      }

      await prisma.staff.update({
        where: { id: userId },
        data: { deleted_at: newDeletedAt },
      });

      if (staff.academy_id) {
        await logAuditAction(
          targetAction === "DEACTIVATE" ? "SUPERADMIN_DEACTIVATE_USER" : "SUPERADMIN_ACTIVATE_USER",
          "Staff",
          staff.academy_id,
          {
            staff_id: staff.id,
            email: staff.email,
            role: staff.role,
            academy_name: staff.academy?.name,
          }
        );
      }

      revalidatePath("/superadmin/users");
      return {
        success: true,
        message: targetAction === "DEACTIVATE"
          ? `Akun ${staff.role === "ADMIN" ? "Admin" : "Tutor"} (${staff.email}) berhasil dinonaktifkan.`
          : `Akun ${staff.role === "ADMIN" ? "Admin" : "Tutor"} (${staff.email}) berhasil diaktifkan kembali.`,
      };
    } else {
      const student = await prisma.student.findUnique({
        where: { id: userId },
        include: { academy: true },
      });
      if (!student) return { error: "Siswa tidak ditemukan." };

      if (targetAction === "ACTIVATE" && student.academy?.deleted_at) {
        return { 
          error: `Akademi "${student.academy.name}" saat ini berada di tempat sampah. Silakan pulihkan akademi terlebih dahulu sebelum mengaktifkan siswa.` 
        };
      }

      await prisma.student.update({
        where: { id: userId },
        data: { deleted_at: newDeletedAt },
      });

      await logAuditAction(
        targetAction === "DEACTIVATE" ? "SUPERADMIN_DEACTIVATE_USER" : "SUPERADMIN_ACTIVATE_USER",
        "Student",
        student.academy_id,
        {
          student_id: student.id,
          username: student.username,
          full_name: student.full_name,
          academy_name: student.academy?.name,
        }
      );

      revalidatePath("/superadmin/users");
      return {
        success: true,
        message: targetAction === "DEACTIVATE"
          ? `Akun siswa ${student.full_name} (${student.username}) berhasil dinonaktifkan.`
          : `Akun siswa ${student.full_name} (${student.username}) berhasil diaktifkan kembali.`,
      };
    }
  } catch (error: any) {
    console.error("toggleTenantUserStatusAction error:", error);
    return { error: "Gagal memperbarui status pengguna." };
  }
}

export async function hardDeleteTenantUserAction(
  userId: string,
  userType: "STAFF" | "STUDENT"
) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };

    if (userType === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { id: userId },
        include: { academy: true },
      });
      if (!staff) return { error: "Pengguna staf tidak ditemukan." };

      const academyId = staff.academy_id;
      const staffEmail = staff.email;
      const staffRole = staff.role;

      await prisma.$transaction(async (tx) => {
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
        const scheduleIds = schedules.map((s: any) => s.id);
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
        await tx.staff.delete({
          where: { id: userId },
        });
      }, { timeout: 15000 });

      if (academyId) {
        await logAuditAction("SUPERADMIN_HARD_DELETE_USER", "Staff", academyId, {
          staff_id: userId,
          email: staffEmail,
          role: staffRole,
          academy_name: staff.academy?.name,
        });
      }

      revalidatePath("/superadmin/users");
      revalidatePath("/superadmin/dashboard");
      return {
        success: true,
        message: `Akun ${staffRole === "ADMIN" ? "Admin" : "Tutor"} (${staffEmail}) berhasil dihapus permanen.`,
      };
    } else {
      const student = await prisma.student.findUnique({
        where: { id: userId },
        include: { academy: true },
      });
      if (!student) return { error: "Siswa tidak ditemukan." };

      const academyId = student.academy_id;
      const studentUsername = student.username;
      const studentFullName = student.full_name;

      await prisma.$transaction(async (tx) => {
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
        const invoiceIds = invoices.map((inv: any) => inv.id);
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
        await tx.student.delete({
          where: { id: userId },
        });
      }, { timeout: 15000 });

      await logAuditAction("SUPERADMIN_HARD_DELETE_USER", "Student", academyId, {
        student_id: userId,
        username: studentUsername,
        full_name: studentFullName,
        academy_name: student.academy?.name,
      });

      revalidatePath("/superadmin/users");
      revalidatePath("/superadmin/dashboard");
      return {
        success: true,
        message: `Akun siswa ${studentFullName} (${studentUsername}) berhasil dihapus permanen.`,
      };
    }
  } catch (error: any) {
    console.error("hardDeleteTenantUserAction error:", error);
    return { error: "Gagal menghapus permanen pengguna karena keterikatan relasi data." };
  }
}
