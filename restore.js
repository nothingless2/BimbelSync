const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const acad = await prisma.academy.findFirst({
    where: { name: { contains: 'cita' } }
  });
  
  if (acad) {
    await prisma.academy.update({
      where: { id: acad.id },
      data: { 
        plan_id: '00000000-0000-0000-0000-000000000002', // Growth plan ID
        pending_plan_id: '00000000-0000-0000-0000-000000000001', // Starter plan ID
        pending_plan_date: new Date('2026-12-22T00:00:00.000Z') // Restoring the date
      }
    });
    console.log('Restored cita-cita to Growth with pending Starter in Dec.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
