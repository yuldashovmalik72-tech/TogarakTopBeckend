import multer from "multer";
import path from "path";
import fs from "fs";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

// uploads/images, uploads/videos, uploads/certificates papkalarini yaratib qo'yamiz
const subDirs = ["images", "videos", "certificates", "results"];
subDirs.forEach((dir) => {
  const full = path.join(process.cwd(), env.upload.dir, dir);
  fs.mkdirSync(full, { recursive: true });
});

// Eslatma: Production uchun UPLOAD_PROVIDER=s3 va S3_* env o'zgaruvchilarini to'ldiring.
// Hozircha diskStorage (local). S3 integratsiyasi keyingi bosqichda — env tayyor.
function makeStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), env.upload.dir, subDir));
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(ApiError.badRequest("Faqat rasm fayllari qabul qilinadi"));
  }
  cb(null, true);
};

const videoFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("video/")) {
    return cb(ApiError.badRequest("Faqat video fayllar qabul qilinadi"));
  }
  cb(null, true);
};

// Togarak/kurs rasmlari - maksimum 2 ta
const uploadCircleImages = multer({
  storage: makeStorage("images"),
  fileFilter: imageFileFilter,
  limits: { fileSize: env.upload.maxImageSizeMb * 1024 * 1024 },
}).array("images", 2);

// O'qituvchi sertifikati - har biri alohida nom (title) bilan birma-bir yuklanadi
const uploadCertificateImage = multer({
  storage: makeStorage("certificates"),
  fileFilter: imageFileFilter,
  limits: { fileSize: env.upload.maxImageSizeMb * 1024 * 1024 },
}).single("image");

// Natijalar (IELTS, CEFR va h.k.) rasmi
const uploadResultImage = multer({
  storage: makeStorage("results"),
  fileFilter: imageFileFilter,
  limits: { fileSize: env.upload.maxImageSizeMb * 1024 * 1024 },
}).single("image");

// PULLIK: "holat" video - xonalarni to'liq ko'rsatuvchi video
const uploadCircleVideo = multer({
  storage: makeStorage("videos"),
  fileFilter: videoFileFilter,
  limits: { fileSize: env.upload.maxVideoSizeMb * 1024 * 1024 },
}).single("video");

export {
  uploadCircleImages,
  uploadCertificateImage,
  uploadResultImage,
  uploadCircleVideo,
};
