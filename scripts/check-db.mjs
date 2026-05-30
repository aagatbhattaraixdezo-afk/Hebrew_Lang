import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(JSON.stringify(users, null, 2));
} catch (e) {
  console.error("DB_ERROR:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
