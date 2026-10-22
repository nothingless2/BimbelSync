import { cookies } from "next/headers";
import { decrypt, SessionPayload } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cache } from "react";

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
export interface StaffSessionUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "ADMIN" | "TUTOR";
  academy_id: string;
}

export interface StaffSessionPayload extends SessionPayload {
  id: string;
  role: "ADMIN" | "TUTOR";
  academy_id: string;
  tenant_slug: string;
  staff: StaffSessionUser;
}

/**
 * Helper ter-cache untuk memuat data staf aktif dari database.
 * React cache menduplikasi request lookup dalam siklus render request yang sama (misal layout + page).
 */
export const getActiveStaff = cache(async (staffId: string, academyId: string) => {
  return prisma.staff.findFirst({
    where: {
      id: staffId,
      academy_id: academyId,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar_url: true,
      role: true,
      academy_id: true,
      academy: {
        select: {
          id: true,
          name: true,
          path_url: true,
          deleted_at: true,
        },
      },
    },
  });
});

/**
 * Helper untuk memastikan session valid, belum dicabut, dan memiliki academy_id aktif di database.
 * Memvalidasi:
 * 1. Keberadaan token dan integritas JWT.
 * 2. Role di session adalah staf ('ADMIN' atau 'TUTOR').
 * 3. Record Staff di database masih aktif (deleted_at IS NULL).
 * 4. Akademi tempat staff bernaung masih aktif (deleted_at IS NULL).
 * 5. Relasi academy_id cocok dengan database (mencegah manipulasi session payload).
 * 6. Mengambil role real-time dari database untuk mencegah privilage escalation dari stale JWT.
 * 
 * Mengembalikan error object jika gagal, session terverifikasi jika berhasil.
 */
export async function requireTenantSession(): Promise<
  | { error: string; session?: never }
  | { session: StaffSessionPayload; error?: never }
> {
  const session = await getSession();
  if (!session || !session.id || !session.academy_id) {
    return { error: "Akses ditolak. Sesi tidak ditemukan atau telah kedaluwarsa." };
  }

  if (session.role !== "ADMIN" && session.role !== "TUTOR") {
    return { error: "Akses ditolak. Hak akses staf tidak valid." };
  }

  // Validasi real-time status staf dan akademi di database PostgreSQL (ter-cache per request)
  const staff = await getActiveStaff(session.id, session.academy_id);

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
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        avatar_url: staff.avatar_url,
        role: staff.role,
        academy_id: staff.academy_id as string,
      },
    },
  };
}

export interface SuperadminSessionUser {
  id: string;
  email: string;
  name: string | null;
  session_version: number;
}

export interface SuperadminSessionPayload extends SessionPayload {
  id: string;
  email: string;
  role: "SUPERADMIN";
  session_version: number;
  superadmin: SuperadminSessionUser;
}

/**
 * Helper ter-cache untuk memuat data superadmin aktif dari database.
 */
export const getActiveSuperadmin = cache(async (superadminId: string) => {
  return prisma.superadmin.findFirst({
    where: {
      id: superadminId,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      session_version: true,
    },
  });
});

/**
 * Helper untuk memastikan session adalah Superadmin yang masih aktif di database.
 * Memvalidasi:
 * 1. Keberadaan token dan integritas JWT.
 * 2. Role di session adalah 'SUPERADMIN'.
 * 3. Record Superadmin di database masih aktif (deleted_at IS NULL).
 * 4. session_version pada cookie JWT cocok dengan session_version di database (session revocation check).
 */
export async function requireSuperadminSession(): Promise<
  | { error: string; session?: never }
  | { session: SuperadminSessionPayload; error?: never }
> {
  const session = await getSession();
  if (!session || !session.id || session.role !== "SUPERADMIN") {
    return { error: "Akses ditolak. Sesi Superadmin tidak valid atau telah kedaluwarsa." };
  }

  const superadmin = await getActiveSuperadmin(session.id);

  if (!superadmin) {
    return { error: "Akses ditolak. Akun Superadmin tidak valid atau telah dinonaktifkan." };
  }

  if (superadmin.session_version !== session.session_version) {
    return { error: "Akses ditolak. Sesi telah dicabut. Silakan login kembali." };
  }

  return {
    session: {
      ...session,
      id: superadmin.id,
      email: superadmin.email,
      role: "SUPERADMIN",
      session_version: superadmin.session_version,
      superadmin: {
        id: superadmin.id,
        email: superadmin.email,
        name: superadmin.name,
        session_version: superadmin.session_version,
      },
    },
  };
}

