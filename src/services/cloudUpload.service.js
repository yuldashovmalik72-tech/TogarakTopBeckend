import fs from "fs";
import env from "../config/env.js";

/**
 * Bepul Bulutli Rasm Yuklash Servisi (ImgBB / Cloudinary)
 * Server diskini to'ldirmasdan, rasmni bulutga yuklab, doimiy HTTPS havolasini oladi.
 */
export async function uploadToCloud(filePathOrBuffer, customFilename = "image.jpg") {
  const apiKey = process.env.IMGBB_API_KEY;

  if (apiKey) {
    try {
      let base64Data = "";
      if (typeof filePathOrBuffer === "string" && fs.existsSync(filePathOrBuffer)) {
        base64Data = fs.readFileSync(filePathOrBuffer, { encoding: "base64" });
      } else if (Buffer.isBuffer(filePathOrBuffer)) {
        base64Data = filePathOrBuffer.toString("base64");
      }

      if (base64Data) {
        const formData = new URLSearchParams();
        formData.append("key", apiKey);
        formData.append("image", base64Data);

        const res = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
          // ImgBB osilib qolsa so'rov cheksiz kutmasligi uchun
          signal: AbortSignal.timeout(30000),
        });

        const data = await res.json();
        if (data?.data?.url) {
          // Bulutga chiqqach vaqtinchalik lokal faylni o'chiramiz — server diski to'lmasin
          if (typeof filePathOrBuffer === "string") {
            fs.unlink(filePathOrBuffer, () => {});
          }
          return {
            success: true,
            url: data.data.url,
            provider: "imgbb",
          };
        }
      }
    } catch (err) {
      console.warn("[CloudUpload] ImgBB yuklash xatosi, lokal havolaga o'tiladi:", err.message);
    }
  }

  // Lokal havolani qaytarish — bazaga faqat nisbiy /uploads/... manzil yoziladi
  let localUrl = `/uploads/images/${customFilename}`;
  if (typeof filePathOrBuffer === "string") {
    const norm = filePathOrBuffer.replace(/\\/g, "/");
    const idx = norm.lastIndexOf("/uploads/");
    if (idx >= 0) localUrl = norm.slice(idx);
  }
  return {
    success: true,
    url: localUrl,
    provider: "local",
  };
}
