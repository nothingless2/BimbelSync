import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeder...');

  // Buat Plan (Paket Berlangganan)
  const plan = await prisma.plan.create({
    data: {
      name: 'Premium Plan',
      price: 500000,
      max_students: 500,
      allows_payment_gateway: true,
    },
  });

  // Buat Akademi (Bimbel)
  const academy = await prisma.academy.create({
    data: {
      plan_id: plan.id,
      name: 'Bimbel Nusantara Raya',
      path_url: 'nusantara', // Ini yang membedakan URL tenant
      subscription_status: 'ACTIVE',
    },
  });

  // Buat Akun Admin
  const hashedPassword = await bcrypt.hash('nusantara123', 10);
  await prisma.staff.create({
    data: {
      academy_id: academy.id,
      email: 'admin@nusantara.com',
      password_hash: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Buat Akun Superadmin (Statis)
  const superadminPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.superadmin.upsert({
    where: { email: 'superadmin@bimbelsync.com' },
    update: {},
    create: {
      email: 'superadmin@bimbelsync.com',
      password_hash: superadminPassword,
    },
  });

  console.log('Seeder selesai! Anda sekarang bisa login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
