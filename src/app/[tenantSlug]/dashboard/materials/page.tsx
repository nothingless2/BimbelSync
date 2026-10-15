import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import MaterialsClientPage from "./client-page";

export const metadata = {
  title: "Learning Materials | BimbelSync",
};

export default async function MaterialsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionCookie);
  if (!session || !session.academy_id) redirect(`/${tenantSlug}/login`);

  const [materials, programs] = await Promise.all([
    prisma.learningMaterial.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      include: {
        program: true,
        creator: {
          select: {
            name: true,
            email: true,
            avatar_url: true,
          }
        }
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.program.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      orderBy: { name: "asc" }
    })
  ]);

  // Feature Gating: Materi Pembelajaran mulai dari paket Growth
  const { checkFeatureAccess } = await import("@/lib/subscription");
  const { FeatureLockBanner } = await import("@/components/feature-lock-banner");
  const access = await checkFeatureAccess(session.academy_id, "learning_materials");

  if (!access.allowed && materials.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Learning Materials</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Repositori materi modul pembelajaran dan video kelas.
          </p>
        </div>
        <FeatureLockBanner
          title="Pengelolaan Materi Pembelajaran Terkunci"
          description={access.reason || "Pengelolaan dan pembagian materi pembelajaran tersedia mulai dari paket Growth."}
          requiredPlan="Growth"
          tenantSlug={tenantSlug}
          currentPlanName={access.planName}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!access.allowed && (
        <FeatureLockBanner
          title="Materi Pembelajaran (Mode Baca Saja)"
          description="Paket Anda saat ini adalah Starter. Anda tetap dapat membaca dan mengunduh materi historis yang sudah ada, namun penambahan materi baru dinonaktifkan."
          requiredPlan="Growth"
          tenantSlug={tenantSlug}
          currentPlanName={access.planName}
          readOnlyNotice={true}
        />
      )}
      <MaterialsClientPage 
        materials={materials} 
        programs={programs} 
        tenantSlug={tenantSlug} 
        academyId={session.academy_id} 
        userRole={session.role}
        isReadOnly={!access.allowed}
      />
    </div>
  );
}
