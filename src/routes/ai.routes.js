import { Router } from "express";
import { compareCircles } from "../controllers/ai.controller.js";

const router = Router();

// Har qanday foydalanuvchi to'garaklarni AI orqali taqqoslay oladi
router.post("/compare", compareCircles);

export default router;
