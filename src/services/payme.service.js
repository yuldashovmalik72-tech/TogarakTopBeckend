import prisma from "../config/db.js";

// Payme JSON-RPC xatolik kodlari (Payme rasmiy hujjatiga mos)
const PAYME_ERROR = {
  INVALID_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  UNABLE_TO_PERFORM: -31008,
  TRANSACTION_ALREADY_EXISTS: -31051,
};

// Payme tiyin (=1/100 so'm) hisobida ishlaydi, bizda amount so'mda saqlanadi
function toTiyin(sumAmount) {
  return Math.round(sumAmount * 100);
}

async function checkPerformTransaction({ amount, account }) {
  const payment = await prisma.payment.findUnique({ where: { id: account.payment_id } });
  if (!payment) {
    return { error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: "To'lov topilmadi" } };
  }
  if (toTiyin(payment.amount) !== amount) {
    return { error: { code: PAYME_ERROR.INVALID_AMOUNT, message: "Summa mos kelmadi" } };
  }
  if (payment.status === "SUCCESS") {
    return { error: { code: PAYME_ERROR.UNABLE_TO_PERFORM, message: "To'lov allaqachon amalga oshirilgan" } };
  }
  return { result: { allow: true } };
}

async function createTransaction({ id, time, amount, account }) {
  const payment = await prisma.payment.findUnique({ where: { id: account.payment_id } });
  if (!payment) {
    return { error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: "To'lov topilmadi" } };
  }

  // Boshqa Payme tranzaksiyasi bilan allaqachon bog'langan bo'lsa - xatolik
  if (payment.providerTransactionId && payment.providerTransactionId !== id) {
    return { error: { code: PAYME_ERROR.TRANSACTION_ALREADY_EXISTS, message: "Boshqa tranzaksiya allaqachon mavjud" } };
  }

  if (toTiyin(payment.amount) !== amount) {
    return { error: { code: PAYME_ERROR.INVALID_AMOUNT, message: "Summa mos kelmadi" } };
  }

  if (!payment.providerTransactionId) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerTransactionId: id, status: "PENDING" },
    });
  }

  return {
    result: {
      create_time: time,
      transaction: payment.id,
      state: 1,
    },
  };
}

async function performTransaction({ id }) {
  const payment = await prisma.payment.findFirst({ where: { providerTransactionId: id } });
  if (!payment) {
    return { error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: "Tranzaksiya topilmadi" } };
  }

  if (payment.status === "SUCCESS") {
    return {
      result: { transaction: payment.id, perform_time: payment.updatedAt.getTime(), state: 2 },
    };
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS" },
  });

  return {
    result: {
      transaction: updated.id,
      perform_time: updated.updatedAt.getTime(),
      state: 2,
    },
  };
}

async function cancelTransaction({ id, reason }) {
  const payment = await prisma.payment.findFirst({ where: { providerTransactionId: id } });
  if (!payment) {
    return { error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: "Tranzaksiya topilmadi" } };
  }

  // Agar to'lov allaqachon SUCCESS bo'lsa - state -2 (perform'dan keyin bekor qilindi),
  // aks holda state -1 (perform'dan oldin bekor qilindi)
  const wasPerformed = payment.status === "SUCCESS";

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "CANCELLED", metadata: { cancelReason: reason ?? null } },
  });

  return {
    result: {
      transaction: payment.id,
      cancel_time: Date.now(),
      state: wasPerformed ? -2 : -1,
    },
  };
}

async function checkTransaction({ id }) {
  const payment = await prisma.payment.findFirst({ where: { providerTransactionId: id } });
  if (!payment) {
    return { error: { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: "Tranzaksiya topilmadi" } };
  }

  const stateMap = { PENDING: 1, SUCCESS: 2, CANCELLED: -1, FAILED: -1 };

  return {
    result: {
      create_time: payment.createdAt.getTime(),
      perform_time: payment.status === "SUCCESS" ? payment.updatedAt.getTime() : 0,
      cancel_time: payment.status === "CANCELLED" ? payment.updatedAt.getTime() : 0,
      transaction: payment.id,
      state: stateMap[payment.status] ?? 1,
      reason: null,
    },
  };
}

export {
  PAYME_ERROR,
  checkPerformTransaction,
  createTransaction,
  performTransaction,
  cancelTransaction,
  checkTransaction,
};
