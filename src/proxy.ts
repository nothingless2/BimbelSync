import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Baca sesi dari cookie browser
  // Baca sesi dari cookie browser
  const sessionCookie = req.cookies.get('bimbelsync_session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // 1. Proteksi Superadmin Panel (/internal dan /superadmin)
  if (path.startsWith('/internal')) {
    if (path === '/internal/login') return NextResponse.next();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/internal/login', req.url));
    }
    return NextResponse.next();
  }

  // Proteksi rute /superadmin (redirect ke halaman login superadmin)
  if (path.startsWith('/superadmin')) {
    if (path === '/superadmin/login') return NextResponse.next();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/superadmin/login', req.url));
    }
    return NextResponse.next();
  }

  // 2. Proteksi Halaman Tenant (Bimbel)
  // Format URL Bimbel: /[slug-bimbel]/dashboard atau /[slug-bimbel]/siswa
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length > 0) {
    const tenantSlug = pathParts[0];
    
    // Abaikan sistem file Next.js
    if (!['api', '_next', 'favicon.ico', 'internal'].includes(tenantSlug)) {
      
      const isDashboard = pathParts[1] === 'dashboard';
      const isSiswa = pathParts[1] === 'siswa';
      const isLoginStaff = pathParts[1] === 'login';
      const isLoginSiswa = pathParts[1] === 'siswa' && pathParts[2] === 'login';

      // Proteksi /dashboard (Hanya untuk Admin / Tutor)
      if (isDashboard) {
        if (!session || (session.role !== 'ADMIN' && session.role !== 'TUTOR')) {
          return NextResponse.redirect(new URL(`/${tenantSlug}/login`, req.url));
        }
        // Cegah Admin lompat ke bimbel orang lain
        if (session.tenant_slug !== tenantSlug) {
            return NextResponse.redirect(new URL(`/${session.tenant_slug}/dashboard`,req.url));
        }
      }
      
      // Proteksi /siswa (Hanya untuk Student)
      if (isSiswa && !isLoginSiswa) {
        if (!session || session.role !== 'STUDENT') {
          return NextResponse.redirect(new URL(`/${tenantSlug}/siswa/login`, req.url));
        }
        // Cegah Siswa lompat ke bimbel orang lain
        if (session.tenant_slug !== tenantSlug){
            return NextResponse.redirect(new URL(`/${session.tenant_slug}/siswa`, req.url));
        }
      }
    }
  }

  return NextResponse.next();
}

// Jalankan middleware di semua halaman, KECUALI API dan file gambar/sistem
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
