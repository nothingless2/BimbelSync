import { jwtVerify, SignJWT } from 'jose';

// Secret key ini nantinya sebaiknya ditaruh di .env
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bimbelsync-super-secret-key-2024'
);

// Tipe data sesi yang akan disimpan di Cookie pengguna
export type SessionPayload = {
  id: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'TUTOR' | 'STUDENT';
  academy_id?: string;
};

// Fungsi untuk membuat Token/Sesi (Saat Login)
export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

// Fungsi untuk membaca Token/Sesi
export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as SessionPayload;
  } catch (error) {
    return null; // Jika token tidak valid / kadaluarsa
  }
}
