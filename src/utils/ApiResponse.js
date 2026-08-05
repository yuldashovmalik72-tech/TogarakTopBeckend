class ApiResponse {
  constructor(statusCode, data, message = "Muvaffaqiyatli") {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
