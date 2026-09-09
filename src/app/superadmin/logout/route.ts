import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("bimbelsync_session");
  const response = NextResponse.redirect(new URL("/superadmin/login", request.url));
  
  // Memaksa browser menghapus seluruh cache dan memori terkait situs untuk mencegah kembali melalui Back button
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
  
  return response;
}
