class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Avtorizatsiyadan o'tilmagan") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Ruxsat berilmagan") {
    return new ApiError(403, message);
  }

  static notFound(message = "Topilmadi") {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static internal(message = "Server xatoligi") {
    return new ApiError(500, message);
  }
}

export default ApiError;
