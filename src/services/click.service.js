import crypto from "crypto";
import env from "../config/env.js";
import prisma from "../config/db.js";

// Click.uz "Complete" so'rovi imzosini tekshirish
// Hujjat: https://docs.click.uz
function verifySignature({ click_trans_id, service_id, orderId, amount, action, sign_time, sign_string }) {
  const raw = `${click_trans_id}${service_id}${env.click.secretKey}${orderId}${amount}${action}${sign_time}`;
  const hash = crypto.createHash("md5").update(raw).digest("hex");
  return hash === sign_string;
}

// CLICK_ERROR kodlari
const CLICK_ERROR = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
};

// Click "Prepare" bosqichi - to'lov boshlanishidan oldin chaqiriladi
async function prepare(payload) {
  const { click_trans_id, merchant_trans_id, amount, action, sign_time, sign_string, service_id } = payload;

  const valid = verifySignature({
    click_trans_id,
    service_id,
    orderId: merchant_trans_id,
    amount,
    action,
    sign_time,
    sign_string,
  });
  if (!valid) return { error: CLICK_ERROR.SIGN_FAILED, error_note: "Imzo mos kelmadi" };

  const payment = await prisma.payment.findUnique({ where: { id: merchant_trans_id } });
  if (!payment) return { error: CLICK_ERROR.TRANSACTION_NOT_FOUND, error_note: "To'lov topilmadi" };

  return {
    click_trans_id,
    merchant_trans_id,
    merchant_prepare_id: payment.id,
    error: CLICK_ERROR.SUCCESS,
    error_note: "OK",
  };
}

// Click "Complete" bosqichi - to'lov yakunlanganda chaqiriladi
async function complete(payload) {
  const { merchant_trans_id, error } = payload;

  const payment = await prisma.payment.findUnique({ where: { id: merchant_trans_id } });
  if (!payment) return { error: CLICK_ERROR.TRANSACTION_NOT_FOUND, error_note: "To'lov topilmadi" };

  if (Number(error) < 0) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { error: CLICK_ERROR.SUCCESS, error_note: "OK" };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", providerTransactionId: String(payload.click_trans_id) },
  });

  return { error: CLICK_ERROR.SUCCESS, error_note: "OK" };
}

export { prepare, complete, CLICK_ERROR };
