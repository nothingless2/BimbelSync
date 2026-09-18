import prisma from "@/lib/prisma";
import SystemUsersClient from "./client-page";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { validateSearchQuery } from "@/lib/search-validation";

export default async function SystemUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  const queryParams = await searchParams;
  const q = validateSearchQuery(queryParams?.q);

  try {
    const whereClause: any = { deleted_at: null };
    
    if (q) {
      whereClause.email = { contains: q, mode: "insensitive" };
    }

    const users = await prisma.superadmin.findMany({
      where: whereClause,
      orderBy: { email: 'asc' }
    });

    return <SystemUsersClient users={users} />;
  } catch (error) {
    console.error("Error fetching superadmins:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat daftar System Users. Silakan coba lagi nanti.</p>
      </div>
    );
  }
}
