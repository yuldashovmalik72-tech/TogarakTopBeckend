import { Router } from "express";
import authRoutes from "./auth.routes.js";
import circleRoutes from "./circle.routes.js";
import groupRoutes from "./group.routes.js";
import certificateRoutes from "./certificate.routes.js";
import courseCenterRoutes from "./courseCenter.routes.js";
import resultRoutes from "./result.routes.js";
import notificationRoutes from "./notification.routes.js";
import aiRoutes from "./ai.routes.js";
import leadRoutes from "./lead.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/circles", circleRoutes);
router.use("/groups", groupRoutes);
router.use("/certificates", certificateRoutes);
router.use("/course-centers", courseCenterRoutes);
router.use("/results", resultRoutes);
router.use("/notifications", notificationRoutes);
router.use("/ai", aiRoutes);
router.use("/leads", leadRoutes);

export default router;
