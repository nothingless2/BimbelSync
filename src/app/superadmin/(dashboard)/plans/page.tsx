import prisma from "@/lib/prisma";
import PlansClientPage from "./client-page";

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({
    where: { deleted_at: null, is_active: true },
    include: { _count: { select: { academies: true } } },
    orderBy: { price: "asc" },
  });

  return <PlansClientPage plans={plans} />;
}
