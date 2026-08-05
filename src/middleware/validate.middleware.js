import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

// express-validator qoidalaridan keyin qo'llaniladi:
// router.post("/", [body("email").isEmail()], validate, controller)
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(ApiError.badRequest("Kiritilgan ma'lumotlar noto'g'ri", formatted));
  }
  next();
};

export default validate;
