'use strict';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';

/**
 * Extract and normalise pagination parameters from req.query.
 *
 * @param {object} query  req.query object
 * @returns {{
 *   page: number,
 *   limit: number,
 *   skip: number,
 *   sortBy: string,
 *   sortOrder: 'asc'|'desc'
 * }}
 */
const getPaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const rawLimit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || DEFAULT_SORT_BY;
  const sortOrder =
    (query.sortOrder || DEFAULT_SORT_ORDER).toLowerCase() === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, sortBy, sortOrder };
};

/**
 * Build a pagination metadata object.
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} totalItems
 * @returns {{
 *   page: number,
 *   limit: number,
 *   totalItems: number,
 *   totalPages: number,
 *   hasNextPage: boolean,
 *   hasPrevPage: boolean
 * }}
 */
const buildPagination = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { getPaginationParams, buildPagination };
