const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.updateMany({
    where: {
      name: {
        contains: 'Premium',
        mode: 'insensitive'
      }
    },
    data: {
      allows_installment: true
    }
  });
  console.log(`Updated ${plans.count} Premium plan(s) to allow installments.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
