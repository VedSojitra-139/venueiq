class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // vs programming errors
  }
}

class NotFoundError extends AppError {
  constructor(msg = 'Resource not found') { super(msg, 404, 'NOT_FOUND'); }
}

class ValidationError extends AppError {
  constructor(msg = 'Validation failed') { super(msg, 400, 'VALIDATION_ERROR'); }
}

class AuthError extends AppError {
  constructor(msg = 'Unauthorised') { super(msg, 401, 'UNAUTHORISED'); }
}

module.exports = { AppError, NotFoundError, ValidationError, AuthError };