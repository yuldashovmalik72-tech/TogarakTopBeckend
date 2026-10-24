import { Router } from "express";
import { createReview, getReviewsByGroup } from "../controllers/review.controller.js";

const router = Router();

router.post("/", createReview);
router.get("/", getReviewsByGroup);

export default router;
