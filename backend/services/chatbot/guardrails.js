const buckets = new Map(); // identity -> { count, resetAt }

/**
 * Scrub PII from a message string.
 * Order matters: credit-card pattern runs BEFORE phone to avoid partial matches
 * eating card digit groups as phone numbers.
 *
 * @param {string} text
 * @returns {string}
 */
function scrubPII(text) {
  if (!text) return text;
  let out = text;
  // Credit card (13-19 consecutive digits, optional spaces/hyphens between groups)
  out = out.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]');
  // Email addresses
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[REDACTED_EMAIL]');
  // Phone numbers (US + international: optional country code, optional parens, separators)
  out = out.replace(/(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[REDACTED_PHONE]');
  return out;
}

/**
 * Check whether a message is within the allowed character limit.
 *
 * @param {string} message
 * @param {number} maxChars
 * @returns {{ ok: boolean, reason?: string }}
 */
function checkLength(message, maxChars) {
  if (typeof message !== 'string') return { ok: false, reason: 'not_string' };
  if (message.length === 0) return { ok: false, reason: 'empty' };
  if (message.length > maxChars) return { ok: false, reason: 'too_long' };
  return { ok: true };
}

/**
 * Sliding-window (fixed-window) rate limiter, in-memory per identity.
 * Resets the window when the previous window expires.
 *
 * @param {string} identity  - User/session identifier
 * @param {number} limit     - Max requests allowed in the window
 * @param {number} windowMinutes - Window duration in minutes
 * @returns {{ ok: boolean, remaining?: number, retryAfter?: number }}
 */
function checkRate(identity, limit, windowMinutes) {
  const now = Date.now();
  const winMs = windowMinutes * 60 * 1000;
  const b = buckets.get(identity);

  if (!b || b.resetAt <= now) {
    buckets.set(identity, { count: 1, resetAt: now + winMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }

  b.count += 1;
  return { ok: true, remaining: limit - b.count };
}

/** Reset all rate-limit buckets (for testing only). */
function _resetRate() {
  buckets.clear();
}

module.exports = { scrubPII, checkLength, checkRate, _resetRate };
