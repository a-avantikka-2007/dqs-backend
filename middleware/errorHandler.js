function errorHandler(error, req, res, next) {
  const status = error.statusCode || error.status || 500;
  const response = {
    message: status === 500 ? "Internal server error" : error.message
  };

  if (process.env.NODE_ENV !== "production" && status === 500) {
    response.details = error.message;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
