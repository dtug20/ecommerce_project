'use strict';

/**
 * Simple Mustache-style template renderer.
 * Replaces {{key}} placeholders with values from the data object.
 * Missing keys are replaced with an empty string.
 *
 * @param {string} template  Template string containing {{key}} placeholders
 * @param {Record<string, string|number>} data  Replacement values
 * @returns {string}
 */
function renderTemplate(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value != null ? String(value) : '');
  }
  // Remove any remaining unresolved placeholders
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  return result;
}

module.exports = { renderTemplate };
