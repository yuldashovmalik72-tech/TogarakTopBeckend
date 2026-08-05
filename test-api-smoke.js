/**
 * Oddiy smoke-test: server ishlayotgan bo'lsa /health tekshiradi.
 * Ishga tushirish: node test-api-smoke.js
 * (Avval: npm run dev)
 */
const BASE = process.env.API_URL || "http://localhost:5000";

async function main() {
  const res = await fetch(`${BASE}/health`);
  const data = await res.json();
  if (data.status !== "OK") throw new Error("Health failed: " + JSON.stringify(data));
  console.log("✅ /health OK", data);

  const circles = await fetch(`${BASE}/api/circles?limit=1`);
  const c = await circles.json();
  if (!c.success && circles.status >= 500) throw new Error("Circles failed");
  console.log("✅ /api/circles javob berdi, status:", circles.status);
  console.log("Smoke test o'tdi.");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
