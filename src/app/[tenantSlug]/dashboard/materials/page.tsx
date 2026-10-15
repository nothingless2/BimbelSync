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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <MaterialsClientPage 
        materials={materials} 
        programs={programs} 
        tenantSlug={tenantSlug} 
        academyId={session.academy_id} 
        userRole={session.role}
      />
    </div>
  );
}
