import { Router } from "express";
import { body } from "express-validator";
import validate from "../middleware/validate.middleware.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", [
  body("firstName").trim().notEmpty().withMessage("Ism kiritilishi shart"),
  body("lastName").trim().notEmpty().withMessage("Familiya kiritilishi shart"),
  body("email").isEmail().withMessage("Email noto'g'ri formatda"),
  body("password").isLength({ min: 6 }).withMessage("Parol kamida 6 belgidan iborat bo'lishi kerak"),
  body("age").optional().isInt({ min: 3, max: 100 }).withMessage("Yosh noto'g'ri"),
], validate, ctrl.register);

router.post("/login", [
  body("email").isEmail().withMessage("Email noto'g'ri formatda"),
  body("password").notEmpty().withMessage("Parol kiritilishi shart"),
], validate, ctrl.login);

router.post("/google", ctrl.googleLogin);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);

router.get("/me", authenticate, ctrl.getMe);

router.patch("/me", authenticate, [
  body("firstName").optional().trim().notEmpty().withMessage("Ism bo'sh bo'lmasligi kerak"),
  body("lastName").optional().trim().notEmpty().withMessage("Familiya bo'sh bo'lmasligi kerak"),
  body("age").optional({ nullable: true }).isInt({ min: 3, max: 100 }).withMessage("Yosh noto'g'ri"),
  body("avatarUrl").optional().isString(),
], validate, ctrl.updateMe);

router.patch("/change-password", authenticate, [
  body("currentPassword").notEmpty().withMessage("Joriy parol kiritilishi shart"),
  body("newPassword").isLength({ min: 6 }).withMessage("Yangi parol kamida 6 belgidan iborat bo'lishi kerak"),
], validate, ctrl.changePassword);

router.post("/resend-verification", authenticate, ctrl.resendVerification);
router.post("/verify-email", [
  body("token").notEmpty().withMessage("Token talab qilinadi"),
], validate, ctrl.verifyEmail);

router.get("/users", authenticate, authorize("ADMIN"), ctrl.listUsers);
router.patch("/users/:id/role", authenticate, authorize("ADMIN"), [
  body("role").isIn(["USER", "CREATOR", "ADMIN"]).withMessage("Rol noto'g'ri"),
], validate, ctrl.changeUserRole);

export default router;
