"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { WithdrawnReason } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

export async function createStudentAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const fullName = formData.get("full_name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const parentWhatsapp = formData.get("parent_whatsapp") as string;
  const programId = formData.get("program_id") as string;

  if (!fullName || !username || !password || !programId) {
    return { error: "Semua field wajib (kecuali WhatsApp) harus diisi, dan siswa harus dimasukkan ke dalam sebuah program." };
  }

  // Feature Gating: Check max_students from Plan
  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    include: {
      plan: true,
      _count: {
        select: { students: { where: { deleted_at: null } } }
      }
    }
  });

  if (!academy) return { error: "Data akademi tidak ditemukan." };

  const currentStudents = academy._count.students;
  const maxStudents = academy.plan.max_students;

  // max_students === null berarti Unlimited
  if (maxStudents !== null && currentStudents >= maxStudents) {
    return { error: `Batas paket tercapai! Paket "${academy.plan.name}" hanya mengizinkan maksimal ${maxStudents} siswa aktif. Harap upgrade paket Anda untuk mendaftarkan siswa lagi.` };
  }

  try {
    const existingStudent = await prisma.student.findUnique({
      where: {
        academy_id_username: {
          academy_id: session.academy_id,
          username: username
        }
      }
    });

    if (existingStudent) {
      if (existingStudent.deleted_at) {
        return { error: "Username ini terdaftar pada siswa yang sudah dihapus. Harap gunakan username lain." };
      }
      return { error: "Username ini sudah digunakan oleh siswa lain." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const program = await prisma.program.findUnique({
      where: { id: programId }
    });
    
    if (!program) return { error: "Program tidak ditemukan." };

    // Create Student, Enrollment, and Invoice in a transaction
    await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          academy_id: session.academy_id as string,
          full_name: fullName,
          username,
          password_hash: passwordHash,
          parent_whatsapp: parentWhatsapp || null,
        }
      });

      await tx.enrollment.create({
        data: {
          student_id: student.id,
          program_id: programId,
        }
      });

      const currentMonthPeriod = new Date().toISOString().substring(0, 7); // e.g. "2026-09"

      // Auto-generate invoice for the program fee
      await tx.invoice.create({
        data: {
          academy_id: session.academy_id as string,
          student_id: student.id,
          total_amount: program.monthly_fee,
          payment_option: "FULL",
          payment_status: "UNPAID",
          billing_period: currentMonthPeriod,
          items: {
            create: {
              description: `Pendaftaran ${program.name}`,
              amount: program.monthly_fee
            }
          }
        }
      });
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Student",
      details: { username, full_name: fullName, program_id: programId }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/students`);
    return { success: true };
  } catch (error) {
    console.error("Error creating student:", error);
    return { error: "Terjadi kesalahan internal pada server saat menyimpan siswa." };
  }
}

export async function updateStudentAction(studentId: string, formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const fullName = formData.get("full_name") as string;
  const parentWhatsapp = formData.get("parent_whatsapp") as string;
  const password = formData.get("password") as string; 

  if (!fullName) {
    return { error: "Nama lengkap wajib diisi." };
  }

  try {
    const existing = await prisma.student.findFirst({
      where: { id: studentId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Siswa tidak ditemukan." };

    const updateData: any = { 
      full_name: fullName,
      parent_whatsapp: parentWhatsapp || null,
    };

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
      updateData.must_change_password = true;
    }

    await prisma.student.update({
      where: { id: studentId },
      data: updateData
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Student",
      entity_id: studentId,
      details: { full_name: fullName, updated_password: !!password }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/students`);
    return { success: true };
  } catch (error) {
    console.error("Error updating student:", error);
    return { error: "Terjadi kesalahan internal pada server saat mengupdate siswa." };
  }
}

export async function deleteStudentAction(studentId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  try {
    const existing = await prisma.student.findFirst({
      where: { id: studentId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Siswa tidak ditemukan." };

    await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { 
          deleted_at: new Date(),
          username: `${existing.username}_del_${Date.now()}`
        }
      }),
      // Otomatis batalkan semua tagihan yang belum lunas
      prisma.invoice.updateMany({
        where: {
          student_id: studentId,
          payment_status: {
            in: ['UNPAID', 'OVERDUE']
          }
        },
        data: {
          payment_status: 'VOID'
        }
      })
    ]);

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "DELETE",
      entity_type: "Student",
      entity_id: studentId,
      details: { previous_username: existing.username, name: existing.full_name }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/students`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting student:", error);
    return { error: "Terjadi kesalahan internal pada server saat menghapus siswa." };
  }
}

export async function enrollStudentAction(studentId: string, programId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  try {
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_program_id: {
          student_id: studentId,
          program_id: programId
        }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'WITHDRAWN') {
        // Re-activate enrollment
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'ACTIVE',
            withdrawn_at: null,
            withdrawn_reason: null,
            withdrawn_notes: null,
            enrolled_date: new Date() // reset enrollment date
          }
        });
      } else {
        return { error: "Siswa sudah terdaftar dan aktif di program ini." };
      }
    } else {
      await prisma.enrollment.create({
        data: {
          student_id: studentId,
          program_id: programId,
        }
      });
    }

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/students`);
    return { success: true };
  } catch (error) {
    console.error("Error enrolling student:", error);
    return { error: "Terjadi kesalahan saat mendaftarkan siswa ke program." };
  }
}

export async function withdrawEnrollmentAction(enrollmentId: string, reason: WithdrawnReason, notes?: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true }
    });

    if (!enrollment || enrollment.student.academy_id !== session.academy_id) {
      return { error: "Data pendaftaran tidak ditemukan." };
    }

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'WITHDRAWN',
        withdrawn_at: new Date(),
        withdrawn_reason: reason,
        withdrawn_notes: notes || null
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/students`);
    return { success: true };
  } catch (error) {
    console.error("Error withdrawing student:", error);
    return { error: "Terjadi kesalahan saat menghentikan partisipasi siswa." };
  }
}
