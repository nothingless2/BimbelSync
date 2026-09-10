import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("bimbelsync_session");

  const response = NextResponse.redirect(new URL("/superadmin/login", request.url));

  // Hapus cookie secara eksplisit di response header juga (double protection)
  response.cookies.delete("bimbelsync_session");

  // Mencegah browser menyimpan halaman ini di cache
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // Perintahkan browser menghapus cache, cookie, dan storage situs ini
  // Ini yang mencegah Next.js Router Cache menampilkan dashboard sekilas
  response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');

  return response;
}
