// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ANON_USER_EMAIL = "guest@local";
const ANON_USER_NAME = "Guest";
const DEFAULT_PASSWORD = "guest"; // only for local dev seeding

async function main() {
  // ensure anon/guest user exists
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: ANON_USER_EMAIL },
    update: {},
    create: {
      email: ANON_USER_EMAIL,
      name: ANON_USER_NAME,
      passwordHash: hashed,
      role: Role.USER,
    },
  });

  // you can seed a sample provider/request if you want:
  // const provider = await prisma.provider.upsert({
  //   where: { email: "demo-provider@example.com" },
  //   update: {},
  //   create: { name: "Demo Provider", email: "demo-provider@example.com", city: "Sydney" },
  // });
  // const user = await prisma.user.findUnique({ where: { email: ANON_USER_EMAIL } });
  // if (user) {
  //   await prisma.jobRequest.create({
  //     data: {
  //       userId: user.id,
  //       category: "Plumber",
  //       description: "Leaking tap",
  //       location: "Parramatta NSW",
  //     },
  //   });
  // }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
