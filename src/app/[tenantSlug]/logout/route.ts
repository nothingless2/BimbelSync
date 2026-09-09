import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  cookieStore.delete("bimbelsync_session");
  const response = NextResponse.redirect(new URL(`/${resolvedParams.tenantSlug}/login`, request.url));
  
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
  
  return response;
}
