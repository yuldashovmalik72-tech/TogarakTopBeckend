import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadCircleImages, uploadCircleVideo } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { createCourseCenterRules } from "../middleware/validators.js";
import * as ctrl from "../controllers/courseCenter.controller.js";
import { listCirclesByCourseCenter } from "../controllers/circle.controller.js";

const router = Router();

router.get("/mine", authenticate, ctrl.mine);
router.get("/:id", ctrl.getById);
router.get("/:centerId/circles", listCirclesByCourseCenter);

router.post("/", authenticate, uploadCircleImages, createCourseCenterRules, validate, ctrl.create);
router.patch("/:id", authenticate, uploadCircleImages, ctrl.update);
router.delete("/:id", authenticate, ctrl.remove);
router.post("/:id/restore", authenticate, ctrl.restore);

router.post("/:id/video-tour", authenticate, uploadCircleVideo, ctrl.uploadTourVideo);

export default router;
