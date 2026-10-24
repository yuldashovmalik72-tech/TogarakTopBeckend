import prisma from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notifyVerified } from "../services/notification.service.js";
import { uploadToCloud } from "../services/cloudUpload.service.js";

// POST /api/groups/:groupId/certificates - o'qituvchi sertifikatini yuklash
// Yangi yuklangan sertifikat har doim verified=false bilan boshlanadi -
// foydalanuvchi buni "Tasdiqlangan" deb ko'rsatishdan oldin admin tekshirib chiqishi kerak.
const uploadCertificate = asyncHandler(async (req, res) => {
  const group = await prisma.group.findUnique({ where: { id: req.params.groupId }, include: { circle: true } });
  if (!group) throw ApiError.notFound("Guruh topilmadi");
  if (group.circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Ruxsat yo'q");
  }
  if (!req.file) throw ApiError.badRequest("Sertifikat rasmi yuklanishi shart");

  const { title } = req.body;
  if (!title) throw ApiError.badRequest("Sertifikat nomi (masalan: IELTS 8.0) kiritilishi shart");

  const certificate = await prisma.certificate.create({
    data: {
      groupId: group.id,
      title,
      imageUrl: (await uploadToCloud(req.file.path, req.file.filename)).url,
      verified: false,
    },
  });

  res.status(201).json(
    new ApiResponse(201, certificate, "Sertifikat yuklandi, admin tasdiqlagach 'Tasdiqlangan' belgisi qo'yiladi")
  );
});

// DELETE /api/certificates/:id
const deleteCertificate = asyncHandler(async (req, res) => {
  const cert = await prisma.certificate.findUnique({
    where: { id: req.params.id },
    include: { group: { include: { circle: true } } },
  });
  if (!cert) throw ApiError.notFound("Sertifikat topilmadi");
  if (cert.group.circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("O'chirish huquqingiz yo'q");
  }
  await prisma.certificate.delete({ where: { id: cert.id } });
  res.json(new ApiResponse(200, null, "Sertifikat o'chirildi"));
});

// PATCH /api/certificates/:id/verify - faqat ADMIN. Sertifikat haqiqiyligini tasdiqlaydi.
const verifyCertificate = asyncHandler(async (req, res) => {
  const { verified = true } = req.body;
  const cert = await prisma.certificate.findUnique({ where: { id: req.params.id } });
  if (!cert) throw ApiError.notFound("Sertifikat topilmadi");

  const updated = await prisma.certificate.update({
    where: { id: cert.id },
    data: { verified: Boolean(verified) },
  });
  if (verified) {
    const full = await prisma.certificate.findUnique({
      where: { id: cert.id },
      include: { group: { include: { circle: true } } },
    });
    if (full?.group?.circle?.ownerId) {
      notifyVerified(full.group.circle.ownerId, "certificate", full.title, full.id).catch(() => {});
    }
  }
  res.json(new ApiResponse(200, updated, verified ? "Sertifikat tasdiqlandi" : "Tasdiq bekor qilindi"));
});

// GET /api/certificates/pending - faqat ADMIN. Tasdiqlanmagan sertifikatlar ro'yxati.
const listPendingCertificates = asyncHandler(async (req, res) => {
  const certs = await prisma.certificate.findMany({
    where: { verified: false },
    include: { group: { include: { circle: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(new ApiResponse(200, certs));
});

export { uploadCertificate, deleteCertificate, verifyCertificate, listPendingCertificates };
