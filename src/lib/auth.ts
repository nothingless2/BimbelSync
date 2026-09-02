import { jwtVerify, SignJWT } from 'jose';

// Secret key ini WAJIB ada di .env (Poin 3 Security)
const secretKeyString = process.env.JWT_SECRET;
if (!secretKeyString) {
  throw new Error("CRITICAL: JWT_SECRET belum diatur di file .env!");
}
const SECRET_KEY = new TextEncoder().encode(secretKeyString);

// Tipe data sesi yang akan disimpan di Cookie pengguna
export type SessionPayload = {
  id: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'TUTOR' | 'STUDENT';
  academy_id?: string;
  tenant_slug?: string;
};

// Fungsi untuk membuat Token/Sesi (Saat Login)
export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
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
