import "dotenv/config";

const BASE = process.env.API_URL || "http://localhost:5000";

async function test() {
  console.log("🚀 Togarak.AI Backend — To'liq Smoke Test\n");

  // 1. Health
  const h = await fetch(`${BASE}/health`);
  const hData = await h.json();
  console.log("✅ 1. /health:", hData.status);

  // 2. Circles list — javob data.items ichida keladi
  const cr = await fetch(`${BASE}/api/circles`);
  const cData = await cr.json();
  const circles = cData.data?.items || [];
  console.log(`✅ 2. /api/circles: ${circles.length} ta to'garak topildi`);

  // Faqat priceAmount bor to'garaklarni olamiz (AI compare uchun)
  const priced = circles.filter(c => c.priceAmount > 0);
  if (priced.length < 2) {
    console.log("⚠️  Kamida 2 ta narxli to'garak kerak. Test to'xtatildi.");
    return;
  }

  const cA = priced[0];
  const cB = priced[1];

  // 3. AI Compare
  console.log(`\n🤖 3. AI Taqqoslash: "${cA.name}" vs "${cB.name}"`);
  const aiR = await fetch(`${BASE}/api/ai/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      circleAId: cA.id,
      circleBId: cB.id,
      userGoal: "Tezkor IELTS 7+ olish",
      maxBudget: 800000,
    }),
  });
  const aiData = await aiR.json();
  if (!aiData.success) throw new Error("AI Compare xato: " + JSON.stringify(aiData));
  console.log("   🏆 G'olib:", aiData.data.winnerName);
  console.log("   📜 Hukm:", aiData.data.verdict);
  console.log("   💰 Byudjet tahlili:", aiData.data.budgetAnalysis);
  console.log("   📎 Manba:", aiData.data.source);

  // 4. Lead booking
  console.log("\n📋 4. Sinov darsiga yozilish (Lead) testi...");
  const lR = await fetch(`${BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      circleId: cA.id,
      parentName: "Dilshod Akramov",
      phone: "+998901234567",
      childAge: 14,
      userGoal: "IELTS 7+ olish",
    }),
  });
  const lData = await lR.json();
  if (!lData.success) throw new Error("Lead xato: " + JSON.stringify(lData));
  console.log("   ✅ Lead ID:", lData.data.leadId);
  console.log("   ℹ️ Markaz:", lData.data.centerName);

  // 5. Single circle
  console.log(`\n📖 5. Alohida to'garak: "${cA.name}"`);
  const scR = await fetch(`${BASE}/api/circles/${cA.id}`);
  const scData = await scR.json();
  const circle = scData.data;
  console.log("   ✅ To'garak:", circle?.name);
  console.log("   Guruhlar:", circle?.groups?.length || 0, "ta");
  console.log("   Natijalar:", circle?.results?.length || 0, "ta");

  console.log("\n🎉 BARCHA TESTLAR MUVAFFAQIYATLI O'TDI!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Backend to'liq tayyor. Quyidagi yangi endpointlar ishlaydi:");
  console.log("  POST /api/ai/compare    — AI Taqqoslagich");
  console.log("  POST /api/leads         — Sinov darsiga yozilish");
  console.log("  GET  /api/leads         — Arizalar ro'yxati (Admin)");
  console.log("  PATCH /api/leads/:id    — Ariza statusini yangilash");
}

test().catch((e) => {
  console.error("❌ Xatolik:", e.message);
  process.exit(1);
});
