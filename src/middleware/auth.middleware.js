import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../services/token.service.js";
import prisma from "../config/db.js";

// Foydalanuvchi tizimga kirganligini tekshiradi (majburiy)
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Token topilmadi");
    }
    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw ApiError.unauthorized("Foydalanuvchi topilmadi");

    req.user = user;
    next();
  } catch (err) {
    next(ApiError.unauthorized("Token yaroqsiz yoki muddati o'tgan"));
  }
};

// Token bo'lsa foydalanuvchini biriktiradi, bo'lmasa xatolik bermay davom etadi
// (masalan qidiruv sahifasi login bo'lmasa ham ishlashi kerak bo'lganda)
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return next();
    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user) req.user = user;
    next();
  } catch (err) {
    next();
  }
};

// Faqat berilgan rollarga ruxsat beradi. Masalan: authorize("ADMIN")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden("Bu amal uchun ruxsatingiz yo'q"));
  }
  next();
};

export { authenticate, optionalAuth, authorize };
