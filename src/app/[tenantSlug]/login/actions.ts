'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function loginStaffAction(tenantSlug: string, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // 1 & 2. Cari Staff dan Bimbel secara bersamaan
    const staff = await prisma.staff.findFirst({
      where: {
        email: email,
        academy: {
          path_url: tenantSlug
        }
      },
      include: {
        academy: true
      }
    });

    if (!staff) {
      // Cek apakah bimbelnya yang tidak ada atau emailnya yang salah
      const academyExists = await prisma.academy.count({
        where: { path_url: tenantSlug }
      });
      
      if (academyExists === 0) {
        return { error: 'Bimbel tidak ditemukan di sistem kami.' };
      }
      return { error: 'Email atau kata sandi salah.' };
    }
    
    const academy = staff.academy;

    // 3. Cocokkan kata sandi
    const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
    
    if (!isPasswordValid) {
      return { error: 'Email atau kata sandi salah.' };
    }

    // 4. Jika sukses, buat Tiket Sesi (JWT)
    const sessionToken = await encrypt({
      id: staff.id,
      role: staff.role, // Bawaan DB (ADMIN atau TUTOR)
      academy_id: academy.id,
      tenant_slug: academy.path_url
    });

    // 5. Simpan JWT ke dalam HttpOnly Cookie agar aman dari pencurian
    const cookieStore = await cookies();
    cookieStore.set('bimbelsync_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 Jam
    });

    return { success: true };

  } catch (error) {
    console.error("Login Error:", error);
    return { error: 'Terjadi kesalahan sistem. Coba lagi nanti.' };
  }
}
