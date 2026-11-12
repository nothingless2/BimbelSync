import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  
  cookieStore.delete({
    name: "bimbelsync_session",
    path: "/",
  });

  const redirectUrl = new URL(`/${resolvedParams.tenantSlug}/login`, request.url);
  const response = NextResponse.redirect(redirectUrl);
  
  // Cegah browser menyimpan cache halaman terproteksi di memori navigasi tanpa menghancurkan cache aset
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  
  return response;
}
