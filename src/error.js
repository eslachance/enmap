class CustomError extends Error {

  constructor(message, extra) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'EnmapError';
    this.message = message;
    if (extra) this.extra = extra;
  }

}

module.exports = CustomError;
