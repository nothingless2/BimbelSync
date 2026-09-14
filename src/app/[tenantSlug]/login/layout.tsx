import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function TenantLoginLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  
  // Periksa apakah akademi ada dan tidak dihapus
  const academy = await prisma.academy.findFirst({
    where: { 
      path_url: tenantSlug, 
      deleted_at: null 
    }
  });

  // Jika akademi tidak ditemukan atau sudah dihapus (soft delete), 
  // lemparkan error 404 (Not Found) sehingga form login tidak di-render.
  if (!academy) {
    notFound();
  }

  return <>{children}</>;
}
