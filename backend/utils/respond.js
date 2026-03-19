'use strict';

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a paginated list response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {{ page: number, limit: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean }} pagination
 * @param {string} [message='Success']
 */
const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      hasPrevPage: pagination.hasPrevPage,
    },
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code  Machine-readable error code, e.g. 'NOT_FOUND'
 * @param {string} message Human-readable description
 * @param {number} [statusCode=400]
 * @param {*} [details]   Extra context (validation errors, etc.)
 */
const error = (res, code, message, statusCode = 400, details = undefined) => {
  const body = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details !== undefined) {
    body.error.details = details;
  }
  return res.status(statusCode).json(body);
};

/**
 * Send a 404 Not Found response.
 * @param {import('express').Response} res
 * @param {string} [code='NOT_FOUND']
 * @param {string} [message='Resource not found']
 */
const notFound = (res, code = 'NOT_FOUND', message = 'Resource not found') => {
  return error(res, code, message, 404);
};

/**
 * Send a 403 Forbidden response.
 * @param {import('express').Response} res
 * @param {string} [code='FORBIDDEN']
 * @param {string} [message='You are not authorized to perform this action']
 */
const forbidden = (res, code = 'FORBIDDEN', message = 'You are not authorized to perform this action') => {
  return error(res, code, message, 403);
};

/**
 * Send a 201 Created response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Created successfully']
 */
const created = (res, data, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

module.exports = { success, paginated, error, notFound, forbidden, created };
