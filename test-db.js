import pg from "pg";
import "dotenv/config";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 8000,
});

console.log("Ulanishga urinilmoqda...");

const timeout = setTimeout(() => {
  console.error("❌ 10 soniyada javob kelmadi - timeout");
  process.exit(1);
}, 10000);

try {
  await client.connect();
  clearTimeout(timeout);
  console.log("✅ Muvaffaqiyatli ulandi!");
  const res = await client.query("SELECT NOW()");
  console.log("Server vaqti:", res.rows[0]);
  await client.end();
  process.exit(0);
} catch (err) {
  clearTimeout(timeout);
  console.error("❌ XATOLIK:", err.message);
  console.error("To'liq:", err);
  process.exit(1);
}