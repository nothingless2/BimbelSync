import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeder...');

  // 1. Buat Plan (Paket Berlangganan) — cek dulu sebelum buat
  let plan = await prisma.plan.findFirst({ where: { name: 'Premium Plan' } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'Premium Plan',
        price: 500000,
        max_students: 500,
        allows_payment_gateway: true,
      },
    });
  }

  // 2. Buat Akademi (Bimbel) — aman dijalankan ulang
  const academy = await prisma.academy.upsert({
    where: { path_url: 'nusantara' },
    update: {},
    create: {
      plan_id: plan.id,
      name: 'Bimbel Nusantara Raya',
      path_url: 'nusantara',
      subscription_status: 'ACTIVE',
    },
  });

  // 3. Buat Akun Admin — aman dijalankan ulang
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
  const superadmin = await prisma.superadmin.upsert({
    where: { email: 'superadmin@bimbelsync.com' },
    update: {
      password_hash: superadminPassword, // selalu perbarui agar pasti cocok
    },
    create: {
      email: 'superadmin@bimbelsync.com',
      password_hash: superadminPassword,
    },
  });
  console.log(' Seeder selesai!');

}

main()
  .catch((e) => {
    console.error(' Seeder gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
