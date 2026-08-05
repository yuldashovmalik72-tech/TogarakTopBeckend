import ApiError from "../utils/ApiError.js";

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Prisma xatoliklarini o'qiladigan formatga o'girish
  if (error.code === "P2002") {
    error = ApiError.conflict(
      `Bu qiymat allaqachon mavjud: ${error.meta?.target?.join(", ")}`
    );
  } else if (error.code === "P2025") {
    error = ApiError.notFound("Yozuv topilmadi");
  } else if (!(error instanceof ApiError)) {
    error = new ApiError(
      error.statusCode || 500,
      error.message || "Server xatoligi"
    );
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
  });
};

const notFoundMiddleware = (req, res, next) => {
  next(ApiError.notFound(`Yo'l topilmadi: ${req.originalUrl}`));
};

export { errorMiddleware, notFoundMiddleware };
