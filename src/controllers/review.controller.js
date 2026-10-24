import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export async function createReview(req, res, next) {
  try {
    const { circleId, rating, comment, authorName } = req.body;

    if (!circleId || !rating || !authorName) {
      throw ApiError.badRequest("circleId, rating va authorName to'ldirilishi shart");
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw ApiError.badRequest("Rating 1 dan 5 gacha butun son bo'lishi kerak");
    }

    const circle = await prisma.circle.findUnique({ where: { id: circleId } });
    if (!circle) {
      throw ApiError.notFound("To'garak topilmadi");
    }

    const review = await prisma.review.create({
      data: {
        circleId,
        rating: ratingNum,
        comment: comment ? String(comment).trim() : null,
        authorName: String(authorName).trim(),
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function getReviewsByCircle(req, res, next) {
  try {
    const { circleId } = req.query;
    if (!circleId) {
      throw ApiError.badRequest("circleId kerak");
    }

    const reviews = await prisma.review.findMany({
      where: { circleId },
      orderBy: { createdAt: "desc" },
    });

    const avgRating = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    res.json({ success: true, data: reviews, avgRating, total: reviews.length, distribution });
  } catch (err) {
    next(err);
  }
}
