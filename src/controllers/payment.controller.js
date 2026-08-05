import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Startup bosqichi: barcha xizmatlar bepul. Click/Payme olib tashlangan.
const gone = asyncHandler(async () => {
  throw ApiError.badRequest(
    "To'lov tizimi o'chirilgan. Startup bosqichida barcha xizmatlar (video-tur va h.k.) bepul."
  );
});

export const initiate = gone;
export const getStatus = gone;
export const myPayments = gone;
export const clickPrepare = gone;
export const clickComplete = gone;
export const paymeWebhook = gone;
export const FEATURE_PRICES = {};
