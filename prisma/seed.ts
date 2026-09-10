import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeder...');

  // 1. Buat 3 Paket (Plans) Utama
  const starterPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Starter',
      price: 150000,
      max_students: 50,
      max_staff: 3,
      max_rooms: 3,
      allows_payment_gateway: false,
      allows_installment: false,
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Growth',
      price: 300000,
      max_students: 200,
      max_staff: 10,
      max_rooms: 10,
      allows_payment_gateway: true,
      allows_installment: false,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Pro',
      price: 500000,
      max_students: null, // Unlimited
      max_staff: null,    // Unlimited
      max_rooms: null,    // Unlimited
      allows_payment_gateway: true,
      allows_installment: true,
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
