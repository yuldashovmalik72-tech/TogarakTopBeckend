import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import env from "../config/env.js";
import prisma from "../config/db.js";

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

// Refresh tokenni bazaga saqlaymiz - shu orqali istalgan vaqtda
// foydalanuvchini "logout everywhere" qilish imkoni bo'ladi.
async function generateRefreshToken(userId) {
  const token = uuidv4() + uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

async function verifyRefreshToken(token) {
  const record = await prisma.refreshToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } }).catch(() => {});
    return null;
  }
  return record;
}

async function revokeRefreshToken(token) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
};
