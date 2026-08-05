import prisma from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// GET /api/notifications
const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const where = { userId: req.user.id };
  if (unreadOnly === "true") where.isRead = false;

  const take = Math.min(Number(limit) || 20, 50);
  const skip = (Number(page) - 1) * take;

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);

  res.json(
    new ApiResponse(200, {
      items,
      unreadCount,
      pagination: { page: Number(page), limit: take, total, pages: Math.ceil(total / take) || 1 },
    })
  );
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n || n.userId !== req.user.id) throw ApiError.notFound("Bildirishnoma topilmadi");
  const updated = await prisma.notification.update({
    where: { id: n.id },
    data: { isRead: true },
  });
  res.json(new ApiResponse(200, updated));
});

// POST /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json(new ApiResponse(200, null, "Barcha bildirishnomalar o'qildi"));
});

// DELETE /api/notifications/:id
const remove = asyncHandler(async (req, res) => {
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n || n.userId !== req.user.id) throw ApiError.notFound("Bildirishnoma topilmadi");
  await prisma.notification.delete({ where: { id: n.id } });
  res.json(new ApiResponse(200, null, "O'chirildi"));
});

export { list, markRead, markAllRead, remove };
