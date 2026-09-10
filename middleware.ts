import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

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
      const loginRes = NextResponse.redirect(new URL('/superadmin/login', req.url));
      loginRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return loginRes;
    }
    if (path === '/superadmin' || path === '/superadmin/') {
      const dashRes = NextResponse.redirect(new URL('/superadmin/dashboard', req.url));
      dashRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return dashRes;
    }
    const res = NextResponse.next();
    // Mencegah browser cache agar tidak bisa back ke dashboard setelah logout
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  }

  // 2. Proteksi Halaman Tenant (Bimbel)
  // Format URL Bimbel: /[slug-bimbel]/dashboard atau /[slug-bimbel]/siswa
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length > 0) {
    const tenantSlug = pathParts[0];
    
    if (!['api', '_next', 'favicon.ico', 'internal'].includes(tenantSlug)) {
      
      // Jika user mencoba mengakses /student/... tanpa menyebutkan slug bimbel di depannya
      if (tenantSlug === 'student') {
        return NextResponse.rewrite(new URL('/404', req.url));
      }
      
      const isDashboard = pathParts[1] === 'dashboard';
      const isSiswa = pathParts[1] === 'student';
      const isLoginStaff = pathParts[1] === 'login';
      const isLoginSiswa = pathParts[1] === 'student' && pathParts[2] === 'login';

      // Proteksi /dashboard (Hanya untuk Admin / Tutor)
      if (isDashboard) {
        if (!session || (session.role !== 'ADMIN' && session.role !== 'TUTOR')) {
          const res = NextResponse.redirect(new URL(`/${tenantSlug}/login`, req.url));
          res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
          return res;
        }
        // Cegah Admin lompat ke bimbel orang lain
        if (session.tenant_slug !== tenantSlug) {
            const res = NextResponse.redirect(new URL(`/${session.tenant_slug}/dashboard`,req.url));
            res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
            return res;
        }
      }
      
      // Proteksi /student (Hanya untuk Student)
      if (isSiswa && !isLoginSiswa) {
        if (!session || session.role !== 'STUDENT') {
          return NextResponse.redirect(new URL(`/${tenantSlug}/student/login`, req.url));
        }
        // Cegah Siswa lompat ke bimbel orang lain
        if (session.tenant_slug !== tenantSlug){
            return NextResponse.redirect(new URL(`/${session.tenant_slug}/student/dashboard`, req.url));
        }
        
        // Proteksi jika mengakses /student langsung tanpa sub-path
        if (pathParts.length === 2) { // just /[tenantSlug]/student
          return NextResponse.redirect(new URL(`/${tenantSlug}/student/dashboard`, req.url));
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
