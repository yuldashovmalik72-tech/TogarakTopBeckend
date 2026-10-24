/**
 * Bir martalik backfill: manzili bor, lekin koordinatasi yo'q to'garaklarni
 * Nominatim orqali geokodlab bazaga yozadi. Nominatim tezlik cheklovi uchun
 * har bir so'rov orasida 1.2 soniya kutadi.
 * Ishga tushirish: node geocode-backfill.js
 */
import prisma from "./src/config/db.js";
import { geocodeAddress } from "./src/services/geocode.service.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const circles = await prisma.circle.findMany({
    where: { deletedAt: null, address: { not: null }, latitude: null },
    select: { id: true, name: true, address: true },
  });

  console.log(`${circles.length} ta koordinatasiz to'garak topildi`);
  let ok = 0;
  let fail = 0;

  for (const c of circles) {
    const geo = await geocodeAddress(c.address, { maxAttempts: 5 });
    if (geo) {
      await prisma.circle.update({ where: { id: c.id }, data: geo });
      ok++;
      console.log(`  ✓ "${c.name}" → ${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)} (${c.address})`);
    } else {
      fail++;
      console.log(`  ✗ "${c.name}" — manzil topilmadi (${c.address})`);
    }
    await sleep(1200);
  }

  console.log(`\nTugadi: ${ok} muvaffaqiyatli, ${fail} topilmadi`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
