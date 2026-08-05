import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7'da CLI (migrate, generate, studio) endi .env faylini o'zi
// avtomatik o'qimaydi - shuning uchun yuqorida "dotenv/config" qo'lda
// chaqirilgan. DATABASE_URL endi schema.prisma'da emas, shu yerda beriladi.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
