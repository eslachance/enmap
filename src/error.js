class CustomError extends Error {

  constructor(message, name = null) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = name || 'BriteLiteError';
    this.message = message;
  }

}

export default CustomError;
