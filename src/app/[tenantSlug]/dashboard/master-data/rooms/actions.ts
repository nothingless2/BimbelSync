"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createRoomAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
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

export async function updateRoomAction(roomId: string, formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  const name = formData.get("name") as string;
  const capacityString = formData.get("capacity") as string;
  const capacity = parseInt(capacityString, 10);

  if (!name || isNaN(capacity) || capacity < 1) {
    return { error: "Data ruangan tidak valid. Harap periksa nama dan kapasitas." };
  }

  try {
    const existing = await prisma.room.findFirst({
      where: { id: roomId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Ruangan tidak ditemukan." };

    await prisma.room.update({
      where: { id: roomId },
      data: {
        name,
        capacity
      }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/rooms`);
    return { success: true };
  } catch (error) {
    console.error("Error updating room:", error);
    return { error: "Terjadi kesalahan internal pada server saat mengupdate ruangan." };
  }
}

export async function deleteRoomAction(roomId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) return { error: "Sesi tidak valid." };

  try {
    const existing = await prisma.room.findFirst({
      where: { id: roomId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Ruangan tidak ditemukan." };

    await prisma.room.update({
      where: { id: roomId },
      data: { deleted_at: new Date() }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/rooms`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting room:", error);
    return { error: "Terjadi kesalahan internal pada server saat menghapus ruangan." };
  }
}
