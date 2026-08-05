import prisma from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

async function assertCircleOwnership(circleId, user) {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: { _count: { select: { groups: true } } },
  });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  if (circle.ownerId !== user.id && user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu togarakka guruh qo'sha olmaysiz");
  }
  return circle;
}

// POST /api/circles/:circleId/groups
// type=UY yoki ONLINE bo'lsa - faqat 1 ta guruh bo'lishi mumkin (sodda holat).
// type=KURS bo'lsa - istalgancha guruh qo'shish mumkin (masalan Beginner-A, IELTS-Intensive...).
const createGroup = asyncHandler(async (req, res) => {
  const circle = await assertCircleOwnership(req.params.circleId, req.user);

  if (circle.type !== "KURS" && circle._count.groups >= 1) {
    throw ApiError.badRequest(
      "UY yoki ONLINE turidagi togarakda faqat 1 ta guruh bo'lishi mumkin. Mavjud guruhni tahrirlang (PATCH)"
    );
  }

  const { name, teacherName, teacherBio, teacherAvatar, schedule, maxStudents } = req.body;

  const group = await prisma.group.create({
    data: {
      circleId: circle.id,
      name: name || null,
      teacherName,
      teacherBio,
      teacherAvatar,
      schedule: schedule ? (typeof schedule === "string" ? JSON.parse(schedule) : schedule) : undefined,
      maxStudents: maxStudents ? Number(maxStudents) : null,
    },
  });

  res.status(201).json(new ApiResponse(201, group, "Guruh qo'shildi"));
});

// PATCH /api/groups/:id
const updateGroup = asyncHandler(async (req, res) => {
  const group = await prisma.group.findUnique({ where: { id: req.params.id }, include: { circle: true } });
  if (!group) throw ApiError.notFound("Guruh topilmadi");
  if (group.circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu guruhni tahrirlash huquqingiz yo'q");
  }

  const allowed = ["name", "teacherName", "teacherBio", "teacherAvatar", "maxStudents", "takenStudents", "status"];
  const data = {};
  for (const f of allowed) if (req.body[f] !== undefined) data[f] = req.body[f];
  if (req.body.schedule !== undefined) {
    data.schedule = typeof req.body.schedule === "string" ? JSON.parse(req.body.schedule) : req.body.schedule;
  }
  if (data.maxStudents !== undefined) data.maxStudents = Number(data.maxStudents);
  if (data.takenStudents !== undefined) data.takenStudents = Number(data.takenStudents);

  const updated = await prisma.group.update({ where: { id: group.id }, data });
  res.json(new ApiResponse(200, updated, "Guruh yangilandi"));
});

// DELETE /api/groups/:id
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await prisma.group.findUnique({ where: { id: req.params.id }, include: { circle: true } });
  if (!group) throw ApiError.notFound("Guruh topilmadi");
  if (group.circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("O'chirish huquqingiz yo'q");
  }
  await prisma.group.delete({ where: { id: group.id } });
  res.json(new ApiResponse(200, null, "Guruh o'chirildi"));
});

export { createGroup, updateGroup, deleteGroup };
