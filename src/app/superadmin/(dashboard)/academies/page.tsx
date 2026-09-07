import prisma from "@/lib/prisma";
import AcademiesClientPage from "./client-page";

export default async function AcademiesPage() {
  const [academies, plans] = await Promise.all([
    prisma.academy.findMany({
      where: { deleted_at: null },
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
}
