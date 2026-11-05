import prisma from "@/lib/prisma";
import SystemUsersClient from "./client-page";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SystemUsersPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  try {
    const [superadmins, staffUsers, studentUsers] = await Promise.all([
      prisma.superadmin.findMany({
        where: { deleted_at: null },
        orderBy: { email: "asc" },
      }),
      prisma.staff.findMany({
        include: {
          academy: {
            select: { id: true, name: true, path_url: true, deleted_at: true },
          },
        },
        orderBy: { email: "asc" },
      }),
      prisma.student.findMany({
        include: {
          academy: {
            select: { id: true, name: true, path_url: true, deleted_at: true },
          },
        },
        orderBy: { full_name: "asc" },
      }),
    ]);

    const tenantUsers = [
      ...staffUsers.map((s) => ({
        id: s.id,
        name: s.name || s.email.split("@")[0],
        identifier: s.email,
        email: s.email,
        phone: s.phone || "-",
        userType: "STAFF" as const,
        role: s.role === "ADMIN" ? "Admin Bimbel" : "Tutor",
        rawRole: s.role,
        academyId: s.academy?.id || null,
        academyName: s.academy?.name || "Belum Terhubung",
        academySlug: s.academy?.path_url || "",
        isDeleted: Boolean(s.deleted_at || s.academy?.deleted_at),
        userDeleted: Boolean(s.deleted_at),
        academyDeleted: Boolean(s.academy?.deleted_at),
      })),
      ...studentUsers.map((st) => ({
        id: st.id,
        name: st.full_name,
        identifier: st.username,
        email: st.email || "-",
        phone: st.parent_whatsapp || "-",
        userType: "STUDENT" as const,
        role: "Siswa",
        rawRole: "STUDENT",
        academyId: st.academy?.id || null,
        academyName: st.academy?.name || "Belum Terhubung",
        academySlug: st.academy?.path_url || "",
        isDeleted: Boolean(st.deleted_at || st.academy?.deleted_at),
        userDeleted: Boolean(st.deleted_at),
        academyDeleted: Boolean(st.academy?.deleted_at),
      })),
    ];

    return <SystemUsersClient currentSuperadminId={session.id} superadmins={superadmins} tenantUsers={tenantUsers} />;
  } catch (error) {
    console.error("Error fetching users directory:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat direktori pengguna. Silakan coba lagi nanti.</p>
      </div>
    );
  }
}
