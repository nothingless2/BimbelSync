import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  cookieStore.delete({
    name: "bimbelsync_session",
    path: "/",
  });

  const response = NextResponse.redirect(new URL("/superadmin/login", request.url));
  
  // Cegah browser menyimpan cache halaman dashboard tanpa menghancurkan cache aset
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  
  return response;
}
