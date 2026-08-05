import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadCertificateImage } from "../middleware/upload.middleware.js";
import * as ctrl from "../controllers/group.controller.js";
import * as certCtrl from "../controllers/certificate.controller.js";

const router = Router();

router.patch("/:id", authenticate, ctrl.updateGroup);
router.delete("/:id", authenticate, ctrl.deleteGroup);

// O'qituvchi sertifikati - shu guruhga bog'liq
router.post("/:groupId/certificates", authenticate, uploadCertificateImage, certCtrl.uploadCertificate);

export default router;
