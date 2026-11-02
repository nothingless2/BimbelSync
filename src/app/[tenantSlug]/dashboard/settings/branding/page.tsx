import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import BrandingClientPage from "./client-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Identitas Bimbel | BimbelSync",
  description: "Kelola logo, nama, dan identitas visual bimbel Anda.",
};

export default async function AcademyBrandingPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const auth = await requireAdminSession();
  if ("error" in auth) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = auth.session;
  if (session.tenant_slug !== tenantSlug) {
    redirect(`/${session.tenant_slug}/dashboard`);
  }

  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    select: {
      id: true,
      name: true,
      path_url: true,
      logo_url: true,
      phone: true,
    },
  });

  if (!academy) {
    redirect(`/${tenantSlug}/login`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Identitas & Logo Bimbel
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Sesuaikan logo resmi dan nama bimbel Anda. Identitas ini akan tampil di halaman login siswa & staf, sidebar aplikasi, dan portal bimbel Anda.
        </p>
      </div>

      <BrandingClientPage academy={academy} tenantSlug={tenantSlug} />
    </div>
  );
}