/**
 * Helper untuk memastikan session adalah Admin Bimbel aktif (Bukan Tutor/Siswa).
 */
export async function requireAdminSession(): Promise<
  | { error: string; session?: never }
  | { session: StaffSessionPayload & { role: "ADMIN" }; error?: never }
> {
  const tenantAuth = await requireTenantSession();
  if (tenantAuth.error || !tenantAuth.session) {
    return { error: tenantAuth.error || "Akses ditolak." };
  }

  if (tenantAuth.session.role !== "ADMIN") {
    return { error: "Akses ditolak. Operasi ini membutuhkan hak akses Administrator." };
  }

  return { session: tenantAuth.session as StaffSessionPayload & { role: "ADMIN" } };
}

/**
 * Helper untuk memastikan session adalah Staff Bimbel aktif (Admin atau Tutor).
 */
export async function requireStaffSession(): Promise<
  | { error: string; session?: never }
  | { session: StaffSessionPayload; error?: never }
> {
  const tenantAuth = await requireTenantSession();
  if (tenantAuth.error || !tenantAuth.session) {
    return { error: tenantAuth.error || "Akses ditolak." };
  }

  if (tenantAuth.session.role !== "ADMIN" && tenantAuth.session.role !== "TUTOR") {
    return { error: "Akses ditolak. Hak akses staf tidak valid." };
  }

  return { session: tenantAuth.session };
}

/**
 * Helper ter-cache untuk memuat data student aktif dari database.
 * React cache menduplikasi request lookup dalam siklus render request yang sama (misal layout + page).
 */
export const getActiveStudent = cache(async (studentId: string, academyId: string) => {
  return prisma.student.findFirst({
    where: {
      id: studentId,
      academy_id: academyId,
      deleted_at: null,
    },
    select: {
      id: true,
      full_name: true,
      username: true,
      must_change_password: true,
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
});

export interface StudentSessionUser {
  id: string;
  full_name: string;
  username: string;
  must_change_password: boolean;
  academy_id: string;
}

export interface StudentSessionPayload extends SessionPayload {
  id: string;
  role: "STUDENT";
  academy_id: string;
  tenant_slug: string;
  student: StudentSessionUser;
}

/**
 * Helper untuk memastikan session adalah Siswa (STUDENT) yang masih aktif di database.
 * Memvalidasi:
 * 1. Keberadaan token dan integritas JWT.
 * 2. Role di session adalah 'STUDENT'.
 * 3. Record Student di database masih aktif (deleted_at IS NULL).
 * 4. Akademi tempat siswa bernaung masih aktif (deleted_at IS NULL).
 * 5. Relasi academy_id cocok dengan database (mencegah manipulasi session payload).
 * 
 * Mengembalikan error object jika gagal, session terverifikasi jika berhasil.
 */
export async function requireStudentSession(): Promise<
  | { error: string; session?: never }
  | { session: StudentSessionPayload; error?: never }
> {
  const session = await getSession();
  if (!session || !session.id || !session.academy_id || session.role !== "STUDENT") {
    return { error: "Akses ditolak. Sesi siswa tidak valid atau telah kedaluwarsa." };
  }

  const student = await getActiveStudent(session.id, session.academy_id);

  if (!student || !student.academy || student.academy.deleted_at !== null) {
    return { error: "Akses ditolak. Akun siswa atau akademi telah dinonaktifkan." };
  }

  return {
    session: {
      ...session,
      id: student.id,
      role: "STUDENT",
      academy_id: student.academy_id,
      tenant_slug: student.academy.path_url,
      student: {
        id: student.id,
        full_name: student.full_name,
        username: student.username,
        must_change_password: student.must_change_password,
        academy_id: student.academy_id,
      },
    },
  };
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
