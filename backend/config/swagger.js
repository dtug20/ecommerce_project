'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'Shofy E-Commerce API',
    version: '1.0.0',
    description: [
      'REST API for the Shofy e-commerce platform.',
      '',
      '**Base URL:** `/api/v1`',
      '',
      '**Authentication:** All protected endpoints require a Bearer JWT obtained from Keycloak.',
      'Pass it in the `Authorization` header: `Authorization: Bearer <token>`',
    ].join('\n'),
    contact: {
      name: 'Shofy Engineering',
    },
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:7001',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Keycloak-issued JWT. Obtain from Keycloak auth flow.',
      },
    },
    schemas: {
      // Envelope schemas shared across responses
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data:    {},
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success:    { type: 'boolean', example: true },
          message:    { type: 'string' },
          data:       { type: 'array', items: {} },
          pagination: {
            type: 'object',
            properties: {
              page:        { type: 'integer' },
              limit:       { type: 'integer' },
              totalItems:  { type: 'integer' },
              totalPages:  { type: 'integer' },
              hasNextPage: { type: 'boolean' },
              hasPrevPage: { type: 'boolean' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code:    { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: { type: 'object', additionalProperties: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Store Products',   description: 'Public product browsing' },
    { name: 'Store Categories', description: 'Public category browsing' },
    { name: 'Store CMS',        description: 'Public CMS content (pages, menus, banners, settings)' },
    { name: 'Store Blog',       description: 'Public blog posts' },
    { name: 'User',             description: 'Authenticated user actions (orders, wishlist, addresses, reviews)' },
    { name: 'Vendor',           description: 'Vendor-role endpoints (products, orders, payouts, analytics)' },
    { name: 'Admin Products',   description: 'Admin product management' },
    { name: 'Admin Orders',     description: 'Admin order management' },
    { name: 'Admin Vendors',    description: 'Admin vendor management (approve/reject)' },
    { name: 'Admin CMS',        description: 'Admin CMS management (pages, menus, banners, blog, coupons)' },
    { name: 'Admin Analytics',  description: 'Admin analytics and reporting' },
    { name: 'Admin Settings',   description: 'Admin site settings' },
    { name: 'Admin',            description: 'Admin users, staff, and media management' },
  ],
};

const options = {
  definition,
  // Scan all v1 route files for @swagger JSDoc comments
  apis: [
    path.join(__dirname, '../routes/v1/**/*.js'),
    path.join(__dirname, '../routes/v1/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
