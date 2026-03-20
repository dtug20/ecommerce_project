'use strict';

const respond = require('../utils/respond');

/**
 * Body validation middleware.
 * Validates req.body against the provided Joi schema.
 * On failure returns 422 with a field-keyed error map.
 * On success strips unknown keys and replaces req.body with the coerced value.
 *
 * @param {import('joi').Schema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message.replace(/['"]/g, '');
        return acc;
      }, {});
      return respond.error(res, 'VALIDATION_ERROR', 'Request validation failed', 422, details);
    }
    req.body = value;
    next();
  };
}

/**
 * Query-string validation middleware.
 * Validates req.query against the provided Joi schema.
 * On failure returns 400 with the first error message.
 * On success strips unknown keys and replaces req.query with the coerced value.
 *
 * @param {import('joi').Schema} schema
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: true,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return respond.error(res, 'INVALID_QUERY', error.details[0].message.replace(/['"]/g, ''), 400);
    }
    req.query = value;
    next();
  };
}

module.exports = { validate, validateQuery };
