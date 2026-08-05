import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import prisma from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "../services/token.service.js";
import { verifyGoogleToken } from "../services/googleAuth.service.js";
import { sendEmail, verificationEmailHtml } from "../services/email.service.js";
import env from "../config/env.js";

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function sanitizeUser(user) {
  const { password, googleId, ...rest } = user;
  return rest;
}

async function createAndSendVerification(user) {
  const token = uuidv4() + uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt },
  });
  const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Emailni tasdiqlash — Togarak",
    html: verificationEmailHtml(user.firstName, verifyUrl),
    text: `Emailni tasdiqlash: ${verifyUrl}`,
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "EMAIL_VERIFY",
      title: "Emailni tasdiqlang",
      message: "Hisobingizni to'liq faollashtirish uchun emailingizni tasdiqlang.",
      link: "/verify-email",
    },
  });
}

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, age, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("Bu email allaqachon ro'yxatdan o'tgan");

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      firstName, lastName,
      age: age ? Number(age) : null,
      email, password: hashed, isVerified: false,
    },
  });

  createAndSendVerification(user).catch(() => {});

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

  res.status(201).json(
    new ApiResponse(201, { user: sanitizeUser(user), accessToken },
      "Ro'yxatdan o'tdingiz. Emailingizga tasdiqlash havolasi yuborildi")
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw ApiError.unauthorized("Email yoki parol noto'g'ri");
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw ApiError.unauthorized("Email yoki parol noto'g'ri");

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json(new ApiResponse(200, { user: sanitizeUser(user), accessToken }, "Xush kelibsiz"));
});

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw ApiError.badRequest("idToken talab qilinadi");
  const googleData = await verifyGoogleToken(idToken);
  let user = await prisma.user.findUnique({ where: { email: googleData.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        email: googleData.email,
        googleId: googleData.googleId,
        avatarUrl: googleData.avatarUrl,
        isVerified: true,
      },
    });
  } else {
    const data = {};
    if (!user.googleId) data.googleId = googleData.googleId;
    if (!user.isVerified) data.isVerified = true;
    if (Object.keys(data).length) {
      user = await prisma.user.update({ where: { id: user.id }, data });
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json(new ApiResponse(200, { user: sanitizeUser(user), accessToken }, "Google orqali kirdingiz"));
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("Refresh token topilmadi");
  const record = await verifyRefreshToken(token);
  if (!record) throw ApiError.unauthorized("Refresh token yaroqsiz");
  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) throw ApiError.unauthorized("Foydalanuvchi topilmadi");
  const accessToken = generateAccessToken(user);
  res.json(new ApiResponse(200, { accessToken }, "Token yangilandi"));
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeRefreshToken(token);
  res.clearCookie(REFRESH_COOKIE);
  res.json(new ApiResponse(200, null, "Tizimdan chiqdingiz"));
});

const getMe = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, sanitizeUser(req.user)));
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ["firstName", "lastName", "age", "avatarUrl"];
  const data = {};
  for (const f of allowed) {
    if (req.body[f] !== undefined) data[f] = req.body[f];
  }
  if (data.age !== undefined) data.age = data.age === null || data.age === "" ? null : Number(data.age);
  if (Object.keys(data).length === 0) throw ApiError.badRequest("Yangilanadigan maydon yuborilmadi");
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json(new ApiResponse(200, sanitizeUser(user), "Profil yangilandi"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.password) {
    throw ApiError.badRequest("Google orqali kirgan hisobda parol o'zgartirib bo'lmaydi");
  }
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw ApiError.unauthorized("Joriy parol noto'g'ri");
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  res.clearCookie(REFRESH_COOKIE);
  res.json(new ApiResponse(200, null, "Parol o'zgartirildi. Qayta kiring"));
});

const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isVerified) throw ApiError.badRequest("Email allaqachon tasdiqlangan");
  await createAndSendVerification(req.user);
  res.json(new ApiResponse(200, null, "Tasdiqlash havolasi qayta yuborildi"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest("Token talab qilinadi");
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    throw ApiError.badRequest("Token yaroqsiz yoki muddati o'tgan");
  }
  await prisma.user.update({ where: { id: record.userId }, data: { isVerified: true } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
  res.json(new ApiResponse(200, null, "Email muvaffaqiyatli tasdiqlandi"));
});

const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["USER", "CREATOR", "ADMIN"].includes(role)) {
    throw ApiError.badRequest("Rol USER, CREATOR yoki ADMIN bo'lishi kerak");
  }
  if (req.params.id === req.user.id && role !== "ADMIN") {
    throw ApiError.badRequest("O'zingizning ADMIN rolini olib tashlab bo'lmaydi");
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw ApiError.notFound("Foydalanuvchi topilmadi");
  const updated = await prisma.user.update({ where: { id: target.id }, data: { role } });
  res.json(new ApiResponse(200, sanitizeUser(updated), `Rol ${role} ga o'zgartirildi`));
});

const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query: q } = req.query;
  const where = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, isVerified: true, createdAt: true,
      },
      skip, take: Number(limit), orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);
  res.json(new ApiResponse(200, {
    items,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  }));
});

export {
  register, login, googleLogin, refresh, logout, getMe,
  updateMe, changePassword, resendVerification, verifyEmail,
  changeUserRole, listUsers,
};
