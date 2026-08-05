import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import verifyPaymeAuth from "../middleware/paymeAuth.middleware.js";
import * as ctrl from "../controllers/payment.controller.js";

const router = Router();

router.post("/initiate", authenticate, ctrl.initiate);
router.get("/mine", authenticate, ctrl.myPayments);
router.get("/:id", authenticate, ctrl.getStatus);

// Webhooklar - Click/Payme serverlaridan keladi, JWT talab qilinmaydi.
// Click: imzo (sign_string, MD5) orqali tekshiriladi (services/click.service.js)
// Payme: Authorization: Basic header orqali tekshiriladi (middleware/paymeAuth.middleware.js)
router.post("/click/prepare", ctrl.clickPrepare);
router.post("/click/complete", ctrl.clickComplete);
router.post("/payme", verifyPaymeAuth, ctrl.paymeWebhook);

export default router;
