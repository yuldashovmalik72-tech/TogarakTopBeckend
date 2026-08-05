import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authenticate, ctrl.list);
router.post("/read-all", authenticate, ctrl.markAllRead);
router.patch("/:id/read", authenticate, ctrl.markRead);
router.delete("/:id", authenticate, ctrl.remove);

export default router;
