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
    return { error: "Sesi tidak valid atau sudah kadaluarsa." };
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
    return { error: "Akses ditolak. Hanya Superadmin." };
  }
  return { session };
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
