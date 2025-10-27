class ApiResponse {
  static success(data = null, message = 'Success', statusCode = 200) {
    return {
      success: true,
      status: statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = 'Internal Server Error', statusCode = 500, errors = null) {
    return {
      success: false,
      status: statusCode,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  static validationError(errors, message = 'Validation failed') {
    return {
      success: false,
      status: 400,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  static unauthorized(message = 'Unauthorized access') {
    return {
      success: false,
      status: 401,
      message,
      timestamp: new Date().toISOString()
    };
  }

  static forbidden(message = 'Forbidden access') {
    return {
      success: false,
      status: 403,
      message,
      timestamp: new Date().toISOString()
    };
  }

  static notFound(message = 'Resource not found') {
    return {
      success: false,
      status: 404,
      message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ApiResponse;