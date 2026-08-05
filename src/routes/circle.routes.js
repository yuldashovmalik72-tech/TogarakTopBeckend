import { Router } from "express";
import { authenticate, optionalAuth, authorize } from "../middleware/auth.middleware.js";
import { uploadCircleImages, uploadCircleVideo, uploadResultImage } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { createCircleRules, createGroupRules, createResultRules, listCirclesQueryRules } from "../middleware/validators.js";
import * as ctrl from "../controllers/circle.controller.js";
import * as groupCtrl from "../controllers/group.controller.js";
import * as resultCtrl from "../controllers/result.controller.js";

const router = Router();

router.get("/", optionalAuth, listCirclesQueryRules, validate, ctrl.listCircles);
router.get("/mine", authenticate, ctrl.myCircles);
router.get("/pending", authenticate, authorize("ADMIN"), ctrl.listPending);

router.get("/:id", optionalAuth, ctrl.getCircleById);
router.get("/:id/stats", authenticate, ctrl.getCircleStats);
router.post("/:id/click", optionalAuth, ctrl.trackClick);

router.post("/", authenticate, uploadCircleImages, createCircleRules, validate, ctrl.createCircle);
router.patch("/:id", authenticate, uploadCircleImages, ctrl.updateCircle);
router.delete("/:id", authenticate, ctrl.deleteCircle);
router.post("/:id/restore", authenticate, ctrl.restoreCircle);

router.patch("/:id/status", authenticate, authorize("ADMIN"), ctrl.changeStatus);
router.post("/:id/video-tour", authenticate, uploadCircleVideo, ctrl.uploadVideoTour);

router.post("/:circleId/groups", authenticate, createGroupRules, validate, groupCtrl.createGroup);
router.post("/:circleId/results", authenticate, uploadResultImage, createResultRules, validate, resultCtrl.addResult);

export default router;
