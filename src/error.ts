class CustomError extends Error {
  constructor(message: string, name: string | null = null) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = name || 'EnmapError';
    this.message = message;
  }
}

export default CustomError;
