import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { compareCirclesWithAI } from "../services/ai.service.js";

/**
 * POST /api/ai/compare
 * Ikkala to'garakni taqqoslash
 */
export async function compareCircles(req, res, next) {
  try {
    const { circleAId, circleBId, circleA: rawCircleA, circleB: rawCircleB, userGoal, maxBudget } = req.body;

    let circleA = rawCircleA;
    let circleB = rawCircleB;

    if (circleAId) {
      circleA = await prisma.circle.findUnique({
        where: { id: circleAId },
        include: {
          groups: true,
          results: true,
          courseCenter: true,
        },
      });
    }

    if (circleBId) {
      circleB = await prisma.circle.findUnique({
        where: { id: circleBId },
        include: {
          groups: true,
          results: true,
          courseCenter: true,
        },
      });
    }

    if (!circleA || !circleB) {
      throw ApiError.badRequest("Taqqoslanuvchi ikkala to'garak ma'lumoti taqdim etilishi shart (circleAId va circleBId)");
    }

    const comparisonResult = await compareCirclesWithAI({
      circleA,
      circleB,
      userGoal,
      maxBudget,
    });

    res.json({
      success: true,
      data: comparisonResult,
    });
  } catch (err) {
    next(err);
  }
}
