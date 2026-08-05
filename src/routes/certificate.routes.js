import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/certificate.controller.js";

const router = Router();

// Faqat ADMIN: tasdiqlanmagan sertifikatlar navbati (bu /:id dan oldin bo'lishi shart)
router.get("/pending", authenticate, authorize("ADMIN"), ctrl.listPendingCertificates);

router.delete("/:id", authenticate, ctrl.deleteCertificate);

// Faqat ADMIN: sertifikatni haqiqiy deb tasdiqlash
router.patch("/:id/verify", authenticate, authorize("ADMIN"), ctrl.verifyCertificate);

export default router;
