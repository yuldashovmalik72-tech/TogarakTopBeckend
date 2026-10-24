import prisma from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadToCloud } from "../services/cloudUpload.service.js";

const getById = asyncHandler(async (req, res) => {
  const center = await prisma.courseCenter.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      circles: {
        where: { status: "ACTIVE", deletedAt: null },
        select: {
          id: true, name: true, direction: true, images: true,
          priceType: true, priceAmount: true, currency: true, pricePeriod: true, viewCount: true,
          groups: { select: { teacherName: true, maxStudents: true, takenStudents: true, status: true } },
        },
      },
    },
  });
  if (!center) throw ApiError.notFound("O'quv markazi topilmadi");
  res.json(new ApiResponse(200, center));
});

const create = asyncHandler(async (req, res) => {
  const { name, description, address, latitude, longitude, contactPhone, contactTelegram } = req.body;
  if (!name) throw ApiError.badRequest("O'quv markazi nomi kiritilishi shart");
  const images = await Promise.all(
    (req.files || []).map(async (f) => (await uploadToCloud(f.path, f.filename)).url)
  );
  if (images.length > 2) throw ApiError.badRequest("Maksimum 2 ta rasm yuklash mumkin");
  const center = await prisma.courseCenter.create({
    data: {
      name, description, address,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      contactPhone, contactTelegram, images, ownerId: req.user.id,
    },
  });
  res.status(201).json(new ApiResponse(201, center, "O'quv markazi yaratildi"));
});

const update = asyncHandler(async (req, res) => {
  const center = await prisma.courseCenter.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!center) throw ApiError.notFound("O'quv markazi topilmadi");
  if (center.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu markazni tahrirlash huquqingiz yo'q");
  }
  const allowed = ["name", "description", "address", "latitude", "longitude", "contactPhone", "contactTelegram"];
  const data = {};
  for (const f of allowed) if (req.body[f] !== undefined) data[f] = req.body[f];
  if (data.latitude !== undefined) data.latitude = data.latitude ? Number(data.latitude) : null;
  if (data.longitude !== undefined) data.longitude = data.longitude ? Number(data.longitude) : null;

  let images = [...(center.images || [])];
  let removeList = req.body.removeImages;
  if (typeof removeList === "string") {
    try { removeList = JSON.parse(removeList); } catch { removeList = [removeList]; }
  }
  if (Array.isArray(removeList) && removeList.length) {
    images = images.filter((url) => !removeList.includes(url));
  }
  const newFiles = await Promise.all(
    (req.files || []).map(async (f) => (await uploadToCloud(f.path, f.filename)).url)
  );
  images = [...images, ...newFiles];
  if (images.length > 2) throw ApiError.badRequest("Maksimum 2 ta rasm bo'lishi mumkin");
  if (newFiles.length || (Array.isArray(removeList) && removeList.length)) data.images = images;

  const updated = await prisma.courseCenter.update({ where: { id: req.params.id }, data });
  res.json(new ApiResponse(200, updated, "Yangilandi"));
});

const mine = asyncHandler(async (req, res) => {
  const includeDeleted = req.query.includeDeleted === "true";
  const centers = await prisma.courseCenter.findMany({
    where: { ownerId: req.user.id, ...(includeDeleted ? {} : { deletedAt: null }) },
    include: { circles: { where: { deletedAt: null }, select: { id: true, name: true, direction: true } } },
  });
  res.json(new ApiResponse(200, centers));
});

const uploadTourVideo = asyncHandler(async (req, res) => {
  const center = await prisma.courseCenter.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!center) throw ApiError.notFound("O'quv markazi topilmadi");
  if (center.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu markazga video yuklash huquqingiz yo'q");
  }
  // Startup: video-tur bepul
  if (!req.file) throw ApiError.badRequest("Video fayl yuborilmadi");
  const updated = await prisma.courseCenter.update({
    where: { id: center.id },
    data: { tourVideoUrl: `/uploads/videos/${req.file.filename}` },
  });
  res.json(new ApiResponse(200, updated, "Video muvaffaqiyatli yuklandi"));
});

const remove = asyncHandler(async (req, res) => {
  const center = await prisma.courseCenter.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!center) throw ApiError.notFound("O'quv markazi topilmadi");
  if (center.ownerId !== req.user.id && req.user.role !== "ADMIN") throw ApiError.forbidden("O'chirish huquqingiz yo'q");
  await prisma.$transaction([
    prisma.circle.updateMany({
      where: { courseCenterId: center.id, deletedAt: null },
      data: { status: "ARCHIVED", deletedAt: new Date() },
    }),
    prisma.courseCenter.update({ where: { id: center.id }, data: { deletedAt: new Date() } }),
  ]);
  res.json(new ApiResponse(200, null, "O'quv markazi va yo'nalishlari arxivlandi"));
});

const restore = asyncHandler(async (req, res) => {
  const center = await prisma.courseCenter.findUnique({ where: { id: req.params.id } });
  if (!center || !center.deletedAt) throw ApiError.notFound("Arxivlangan markaz topilmadi");
  if (center.ownerId !== req.user.id && req.user.role !== "ADMIN") throw ApiError.forbidden();
  const updated = await prisma.courseCenter.update({ where: { id: center.id }, data: { deletedAt: null } });
  res.json(new ApiResponse(200, updated, "Markaz qayta tiklandi"));
});

export { getById, create, update, mine, uploadTourVideo, remove, restore };
