'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function loginTenantAction(tenantSlug: string, formData: FormData) {
  const identifier = formData.get('email') as string; // bisa email atau username
  const password = formData.get('password') as string;

  try {
    // 1. Cek apakah Akademi ada
    const academy = await prisma.academy.findUnique({
      where: { path_url: tenantSlug }
    });

    if (!academy) {
      return { error: 'Bimbel tidak ditemukan di sistem kami.' };
    }

    // 2. Coba cari sebagai Staff (menggunakan email)
    const staff = await prisma.staff.findFirst({
      where: {
        email: identifier,
        academy_id: academy.id
      }
    });

    if (staff) {
      const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
      if (isPasswordValid) {
        const sessionToken = await encrypt({
          id: staff.id,
          role: staff.role,
          academy_id: academy.id,
          tenant_slug: academy.path_url
        });
        
        const cookieStore = await cookies();
        cookieStore.set('bimbelsync_session', sessionToken, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8,
        });

        return { success: true, redirectUrl: `/${tenantSlug}/dashboard` };
      }
    }

    // 3. Jika bukan Staff, coba cari sebagai Student (menggunakan username)
    const student = await prisma.student.findFirst({
      where: {
        username: identifier,
        academy_id: academy.id
      }
    });

    if (student) {
      const isPasswordValid = await bcrypt.compare(password, student.password_hash);
      if (isPasswordValid) {
        const sessionToken = await encrypt({
          id: student.id,
          role: 'STUDENT',
          academy_id: academy.id,
          tenant_slug: academy.path_url
        });
        
        const cookieStore = await cookies();
        cookieStore.set('bimbelsync_session', sessionToken, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8,
        });

        return { success: true, redirectUrl: `/${tenantSlug}/student/dashboard` };
      }
    }

    // 4. Jika keduanya gagal
    return { error: 'Email/Username atau kata sandi salah.' };

    // Kode ini sudah digantikan di blok if di atas

  } catch (error) {
    console.error("Login Error:", error);
    return { error: 'Terjadi kesalahan sistem. Coba lagi nanti.' };
  }
}
