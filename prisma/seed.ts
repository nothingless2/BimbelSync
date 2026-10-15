import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeder...');

  // 1. Buat 3 Paket (Plans) Utama
  const starterPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      price: 99000,
      max_students: 50,
      max_staff: 3,
      max_rooms: 2,
      allows_installment: false,
      allows_automated_email: false,
      allows_qr_attendance: false,
      allows_erapor: false,
      allows_audit_trail: false,
      additional_features: [
        "Jadwal Kelas & Kalender",
        "Portal Siswa & Wali Murid",
        "Cetak Rekap Laporan PDF"
      ]
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Starter',
      price: 99000,
      max_students: 50,
      max_staff: 3,
      max_rooms: 2,
      allows_installment: false,
      allows_automated_email: false,
      allows_qr_attendance: false,
      allows_erapor: false,
      allows_audit_trail: false,
      additional_features: [
        "Jadwal Kelas & Kalender",
        "Portal Siswa & Wali Murid",
        "Cetak Rekap Laporan PDF"
      ]
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      price: 199000,
      max_students: 200,
      max_staff: 10,
      max_rooms: 6,
      allows_installment: false,
      allows_automated_email: true,
      allows_qr_attendance: true,
      allows_erapor: true,
      allows_audit_trail: false,
      additional_features: [
        "Jadwal Kelas & Kalender",
        "Portal Siswa & Wali Murid",
        "Cetak Rekap Laporan PDF"
      ]
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Growth',
      price: 199000,
      max_students: 200,
      max_staff: 10,
      max_rooms: 6,
      allows_installment: false,
      allows_automated_email: true,
      allows_qr_attendance: true,
      allows_erapor: true,
      allows_audit_trail: false,
      additional_features: [
        "Jadwal Kelas & Kalender",
        "Portal Siswa & Wali Murid",
        "Cetak Rekap Laporan PDF"
      ]
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {
      price: 399000,
      max_students: 500,
      max_staff: 25,
      max_rooms: 15,
      allows_installment: true,
      allows_automated_email: true,
      allows_qr_attendance: true,
      allows_erapor: true,
      allows_audit_trail: true,
      additional_features: [
        "Jadwal Kelas & Kalender",
        "Portal Siswa & Wali Murid",
        "Cetak Rekap Laporan PDF",
        "Prioritas Dukungan Teknis"
      ]
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Pro',
      price: 399000,
      max_students: 500,
      max_staff: 25,
      max_rooms: 15,
      allows_installment: true,
      allows_automated_email: true,
      allows_qr_attendance: true,
      allows_erapor: true,
      allows_audit_trail: true,
      additional_features: [
        "Jadwal Kelas & Kalender",
        "Portal Siswa & Wali Murid",
        "Cetak Rekap Laporan PDF",
        "Prioritas Dukungan Teknis"
      ]
    },
  });

  // 2. Buat Akademi (Bimbel) - gunakan Growth Plan
  const academy = await prisma.academy.upsert({
    where: { path_url: 'nusantara' },
    update: { plan_id: growthPlan.id },
    create: {
      plan_id: growthPlan.id,
      name: 'Bimbel Nusantara Raya',
      path_url: 'nusantara',
      subscription_status: 'ACTIVE',
    },
  });

  // 3. Buat Akun Admin
  const hashedPassword = await bcrypt.hash('nusantara123', 10);
  await prisma.staff.upsert({
    where: {
      academy_id_email: {
        academy_id: academy.id,
        email: 'admin@nusantara.com',
      },
    },
    update: {},
    create: {
      academy_id: academy.id,
      email: 'admin@nusantara.com',
      password_hash: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 4. Buat Akun Superadmin — selalu update password agar selalu sinkron
  const superadminPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.superadmin.upsert({
    where: { email: 'superadmin@bimbelsync.com' },
    update: {
      password_hash: superadminPassword,
    },
    create: {
      email: 'superadmin@bimbelsync.com',
      password_hash: superadminPassword,
    },
  });

  console.log('Seed berhasil ditambahkan!');

}

main()
  .catch((e) => {
    console.error(' Seeder gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
