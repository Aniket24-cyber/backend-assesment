
export class CustomError extends Error {
  constructor(errorType, message) {
    super(message);
    this.type = errorType.type;
    this.statusCode = errorType.statusCode || 500; // Default to 500 if type is not found
  }
}




