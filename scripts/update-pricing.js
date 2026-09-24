const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany();
  
  for (const plan of plans) {
    const name = plan.name.toLowerCase();
    let newPrice = plan.price;
    
    if (name.includes('starter')) {
      newPrice = 149000;
    } else if (name.includes('growth')) {
      newPrice = 349000;
    } else if (name.includes('pro') || name.includes('premium')) {
      newPrice = 899000;
    }

    if (newPrice !== plan.price) {
      await prisma.plan.update({
        where: { id: plan.id },
        data: { price: newPrice }
      });
      console.log(`Updated ${plan.name} price to Rp ${newPrice}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
