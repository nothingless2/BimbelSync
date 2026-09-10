'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function loginStudentAction(tenantSlug: string, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    const student = await prisma.student.findFirst({
      where: {
        username: username,
        academy: {
          path_url: tenantSlug
        }
      },
      include: {
        academy: true
      }
    });

    if (!student) {
      const academyExists = await prisma.academy.count({
        where: { path_url: tenantSlug }
      });
      
      if (academyExists === 0) {
        return { error: 'Bimbel tidak ditemukan di sistem kami.' };
      }
      return { error: 'Username atau password salah.' };
    }
    
    const academy = student.academy;

    // Check if the student was deleted
    if (student.deleted_at) {
      return { error: 'Akun ini sudah dinonaktifkan.' };
    }

    const isPasswordValid = await bcrypt.compare(password, student.password_hash);
    
    if (!isPasswordValid) {
      return { error: 'Username atau password salah.' };
    }

    const sessionToken = await encrypt({
      id: student.id,
      role: 'STUDENT',
      academy_id: academy.id,
      tenant_slug: academy.path_url
    });

    const cookieStore = await cookies();
    cookieStore.set('bimbelsync_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 minggu untuk siswa
    });

    return { 
      success: true, 
      mustChangePassword: student.must_change_password 
    };

  } catch (error) {
    console.error("Student Login Error:", error);
    return { error: 'Terjadi kesalahan sistem. Coba lagi nanti.' };
  }
}
