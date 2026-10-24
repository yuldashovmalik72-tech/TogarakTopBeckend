const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "PathFinder/1.0 (togarak-top.vercel.app; contact: admin@velox.uz)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Nominatim mahalliy ko'cha nomlarini bilmaydi — shuning uchun
 * tuman darajasigacha soddalashtirilgan zaxira so'rovlar tuzamiz.
 */
function buildVariants(address) {
  const a = address.trim();
  const variants = [a, `${a}, O'zbekiston`];
  const parts = a.split(",").map((s) => s.trim()).filter(Boolean);
  const cleaned = parts
    .map((p) => p.replace(/\bfiliali\b/gi, "").replace(/\bko'chasi\b/gi, "").trim())
    .filter((p) => p && !/^\d/.test(p) && !/\b\d+-uy\b/i.test(p));
  const district = cleaned[0]?.toLowerCase() === "toshkent" ? cleaned[1] : cleaned[0];
  if (district) variants.push(`${district}, Toshkent, O'zbekiston`);
  return [...new Set(variants)];
}

async function geocodeOne(query) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "uz,en" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;
  const latitude = Number.parseFloat(results[0].lat);
  const longitude = Number.parseFloat(results[0].lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude };
}

/**
 * Manzilni Nominatim (OpenStreetMap) orqali koordinataga aylantiradi.
 * Xatolik yoki topilmasa null qaytaradi — create/update hech qachon fail bo'lmaydi.
 * maxAttempts: API yo'liga 2 (tezkor), backfill uchun barcha variantlar.
 */
export async function geocodeAddress(address, { maxAttempts = 2 } = {}) {
  if (!address || typeof address !== "string" || address.trim().length < 3) return null;
  const variants = buildVariants(address).slice(0, maxAttempts);
  for (let i = 0; i < variants.length; i++) {
    try {
      const geo = await geocodeOne(variants[i]);
      if (geo) return geo;
    } catch {
      // tarmoq xatosi — keyingi variantga o'tamiz
    }
    if (i < variants.length - 1) await sleep(1100); // Nominatim: 1 so'rov/sekund
  }
  return null;
}
