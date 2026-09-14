"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";

export async function createProgramAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const name = formData.get("name") as string;
  const maxCapacity = parseInt(formData.get("max_capacity") as string, 10);
  const monthlyFee = parseInt(formData.get("monthly_fee") as string, 10);
  
  const rawDuration = formData.get("duration_months") as string;
  const durationMonths = rawDuration ? parseInt(rawDuration, 10) : null;
  
  const rawMeetings = formData.get("total_meetings") as string;
  const totalMeetings = rawMeetings ? parseInt(rawMeetings, 10) : null;

  if (!name || isNaN(maxCapacity) || maxCapacity < 1 || isNaN(monthlyFee) || monthlyFee < 0) {
    return { error: "Data program tidak valid. Harap periksa kembali isian form Anda." };
  }

  try {
    await prisma.program.create({
      data: {
        academy_id: session.academy_id,
        name,
        max_capacity: maxCapacity,
        monthly_fee: monthlyFee,
        duration_months: durationMonths,
        total_meetings: totalMeetings,
      }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Program",
      details: { name, max_capacity: maxCapacity, monthly_fee: monthlyFee }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/programs`);
    return { success: true };
  } catch (error) {
    console.error("Error creating program:", error);
    return { error: "Terjadi kesalahan internal pada server saat menyimpan program." };
  }
}

export async function updateProgramAction(programId: string, formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const name = formData.get("name") as string;
  const maxCapacity = parseInt(formData.get("max_capacity") as string, 10);
  const monthlyFee = parseInt(formData.get("monthly_fee") as string, 10);
  
  const rawDuration = formData.get("duration_months") as string;
  const durationMonths = rawDuration ? parseInt(rawDuration, 10) : null;

  const rawMeetings = formData.get("total_meetings") as string;
  const totalMeetings = rawMeetings ? parseInt(rawMeetings, 10) : null;

  if (!name || isNaN(maxCapacity) || maxCapacity < 1 || isNaN(monthlyFee) || monthlyFee < 0) {
    return { error: "Data program tidak valid. Harap periksa kembali isian form Anda." };
  }

  try {
    const existing = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Program tidak ditemukan." };

    await prisma.program.update({
      where: { id: programId },
      data: {
        name,
        max_capacity: maxCapacity,
        monthly_fee: monthlyFee,
        duration_months: durationMonths,
        total_meetings: totalMeetings,
      }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Program",
      entity_id: programId,
      details: { name, max_capacity: maxCapacity, monthly_fee: monthlyFee }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/programs`);
    return { success: true };
  } catch (error) {
    console.error("Error updating program:", error);
    return { error: "Terjadi kesalahan internal pada server saat mengupdate program." };
  }
}

export async function deleteProgramAction(programId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  try {
    const existing = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Program tidak ditemukan." };

    await prisma.program.update({
      where: { id: programId },
      data: { deleted_at: new Date() }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "DELETE",
      entity_type: "Program",
      entity_id: programId,
      details: { name: existing.name }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/programs`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting program:", error);
    return { error: "Terjadi kesalahan internal pada server saat menghapus program." };
  }
}
