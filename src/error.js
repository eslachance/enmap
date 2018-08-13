class CustomError extends Error {

  constructor(message, name = null) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = name || 'EnmapError';
    this.message = message;
  }

}

module.exports = CustomError;
