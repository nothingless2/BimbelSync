import { cookies } from "next/headers";
import { decrypt, SessionPayload } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Helper reusable untuk mengambil session dari cookie JWT.
 * Mengurangi duplikasi kode auth di setiap server action dan page.
 * 
 * @returns SessionPayload jika valid, null jika tidak ada/expired.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return null;
  return decrypt(sessionToken);
}

/**
 * Helper untuk memastikan session valid, belum dicabut, dan memiliki academy_id aktif di database.
 * Memvalidasi:
 * 1. Keberadaan token dan integritas JWT.
 * 2. Record Staff di database masih aktif (deleted_at IS NULL).
 * 3. Akademi tempat staff bernaung masih aktif (deleted_at IS NULL).
 * 4. Relasi academy_id cocok dengan database (mencegah manipulasi session payload).
 * 
 * Mengembalikan error object jika gagal, session terverifikasi jika berhasil.
 */
export async function requireTenantSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload & { academy_id: string }; error?: never }
> {
  const session = await getSession();
  if (!session || !session.id || !session.academy_id) {
    return { error: "Akses ditolak. Sesi tidak ditemukan atau telah kedaluwarsa." };
  }

  // Validasi real-time status staf dan akademi di database PostgreSQL
  const staff = await prisma.staff.findFirst({
    where: {
      id: session.id,
      academy_id: session.academy_id,
      deleted_at: null,
    },
    select: {
      id: true,
      role: true,
      academy_id: true,
      academy: {
        select: {
          id: true,
          path_url: true,
          deleted_at: true,
        },
      },
    },
  });

  if (!staff || !staff.academy || staff.academy.deleted_at !== null) {
    return { error: "Akses ditolak. Akun staf atau akademi telah dinonaktifkan." };
  }

  return {
    session: {
      ...session,
      id: staff.id,
      role: staff.role,
      academy_id: staff.academy_id as string,
      tenant_slug: staff.academy.path_url,
    },
  };
}

/**
 * Helper untuk memastikan session adalah Superadmin yang masih aktif di database.
 */
export async function requireSuperadminSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload; error?: never }
> {
  const session = await getSession();
  if (!session || !session.id || session.role !== "SUPERADMIN") {
    return { error: "Akses ditolak." };
  }

  const superadmin = await prisma.superadmin.findFirst({
    where: {
      id: session.id,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      session_version: true,
    },
  });

  if (!superadmin) {
    return { error: "Akses ditolak. Akun Superadmin tidak valid atau telah dinonaktifkan." };
  }

  return { session };
}

/**
 * Helper untuk memastikan session adalah Admin Bimbel aktif (Bukan Tutor/Siswa).
 */
export async function requireAdminSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload & { academy_id: string }; error?: never }
> {
  const tenantAuth = await requireTenantSession();
  if ("error" in tenantAuth) return tenantAuth;

  if (tenantAuth.session.role !== "ADMIN") {
    return { error: "Akses ditolak. Operasi ini membutuhkan hak akses Administrator." };
  }

  return tenantAuth;
}

/**
 * Helper untuk memastikan session adalah Staff Bimbel aktif (Admin atau Tutor).
 */
export async function requireStaffSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload & { academy_id: string }; error?: never }
> {
  const tenantAuth = await requireTenantSession();
  if ("error" in tenantAuth) return tenantAuth;

  if (tenantAuth.session.role !== "ADMIN" && tenantAuth.session.role !== "TUTOR") {
    return { error: "Akses ditolak. Hak akses staf tidak valid." };
  }

  return tenantAuth;
}

/**
 * Format angka ke Rupiah (reusable utility).
 */
export function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
