import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import MaterialsClientPage from "./client-page";

export const metadata = {
  title: "Learning Materials | BimbelSync",
};

export default async function MaterialsPage({ params }: { params: { tenantSlug: string } }) {
  const { tenantSlug } = params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionCookie);
  if (!session || !session.id) redirect(`/${tenantSlug}/login`);

  const dbUser = await prisma.staff.findUnique({
    where: {
      academy_id_email: {
        academy_id: session.academy_id as string,
        email: session.email as string,
      }
    }
  });

  if (!dbUser) redirect(`/${tenantSlug}/login`);

  const materials = await prisma.learningMaterial.findMany({
    where: { academy_id: dbUser.academy_id, deleted_at: null },
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
  });

  const programs = await prisma.program.findMany({
    where: { academy_id: dbUser.academy_id, deleted_at: null },
    orderBy: { name: "asc" }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <MaterialsClientPage 
        materials={materials} 
        programs={programs} 
        tenantSlug={tenantSlug} 
        academyId={dbUser.academy_id} 
      />
    </div>
  );
}
