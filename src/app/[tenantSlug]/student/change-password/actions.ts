'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { decrypt, encrypt } from '@/lib/auth';

export async function changePasswordAction(tenantSlug: string, formData: FormData) {
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (newPassword !== confirmPassword) {
    return { error: 'Konfirmasi password tidak cocok.' };
  }

  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('bimbelsync_session')?.value;
    
    if (!sessionToken) {
      return { error: 'Sesi tidak ditemukan. Silakan login kembali.' };
    }

    const session = await decrypt(sessionToken);
    
    if (!session || session.role !== 'STUDENT') {
      return { error: 'Sesi tidak valid.' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedStudent = await prisma.student.update({
      where: { id: session.id },
      data: {
        password_hash: hashedPassword,
        must_change_password: false
      }
    });

    // Refresh token after password change (optional, but good practice)
    const newSessionToken = await encrypt({
      id: updatedStudent.id,
      role: 'STUDENT',
      academy_id: session.academy_id,
      tenant_slug: session.tenant_slug
    });

    cookieStore.set('bimbelsync_session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true };

  } catch (error) {
    console.error("Change Password Error:", error);
    return { error: 'Terjadi kesalahan sistem. Coba lagi nanti.' };
  }
}
