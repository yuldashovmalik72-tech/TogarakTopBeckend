import env from "../config/env.js";

// Payme'ning haqiqiy protokoli: har bir webhook so'rovida
// "Authorization: Basic base64(Paycom:MERCHANT_SECRET_KEY)" header keladi.
// Bu tekshiruv bo'lmasa, istalgan kishi to'g'ridan-to'g'ri /api/payments/payme
// manziliga soxta JSON-RPC so'rov yuborib, to'lovni "muvaffaqiyatli" deb
// belgilashi mumkin edi - shuning uchun bu middleware majburiy.
function verifyPaymeAuth(req, res, next) {
  const rpcId = req.body?.id ?? null;
  const header = req.headers.authorization || "";

  if (!header.startsWith("Basic ")) {
    return res.status(200).json({
      jsonrpc: "2.0",
      id: rpcId,
      error: { code: -32504, message: "Ruxsat berilmagan (Authorization header topilmadi)" },
    });
  }

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
  const [, key] = decoded.split(":");

  if (!env.payme.secretKey || key !== env.payme.secretKey) {
    return res.status(200).json({
      jsonrpc: "2.0",
      id: rpcId,
      error: { code: -32504, message: "Ruxsat berilmagan (kalit noto'g'ri)" },
    });
  }

  next();
}

export default verifyPaymeAuth;
