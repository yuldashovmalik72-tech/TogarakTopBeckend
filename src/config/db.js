import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import env from "./env.js";

// 1. pg Pool (ulanishlar hovuzi) obyekti yaratiladi
const pool = new pg.Pool({
  connectionString: env.databaseUrl,
});

// 2. Prisma uchun Pg adapteri beriladi
const adapter = new PrismaPg(pool);

// 3. Singleton pattern (ishlab chiqish jarayonida ko'p ulanishlar ochilib ketmasligi uchun)
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;