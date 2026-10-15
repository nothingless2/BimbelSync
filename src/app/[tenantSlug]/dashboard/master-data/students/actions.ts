"use server";

import prisma from "@/lib/prisma";
import { validatePassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { WithdrawnReason } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { requireAdminSession } from "@/lib/session";
import { executeWithQuotaLock, QuotaExceededError } from "@/lib/subscription";

export async function createStudentAction(formData: FormData) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const fullName = formData.get("full_name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const email = formData.get("email") as string;
  const parentWhatsapp = formData.get("parent_whatsapp") as string;
  const programId = formData.get("program_id") as string;

  if (!fullName || !username || !password || !programId) {
    return { error: "Semua field wajib (kecuali WhatsApp) harus diisi, dan siswa harus dimasukkan ke dalam sebuah program." };
  }

  const pwValidation = validatePassword(password);
  if (!pwValidation.isValid) {
    return { error: pwValidation.errorMsg };
  }

  try {
    const program = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id, deleted_at: null }
    });
    if (!program) return { error: "Program tidak ditemukan." };

    const passwordHash = await bcrypt.hash(password, 10);

    await executeWithQuotaLock(session.academy_id, "students", 1, async (tx) => {
      const existingStudent = await tx.student.findUnique({
        where: {
          academy_id_username: {
            academy_id: session.academy_id as string,
            username: username
          }
        }
      });

      if (existingStudent) {
        if (existingStudent.deleted_at) {
          throw new Error("Username ini terdaftar pada siswa yang sudah dihapus. Harap gunakan username lain.");
        }
        throw new Error("Username ini sudah digunakan oleh siswa lain.");
      }

      const student = await tx.student.create({
        data: {
          academy_id: session.academy_id as string,
          full_name: fullName,
          username,
          password_hash: passwordHash,
          email: email || null,
          parent_whatsapp: parentWhatsapp || null,
        }
      });

      await tx.enrollment.create({
        data: {
          student_id: student.id,
          program_id: programId,
        }
      });

      const currentMonthPeriod = new Date().toISOString().substring(0, 7);

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
  } catch (error: any) {
    if (error instanceof QuotaExceededError) {
      return { error: error.message };
    }
    console.error("Error creating student:", error);
    return { error: error.message || "Terjadi kesalahan internal pada server saat menyimpan siswa." };
  }
}

export async function updateStudentAction(studentId: string, formData: FormData) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
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
      email: email || null,
      parent_whatsapp: parentWhatsapp || null,
    };

    if (password) {
      const pwValidation = validatePassword(password);
      if (!pwValidation.isValid) {
        return { error: pwValidation.errorMsg };
      }
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
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

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
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

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
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

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

export async function bulkCreateStudentsAction(programId: string, studentsToImport: { full_name: string, username: string, email?: string, parent_whatsapp: string }[]) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  if (!programId) {
    return { error: "Program harus dipilih." };
  }

  if (!studentsToImport || studentsToImport.length === 0) {
    return { error: "Data siswa kosong." };
  }

  const amountToImport = studentsToImport.length;

  try {
    const program = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id, deleted_at: null }
    });
    if (!program) return { error: "Program tidak ditemukan." };

    // Default password: username + "123!"
    // Pre-calculate hashes outside transaction to keep lock duration as short as possible
    const studentsWithHashes = await Promise.all(studentsToImport.map(async (s) => {
      const defaultPassword = `${s.username}123!`;
      const hash = await bcrypt.hash(defaultPassword, 10);
      return { ...s, password_hash: hash };
    }));

    await executeWithQuotaLock(session.academy_id, "students", amountToImport, async (tx) => {
      // Get all existing usernames to check for duplicates inside transaction
      const incomingUsernames = studentsToImport.map(s => s.username);
      const existingStudents = await tx.student.findMany({
        where: {
          academy_id: session.academy_id as string,
          username: { in: incomingUsernames }
        }
      });

      if (existingStudents.length > 0) {
        const existingNames = existingStudents.map(s => s.username).join(", ");
        throw new Error(`Username berikut sudah digunakan atau pernah dihapus: ${existingNames}.`);
      }

      const currentMonthPeriod = new Date().toISOString().substring(0, 7);
      
      for (const s of studentsWithHashes) {
        const student = await tx.student.create({
          data: {
            academy_id: session.academy_id as string,
            full_name: s.full_name,
            username: s.username,
            password_hash: s.password_hash,
            email: s.email || null,
            parent_whatsapp: s.parent_whatsapp || null,
            must_change_password: true,
          }
        });

        await tx.enrollment.create({
          data: {
            student_id: student.id,
            program_id: programId,
          }
        });

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
      }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Student",
      details: { action: "BULK_IMPORT", amount: amountToImport, program_id: programId }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/students`);
    return { success: true };
  } catch (error: any) {
    if (error instanceof QuotaExceededError) {
      return { error: error.message };
    }
    console.error("Error bulk creating students:", error);
    return { error: error.message || "Terjadi kesalahan internal pada server saat melakukan impor." };
  }
}
