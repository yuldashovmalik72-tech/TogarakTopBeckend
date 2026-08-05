import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/result.controller.js";

const router = Router();

// Faqat ADMIN: tasdiqlanmagan natijalar navbati (bu /:id dan oldin bo'lishi shart)
router.get("/pending", authenticate, authorize("ADMIN"), ctrl.listPendingResults);

router.delete("/:id", authenticate, ctrl.deleteResult);

// Faqat ADMIN: natijani haqiqiy deb tasdiqlash
router.patch("/:id/verify", authenticate, authorize("ADMIN"), ctrl.verifyResult);

export default router;
