import prisma from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notifyVerified } from "../services/notification.service.js";
import { uploadToCloud } from "../services/cloudUpload.service.js";

// POST /api/circles/:circleId/results
// Yangi natija har doim verified=false bilan boshlanadi.
const addResult = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findUnique({ where: { id: req.params.circleId } });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  if (circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu togarakka natija qo'sha olmaysiz");
  }
  if (!req.file) throw ApiError.badRequest("Natija rasmi yuklanishi shart");

  const { title, type, studentName } = req.body;
  const result = await prisma.result.create({
    data: {
      circleId: circle.id,
      title,
      type,
      studentName,
      imageUrl: (await uploadToCloud(req.file.path, req.file.filename)).url,
      verified: false,
    },
  });

  res.status(201).json(new ApiResponse(201, result, "Natija qo'shildi, admin tasdiqlagach barchaga ko'rinadi"));
});

// DELETE /api/results/:id
const deleteResult = asyncHandler(async (req, res) => {
  const result = await prisma.result.findUnique({
    where: { id: req.params.id },
    include: { circle: true },
  });
  if (!result) throw ApiError.notFound("Natija topilmadi");
  if (result.circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("O'chirish huquqingiz yo'q");
  }
  await prisma.result.delete({ where: { id: req.params.id } });
  res.json(new ApiResponse(200, null, "Natija o'chirildi"));
});

// PATCH /api/results/:id/verify - faqat ADMIN
const verifyResult = asyncHandler(async (req, res) => {
  const { verified = true } = req.body;
  const result = await prisma.result.findUnique({ where: { id: req.params.id } });
  if (!result) throw ApiError.notFound("Natija topilmadi");

  const updated = await prisma.result.update({
    where: { id: result.id },
    data: { verified: Boolean(verified) },
  });
  if (verified) {
    const full = await prisma.result.findUnique({
      where: { id: result.id },
      include: { circle: true },
    });
    if (full?.circle?.ownerId) {
      notifyVerified(full.circle.ownerId, "result", full.title, full.id).catch(() => {});
    }
  }
  res.json(new ApiResponse(200, updated, verified ? "Natija tasdiqlandi" : "Tasdiq bekor qilindi"));
});

// GET /api/results/pending - faqat ADMIN
const listPendingResults = asyncHandler(async (req, res) => {
  const results = await prisma.result.findMany({
    where: { verified: false },
    include: { circle: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(new ApiResponse(200, results));
});

export { addResult, deleteResult, verifyResult, listPendingResults };
