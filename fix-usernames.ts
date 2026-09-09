import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deletedStudents = await prisma.student.findMany({
    where: {
      deleted_at: { not: null },
      username: { not: { contains: '_del_' } }
    }
  });

  console.log(`Found ${deletedStudents.length} deleted students with stuck usernames.`);

  for (const student of deletedStudents) {
    await prisma.student.update({
      where: { id: student.id },
      data: {
        username: `${student.username}_del_${Date.now()}`
      }
    });
    console.log(`Updated username for ${student.username}`);
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
