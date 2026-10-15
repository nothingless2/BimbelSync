"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { requireAdminSession } from "@/lib/session";
import { executeWithQuotaLock, QuotaExceededError } from "@/lib/subscription";

export async function createRoomAction(formData: FormData) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const rawName = formData.get("name") as string;
  const name = rawName?.trim();
  const capacityString = formData.get("capacity") as string;
  const capacity = parseInt(capacityString, 10);

  if (!name || isNaN(capacity) || capacity < 1) {
    return { error: "Data ruangan tidak valid. Harap periksa nama dan kapasitas." };
  }

  try {
    await executeWithQuotaLock(session.academy_id, "rooms", 1, async (tx) => {
      // 1. Validasi duplikasi nama ruangan aktif di bawah lock kuota
      const existing = await tx.room.findFirst({
        where: {
          academy_id: session.academy_id as string,
          name: { equals: name, mode: "insensitive" },
          deleted_at: null,
        },
      });

      if (existing) {
        throw new Error(`Ruangan dengan nama "${name}" sudah terdaftar di bimbel Anda.`);
      }

      await tx.room.create({
        data: {
          academy_id: session.academy_id as string,
          name,
          capacity,
        },
      });
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "Room",
      details: { name, capacity },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/rooms`);
    return { success: true };
  } catch (error: any) {
    if (error instanceof QuotaExceededError) {
      return { error: error.message };
    }
    // Tangani PostgreSQL unique constraint violation (error code 23505 atau Prisma P2002)
    if (error?.code === "23505" || error?.code === "P2002") {
      return { error: `Ruangan dengan nama "${name}" sudah terdaftar di bimbel Anda.` };
    }
    console.error("Error creating room:", error);
    return { error: error.message || "Terjadi kesalahan internal pada server." };
  }
}

export async function updateRoomAction(roomId: string, formData: FormData) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const rawName = formData.get("name") as string;
  const name = rawName?.trim();
  const capacityString = formData.get("capacity") as string;
  const capacity = parseInt(capacityString, 10);

  if (!name || isNaN(capacity) || capacity < 1) {
    return { error: "Data ruangan tidak valid. Harap periksa nama dan kapasitas." };
  }

  try {
    const existing = await prisma.room.findFirst({
      where: { id: roomId, academy_id: session.academy_id, deleted_at: null },
    });

    if (!existing) return { error: "Ruangan tidak ditemukan." };

    // Validasi apakah nama baru bentrok dengan ruangan aktif lain
    const duplicate = await prisma.room.findFirst({
      where: {
        academy_id: session.academy_id,
        name: { equals: name, mode: "insensitive" },
        deleted_at: null,
        id: { not: roomId },
      },
    });

    if (duplicate) {
      return { error: `Ruangan dengan nama "${name}" sudah digunakan oleh ruangan lain.` };
    }

    await prisma.room.update({
      where: { id: roomId },
      data: {
        name,
        capacity,
      },
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "Room",
      entity_id: roomId,
      details: { name, capacity },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/rooms`);
    return { success: true };
  } catch (error: any) {
    if (error?.code === "23505" || error?.code === "P2002") {
      return { error: `Ruangan dengan nama "${name}" sudah digunakan oleh ruangan lain.` };
    }
    console.error("Error updating room:", error);
    return { error: "Terjadi kesalahan internal pada server saat mengupdate ruangan." };
  }
}

export async function deleteRoomAction(roomId: string) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const existing = await prisma.room.findFirst({
      where: { id: roomId, academy_id: session.academy_id }
    });

    if (!existing) return { error: "Ruangan tidak ditemukan." };

    await prisma.room.update({
      where: { id: roomId },
      data: { deleted_at: new Date() }
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "DELETE",
      entity_type: "Room",
      entity_id: roomId,
      details: { name: existing.name }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/master-data/rooms`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting room:", error);
    return { error: "Terjadi kesalahan internal pada server saat menghapus ruangan." };
  }
}
