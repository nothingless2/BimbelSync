"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/programs`);
    return { success: true };
  } catch (error) {
    console.error("Error creating program:", error);
    return { error: "Terjadi kesalahan internal pada server saat menyimpan program." };
  }
}
