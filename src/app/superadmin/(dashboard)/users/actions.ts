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
