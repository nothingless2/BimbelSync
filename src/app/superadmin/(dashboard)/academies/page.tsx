import prisma from "@/lib/prisma";
import AcademiesClientPage from "./client-page";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { validateSearchQuery } from "@/lib/search-validation";

export default async function AcademiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
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
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { path_url: { contains: q, mode: "insensitive" } }
      ];
    }

    const [academies, plans] = await Promise.all([
      prisma.academy.findMany({
        where: whereClause,
        include: {
          plan: true,
          _count: { select: { students: true, staff: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.plan.findMany({
        where: { deleted_at: null, is_active: true },
        orderBy: { price: "asc" },
      }),
    ]);

    return <AcademiesClientPage academies={academies} plans={plans} />;
  } catch (error) {
    console.error("Error fetching academies:", error);
    // Generic error fallback
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat daftar akademi. Silakan coba lagi nanti.</p>
      </div>
    );
  }
}
