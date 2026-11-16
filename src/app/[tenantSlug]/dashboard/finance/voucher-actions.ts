"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { createAuditLog } from "@/lib/audit";
import { DiscountType } from "@prisma/client";

export interface CreateVoucherInput {
  code: string;
  name: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  discount_value: number;
  max_discount?: number | null;
  min_purchase?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  program_id?: string | null;
}

/**
 * Mengambil seluruh voucher promo milik akademi bimbel.
 */
export async function getVouchersAction() {
  const auth = await requireAdminSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const vouchers = await prisma.promoVoucher.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null,
      },
      include: {
        program: {
          select: { id: true, name: true },
        },
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return {
      success: true,
      vouchers: vouchers.map((v) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        discountType: v.discount_type,
        discountValue: v.discount_value,
        maxDiscount: v.max_discount,
        minPurchase: v.min_purchase,
        startDate: v.start_date.toISOString(),
        endDate: v.end_date ? v.end_date.toISOString() : null,
        usageLimit: v.usage_limit,
        usedCount: v.used_count,
        isActive: v.is_active,
        programId: v.program_id,
        programName: v.program?.name || "Semua Program",
        createdAt: v.created_at.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching vouchers:", error);
    return { error: "Gagal memuat data voucher promo." };
  }
}

/**
 * Membuat kode voucher promo baru dengan validasi integritas.
 */
export async function createVoucherAction(input: CreateVoucherInput) {
  const auth = await requireAdminSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const rawCode = (input.code || "").trim().toUpperCase();
  const rawName = (input.name || "").trim();

  if (!rawCode || rawCode.length < 3) {
    return { error: "Kode voucher minimal 3 karakter (huruf/angka tanpa spasi)." };
  }

  // Format kode hanya boleh alfanumerik dan tanda hubung
  if (!/^[A-Z0-9_-]+$/.test(rawCode)) {
    return { error: "Kode voucher hanya boleh berisi huruf kapital, angka, dan strip (-)." };
  }

  if (!rawName) {
    return { error: "Nama promo / judul voucher wajib diisi." };
  }

  const discountVal = Number(input.discount_value);
  if (isNaN(discountVal) || discountVal <= 0) {
    return { error: "Besaran diskon harus lebih besar dari 0." };
  }

  if (input.discount_type === "PERCENTAGE" && discountVal > 100) {
    return { error: "Diskon persentase tidak boleh lebih dari 100%." };
  }

  // Cek duplikasi kode dalam akademi yang sama
  const existing = await prisma.promoVoucher.findFirst({
    where: {
      academy_id: session.academy_id,
      code: rawCode,
      deleted_at: null,
    },
  });

  if (existing) {
    return { error: `Kode voucher "${rawCode}" sudah terdaftar. Gunakan kode lain.` };
  }

  try {
    const voucher = await prisma.promoVoucher.create({
      data: {
        academy_id: session.academy_id,
        code: rawCode,
        name: rawName,
        discount_type: input.discount_type as DiscountType,
        discount_value: discountVal,
        max_discount: input.max_discount ? Number(input.max_discount) : null,
        min_purchase: input.min_purchase ? Number(input.min_purchase) : null,
        start_date: input.start_date ? new Date(input.start_date) : new Date(),
        end_date: input.end_date ? new Date(input.end_date) : null,
        usage_limit: input.usage_limit ? Number(input.usage_limit) : null,
        program_id: input.program_id && input.program_id !== "ALL" ? input.program_id : null,
        is_active: true,
      },
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "CREATE",
      entity_type: "PromoVoucher",
      entity_id: voucher.id,
      details: { code: rawCode, name: rawName, discount_value: discountVal },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    return { success: true, voucherId: voucher.id };
  } catch (error: any) {
    console.error("Error creating voucher:", error);
    return { error: "Gagal menyimpan voucher promo baru." };
  }
}

/**
 * Mengubah status aktif/nonaktif voucher promo.
 */
export async function toggleVoucherStatusAction(voucherId: string, isActive: boolean) {
  const auth = await requireAdminSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const voucher = await prisma.promoVoucher.findFirst({
    where: { id: voucherId, academy_id: session.academy_id, deleted_at: null },
  });

  if (!voucher) return { error: "Voucher promo tidak ditemukan." };

  try {
    await prisma.promoVoucher.update({
      where: { id: voucherId },
      data: { is_active: isActive },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling voucher status:", error);
    return { error: "Gagal memperbarui status voucher." };
  }
}

/**
 * Menghapus voucher promo secara soft-delete.
 */
export async function deleteVoucherAction(voucherId: string) {
  const auth = await requireAdminSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const voucher = await prisma.promoVoucher.findFirst({
    where: { id: voucherId, academy_id: session.academy_id, deleted_at: null },
  });

  if (!voucher) return { error: "Voucher promo tidak ditemukan." };

  try {
    await prisma.promoVoucher.update({
      where: { id: voucherId },
      data: { deleted_at: new Date() },
    });

    await createAuditLog({
      academy_id: session.academy_id,
      staff_id: session.id,
      action: "DELETE",
      entity_type: "PromoVoucher",
      entity_id: voucherId,
      details: { code: voucher.code },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/finance`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting voucher:", error);
    return { error: "Gagal menghapus voucher promo." };
  }
}

/**
 * Memvalidasi kode voucher dan menghitung potongan harga secara real-time.
 */
export async function validateVoucherAction(
  code: string,
  subtotal: number,
  programId?: string
) {
  const auth = await requireAdminSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { error: "Masukkan kode voucher terlebih dahulu." };
  }

  const voucher = await prisma.promoVoucher.findFirst({
    where: {
      academy_id: session.academy_id,
      code: cleanCode,
      deleted_at: null,
    },
    include: {
      program: { select: { id: true, name: true } },
    },
  });

  if (!voucher) {
    return { error: `Kode voucher "${cleanCode}" tidak ditemukan atau salah ketik.` };
  }

  if (!voucher.is_active) {
    return { error: `Kode voucher "${cleanCode}" saat ini sedang dinonaktifkan.` };
  }

  const now = new Date();
  if (voucher.start_date && new Date(voucher.start_date) > now) {
    return { error: `Voucher "${cleanCode}" belum mulai berlaku.` };
  }

  if (voucher.end_date && new Date(voucher.end_date) < now) {
    return { error: `Voucher "${cleanCode}" telah kedaluwarsa.` };
  }

  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
    return { error: `Kuota pemakaian voucher "${cleanCode}" telah habis.` };
  }

  if (voucher.program_id && programId && voucher.program_id !== programId) {
    return {
      error: `Voucher "${cleanCode}" hanya berlaku khusus untuk program ${voucher.program?.name || "tertentu"}.`,
    };
  }

  if (voucher.min_purchase && subtotal < voucher.min_purchase) {
    const formattedMin = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(voucher.min_purchase);
    return {
      error: `Minimal total tagihan ${formattedMin} untuk dapat menggunakan voucher ini.`,
    };
  }

  // Kalkulasi nominal diskon
  let discountAmount = 0;
  if (voucher.discount_type === "PERCENTAGE") {
    discountAmount = Math.round((subtotal * voucher.discount_value) / 100);
    if (voucher.max_discount && discountAmount > voucher.max_discount) {
      discountAmount = voucher.max_discount;
    }
  } else {
    discountAmount = voucher.discount_value;
  }

  // Potongan tidak boleh melebihi subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    success: true,
    voucher: {
      id: voucher.id,
      code: voucher.code,
      name: voucher.name,
      discountType: voucher.discount_type,
      discountValue: voucher.discount_value,
      maxDiscount: voucher.max_discount,
    },
    discountAmount,
    finalTotal: Math.max(0, subtotal - discountAmount),
  };
}

