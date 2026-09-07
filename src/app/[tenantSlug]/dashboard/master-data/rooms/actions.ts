"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createRoomAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const name = formData.get("name") as string;
  const capacityString = formData.get("capacity") as string;
  const capacity = parseInt(capacityString, 10);

  if (!name || isNaN(capacity) || capacity < 1) {
    return { error: "Data ruangan tidak valid. Harap periksa nama dan kapasitas." };
  }

  // Feature Gating: Check max_rooms from Plan
  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    include: {
      plan: true,
      _count: {
        select: { rooms: { where: { deleted_at: null } } }
      }
    }
  });

  if (!academy) return { error: "Data akademi tidak ditemukan." };

  const currentRooms = academy._count.rooms;
  const maxRooms = academy.plan.max_rooms;

  // max_rooms === null berarti Unlimited
  if (maxRooms !== null && currentRooms >= maxRooms) {
    return { error: `Batas paket tercapai! Paket "${academy.plan.name}" hanya mengizinkan maksimal ${maxRooms} ruangan. Harap upgrade paket Anda untuk menambah ruangan lagi.` };
  }

  try {
    await prisma.room.create({
      data: {
        academy_id: session.academy_id,
        name,
        capacity
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/rooms`);
    return { success: true };
  } catch (error) {
    console.error("Error creating room:", error);
    return { error: "Terjadi kesalahan internal pada server." };
  }
}
