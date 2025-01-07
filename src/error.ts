class CustomError extends Error {
  name: string;
  message: string;

  constructor(message: string, name: string = 'EnmapError') {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = name;
    this.message = message;
  }
}

export default CustomError;
