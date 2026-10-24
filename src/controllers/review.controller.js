import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export async function createReview(req, res, next) {
  try {
    const { groupId, rating, comment, authorName } = req.body;

    if (!groupId || !rating || !comment || !authorName) {
      throw ApiError.badRequest("groupId, rating, comment va authorName to'ldirilishi shart");
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw ApiError.badRequest("Rating 1 dan 5 gacha butun son bo'lishi kerak");
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw ApiError.notFound("Guruh topilmadi");
    }

    const review = await prisma.review.create({
      data: {
        groupId,
        rating: ratingNum,
        comment: String(comment).trim(),
        authorName: String(authorName).trim(),
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function getReviewsByGroup(req, res, next) {
  try {
    const { groupId } = req.query;
    if (!groupId) {
      throw ApiError.badRequest("groupId kerak");
    }

    const reviews = await prisma.review.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });

    const avgRating = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    res.json({ success: true, data: reviews, avgRating, total: reviews.length });
  } catch (err) {
    next(err);
  }
}
