import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

/**
 * POST /api/leads
 * Bepul sinov darsi yoki diagnostik testga yozilish
 */
export async function createLead(req, res, next) {
  try {
    const { circleId, groupId, parentName, phone, childAge, userGoal, notes } = req.body;

    if (!circleId || !parentName || !phone) {
      throw ApiError.badRequest("circleId, parentName va phone maydonlari to'ldirilishi shart");
    }

    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { courseCenter: true },
    });

    if (!circle) {
      throw ApiError.notFound("To'garak topilmadi");
    }

    const lead = await prisma.bookingLead.create({
      data: {
        circleId,
        groupId: groupId || null,
        parentName: parentName.trim(),
        phone: phone.trim(),
        childAge: childAge ? Number(childAge) : null,
        userGoal: userGoal ? String(userGoal).trim() : null,
        notes: notes ? String(notes).trim() : null,
        status: "NEW",
      },
    });

    res.status(201).json({
      success: true,
      message: "Sinov darsiga arizangiz muvaffaqiyatli qabul qilindi! Tez orada markaz ma'muri siz bilan bog'lanadi.",
      data: {
        leadId: lead.id,
        circleName: circle.name,
        centerName: circle.courseCenter?.name || "Markaz",
        parentName: lead.parentName,
        phone: lead.phone,
        status: lead.status,
        createdAt: lead.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leads
 * Arizalar ro'yxati (Admin yoki to'garak egasi uchun)
 */
export async function listLeads(req, res, next) {
  try {
    const { circleId, status } = req.query;

    const where = {};
    if (circleId) where.circleId = circleId;
    if (status) where.status = status;

    const leads = await prisma.bookingLead.findMany({
      where,
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            courseCenter: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: leads,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/leads/:id
 * Ariza statusini o'zgartirish (NEW -> CONTACTED -> ENROLLED)
 */
export async function updateLeadStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lead = await prisma.bookingLead.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    next(err);
  }
}
