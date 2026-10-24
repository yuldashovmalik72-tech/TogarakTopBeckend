import { Router } from "express";
import { createLead, listLeads, updateLeadStatus } from "../controllers/lead.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Har qanday ota-ona / foydalanuvchi sinov darsiga yozila oladi
router.post("/", createLead);

// Arizalarni ko'rish va statusini yangilash
router.get("/", authenticate, listLeads);
router.patch("/:id", authenticate, updateLeadStatus);

export default router;
