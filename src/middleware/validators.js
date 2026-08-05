import { body, param, query } from "express-validator";

export const createCircleRules = [
  body("name").trim().notEmpty().withMessage("Nom kiritilishi shart"),
  body("category").trim().notEmpty().withMessage("Kategoriya kiritilishi shart"),
  body("direction").trim().notEmpty().withMessage("Yo'nalish kiritilishi shart"),
  body("type").isIn(["UY", "ONLINE", "KURS"]).withMessage("Turi UY, ONLINE yoki KURS bo'lishi kerak"),
  body("description").trim().notEmpty().withMessage("Tavsif kiritilishi shart"),
  body("tavsif").trim().notEmpty().withMessage("Nega tanlash kerakligi (tavsif) kiritilishi shart"),
  body("priceType").isIn(["FIXED", "NEGOTIABLE", "FREE"]).withMessage("priceType noto'g'ri"),
  body("priceAmount").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("Narx noto'g'ri"),
  body("currency").optional().isIn(["UZS", "USD"]),
  body("pricePeriod").optional().isIn(["MONTHLY", "WEEKLY", "ONE_TIME", "PER_LESSON"]),
  body("latitude").optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body("longitude").optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
  body("ageGroupMin").optional({ nullable: true }).isInt({ min: 0, max: 100 }),
  body("ageGroupMax").optional({ nullable: true }).isInt({ min: 0, max: 100 }),
  body("contactPhone").optional().isString(),
  body("courseCenterId").optional().isUUID().withMessage("courseCenterId UUID formatida bo'lishi kerak"),
];

export const createGroupRules = [
  body("teacherName").optional().isString(),
  body("name").optional().isString(),
  body("maxStudents").optional({ nullable: true }).isInt({ min: 1 }),
  body("schedule").optional(),
];

export const createResultRules = [
  body("title").trim().notEmpty().withMessage("Natija nomi kiritilishi shart"),
  body("type").trim().notEmpty().withMessage("Natija turi (IELTS, CEFR...) kiritilishi shart"),
  body("studentName").optional().isString(),
];

export const createCourseCenterRules = [
  body("name").trim().notEmpty().withMessage("Markaz nomi kiritilishi shart"),
  body("latitude").optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body("longitude").optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
];

export const listCirclesQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  query("sort").optional().isIn(["newest", "oldest", "price_asc", "price_desc", "popular", "name", "nearest"]),
  query("lat").optional().isFloat(),
  query("lng").optional().isFloat(),
  query("radiusKm").optional().isFloat({ min: 0.1, max: 500 }),
];

export const uuidParam = (name = "id") => [param(name).isUUID().withMessage(`${name} UUID formatida bo'lishi kerak`)];
