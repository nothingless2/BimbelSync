import { cookies } from "next/headers";
import { decrypt, SessionPayload } from "@/lib/auth";

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
 * Helper untuk memastikan session valid dan memiliki academy_id.
 * Mengembalikan error object jika gagal, session jika berhasil.
 */
export async function requireTenantSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload & { academy_id: string }; error?: never }
> {
  const session = await getSession();
  if (!session || !session.academy_id) {
    return { error: "Akses ditolak." };
  }
  return { session: session as SessionPayload & { academy_id: string } };
}

/**
 * Helper untuk memastikan session adalah Superadmin.
 */
export async function requireSuperadminSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload; error?: never }
> {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return { error: "Akses ditolak." };
  }
  return { session };
}

/**
 * Helper untuk memastikan session adalah Admin Bimbel (Bukan Tutor/Siswa).
 */
export async function requireAdminSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload & { academy_id: string }; error?: never }
> {
  const session = await getSession();
  if (!session || !session.academy_id || session.role !== "ADMIN") {
    return { error: "Akses ditolak." };
  }
  return { session: session as SessionPayload & { academy_id: string } };
}

/**
 * Helper untuk memastikan session adalah Staff Bimbel (Admin atau Tutor).
 */
export async function requireStaffSession(): Promise<
  | { error: string; session?: never }
  | { session: SessionPayload & { academy_id: string }; error?: never }
> {
  const session = await getSession();
  if (!session || !session.academy_id || (session.role !== "ADMIN" && session.role !== "TUTOR")) {
    return { error: "Akses ditolak." };
  }
  return { session: session as SessionPayload & { academy_id: string } };
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
