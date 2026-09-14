import prisma from "@/lib/prisma";
import ArchivedClientPage from "./client-page";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ArchivedAcademiesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  try {
    const academies = await prisma.academy.findMany({
      where: { deleted_at: { not: null } },
      include: {
        plan: true,
      },
      orderBy: { deleted_at: "desc" },
    });

    return <ArchivedClientPage academies={academies} />;
  } catch (error) {
    console.error("Error fetching archived academies:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat daftar arsip akademi.</p>
      </div>
    );
  }
}
