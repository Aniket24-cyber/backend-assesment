// utils/responseHelpers.js
import logger from '../helpers/logger.js';

/**
 * Sends a success response with a specific status code and data.
 * Logs the request URL, method, response status, and response data.
 * 
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {number} statusCode - The HTTP status code.
 * @param {object} data - The response data to send.
 */
export function successResponse(req, res, statusCode, data) {
  logger.info(`Success response for URL: ${req.originalUrl}, Method: ${req.method}, Status: ${statusCode}, Response: ${JSON.stringify(data)}`);
  res.status(statusCode).json({
    success: true,
    data
  });
}

/**
 * Sends an error response with a specific status code and error message.
 * Logs the request URL, method, status, error message, and response data.
 * 
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {number} statusCode - The HTTP status code.
 * @param {string} errorMessage - The error message to send.
 */
export function errorResponse(req, res, statusCode, errorMessage) {
  const errorResponse = {
    success: false,
    error: errorMessage
  };
  logger.error(`Error response for URL: ${req.originalUrl}, Method: ${req.method}, Status: ${statusCode}, Error: ${errorMessage}, Response: ${JSON.stringify(errorResponse)}`);
  
  res.status(statusCode).json(errorResponse);
}
