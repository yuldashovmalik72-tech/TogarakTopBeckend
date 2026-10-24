import { Router } from "express";
import { createReview, getReviewsByCircle } from "../controllers/review.controller.js";

const router = Router();

router.post("/", createReview);
router.get("/", getReviewsByCircle);

export default router;
