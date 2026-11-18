import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

/**
 * Next.js Edge Middleware — Route Guard
 *
 * Melindungi semua rute terproteksi di level edge sebelum halaman dirender,
 * menambahkan lapisan pertahanan pertama (defense-in-depth) selain
 * validasi session di setiap Server Action dan Page.
 *
 * Rute yang dilindungi:
 * - /superadmin/(dashboard)/* → harus SUPERADMIN
 * - /[tenantSlug]/dashboard/* → harus ADMIN atau TUTOR
 * - /[tenantSlug]/student/(protected)/* → harus STUDENT
 * - /onboarding → harus punya session (belum setup bimbel)
 *
 * Rute publik yang dikecualikan (tidak butuh session):
 * - /                       → landing page
 * - /login                  → login unified
 * - /register               → pendaftaran bimbel baru
 * - /verify-otp             → verifikasi OTP
 * - /forgot-password        → reset password
 * - /reset-password         → konfirmasi reset
 * - /privacy, /terms        → halaman publik
 * - /[tenantSlug]/login     → login per-tenant
 * - /[tenantSlug]/logout    → logout per-tenant
 * - /superadmin/login       → login superadmin
 * - /superadmin/logout      → logout superadmin
 * - /api/*                  → API routes (punya auth sendiri)
 * - /_next/*                → Next.js internal assets
 */

// --- Pola Rute ---

/** Rute yang HANYA boleh diakses oleh SUPERADMIN */
const SUPERADMIN_ROUTES = /^\/superadmin(?!\/login|\/logout)(\/|$)/;

/** Rute dashboard tenant (Admin & Tutor) */
const TENANT_DASHBOARD_ROUTES = /^\/[^/]+\/dashboard(\/|$)/;

/** Rute portal siswa (semua kecuali change-password yang bisa diakses tanpa full session) */
const STUDENT_PROTECTED_ROUTES = /^\/[^/]+\/student(?!\/change-password)(\/|$)/;

/** Rute onboarding setelah register (session diperlukan tapi belum ada academy) */
const ONBOARDING_ROUTE = /^\/onboarding(\/|$)/;

/** Rute yang sepenuhnya publik — middleware tidak perlu campur tangan */
const PUBLIC_ROUTES = /^\/(login|register|verify-otp|forgot-password|reset-password|privacy|terms|_next|api|favicon|icons|sw\.js|manifest|[^/]+\/(login|logout|present)|superadmin\/(login|logout))(\/.*)?$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati halaman utama (landing page), rute publik, dan seluruh file aset statis (file berekstensi seperti .avif, .png, .mp4, dll.)
  if (pathname === "/" || PUBLIC_ROUTES.test(pathname) || pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next();
  }

  // Hanya wajibkan pengecekan session pada area rute yang memang dilindungi
  const isProtectedRoute =
    SUPERADMIN_ROUTES.test(pathname) ||
    TENANT_DASHBOARD_ROUTES.test(pathname) ||
    STUDENT_PROTECTED_ROUTES.test(pathname) ||
    ONBOARDING_ROUTE.test(pathname);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Baca session JWT dari cookie HttpOnly
  const sessionCookie = request.cookies.get("bimbelsync_session")?.value;

  // Jika tidak ada session sama sekali → redirect ke halaman login yang sesuai
  if (!sessionCookie) {
    return redirectToLogin(request, pathname);
  }

  // Dekode JWT (tanpa hit database — middleware berjalan di Edge)
  let session: Awaited<ReturnType<typeof decrypt>>;
  try {
    session = await decrypt(sessionCookie);
  } catch {
    // Token tidak valid / expired / tampered
    return redirectToLogin(request, pathname);
  }

  if (!session) {
    return redirectToLogin(request, pathname);
  }

  // --- Validasi role berdasarkan rute ---

  // Superadmin area
  if (SUPERADMIN_ROUTES.test(pathname)) {
    if (session.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/superadmin/login", request.url));
    }
    return NextResponse.next();
  }

  // Tenant dashboard (Admin / Tutor)
  if (TENANT_DASHBOARD_ROUTES.test(pathname)) {
    if (session.role !== "ADMIN" && session.role !== "TUTOR") {
      // Siswa yang nyasar ke dashboard → ke portal siswa
      if (session.role === "STUDENT" && session.tenant_slug) {
        return NextResponse.redirect(
          new URL(`/${session.tenant_slug}/student/dashboard`, request.url)
        );
      }
      return redirectToLogin(request, pathname);
    }

    // Pastikan slug di URL cocok dengan academy milik staf (mencegah akses lintas tenant)
    const urlSlug = pathname.split("/")[1];
    if (session.tenant_slug && urlSlug !== session.tenant_slug) {
      return NextResponse.redirect(
        new URL(`/${session.tenant_slug}/dashboard`, request.url)
      );
    }

    return NextResponse.next();
  }

  // Portal siswa
  if (STUDENT_PROTECTED_ROUTES.test(pathname)) {
    if (session.role !== "STUDENT") {
      return redirectToLogin(request, pathname);
    }

    // Pastikan slug di URL cocok dengan tenant siswa
    const urlSlug = pathname.split("/")[1];
    if (session.tenant_slug && urlSlug !== session.tenant_slug) {
      return NextResponse.redirect(
        new URL(`/${session.tenant_slug}/student/dashboard`, request.url)
      );
    }

    return NextResponse.next();
  }

  // Onboarding (admin yang baru daftar, belum ada academy)
  if (ONBOARDING_ROUTE.test(pathname)) {
    if (!session.id) {
      return redirectToLogin(request, pathname);
    }
    return NextResponse.next();
  }

  // Semua rute lain — izinkan lewat (proteksi ada di Server Action/Page)
  return NextResponse.next();
}

/**
 * Redirect ke halaman login yang kontekstual berdasarkan pola URL.
 * Menyimpan URL tujuan di searchParam `from` agar bisa redirect balik setelah login.
 */
function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  // Superadmin area
  if (pathname.startsWith("/superadmin")) {
    return NextResponse.redirect(new URL("/superadmin/login", request.url));
  }

  // Tenant area — ekstrak slug dari URL
  const slugMatch = pathname.match(/^\/([^/]+)\//);
  if (slugMatch) {
    const slug = slugMatch[1];
    // Jangan redirect ke login jika slug adalah rute root-level app
    const rootRoutes = ["login", "register", "verify-otp", "forgot-password", "reset-password", "privacy", "terms", "onboarding", "api", "_next"];
    if (!rootRoutes.includes(slug)) {
      const loginUrl = new URL(`/${slug}/login`, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Fallback ke login unified
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Konfigurasi matcher — Next.js hanya menjalankan middleware
 * pada path yang cocok (tidak termasuk aset statis & _next internal).
 */
export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua path KECUALI:
     * - _next/static  (file statis Next.js)
     * - _next/image   (image optimization)
     * - favicon.ico   (browser favicon)
     * - File aset publik (.png, .svg, .webp, .avif, .mp4, dll.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|ico|css|js|woff|woff2|ttf|eot|webmanifest|xml|txt)$).*)",
  ],
};
