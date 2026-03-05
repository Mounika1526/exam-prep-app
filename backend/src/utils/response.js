/**
 * Standardised JSON response helpers.
 *
 * Shape:
 *   { success: true,  message: "...", data: {...} }
 *   { success: false, message: "...", details: [...] }   ← validation errors
 */

/**
 * 200 OK success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 */
export const sendSuccess = (res, data = null, message = 'Success') =>
  res.status(200).json({ success: true, message, data });

/**
 * 201 Created response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 */
export const sendCreated = (res, data = null, message = 'Created successfully') =>
  res.status(201).json({ success: true, message, data });

/**
 * 4xx / 5xx error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode]
 * @param {Array}  [details]    – Zod validation error array
 */
export const sendError = (res, message, statusCode = 400, details = null) => {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};
