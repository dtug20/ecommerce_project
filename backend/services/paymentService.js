'use strict';

/**
 * Payment Service
 *
 * Central dispatch for all payment methods.  Each method returns a
 * `PaymentResult` object:
 *
 * {
 *   success:        boolean,
 *   paymentGateway: string,
 *   paymentStatus:  'unpaid' | 'paid' | 'pending',
 *   transactionId:  string | null,
 *   bankDetails?:   object,    // only for bank-transfer
 *   redirectUrl?:   string,    // only for redirect-based gateways
 *   error?:         string,    // present when success === false
 * }
 *
 * Stripe, VNPay, and MoMo integrations are stubbed — they return
 * success: false so the calling code can handle them gracefully.
 * Replace the stub bodies with real gateway SDKs when credentials
 * are available.
 */

const SiteSetting = require('../model/SiteSetting');

class PaymentService {
  /**
   * Route a payment to the appropriate gateway handler.
   *
   * @param {{ totalAmount: number, cart: Array, name: string, email: string }} order
   * @param {string} method  Payment method identifier (COD, bank-transfer, stripe, vnpay, momo)
   * @param {object} paymentData  Gateway-specific payload from the client
   * @returns {Promise<object>} PaymentResult
   */
  static async processPayment(order, method, paymentData = {}) {
    switch (method) {
      case 'COD':
        return this.processCOD(order);
      case 'bank-transfer':
        return this.processBankTransfer(order);
      case 'vnpay':
        return this.processVNPay(order, paymentData);
      case 'momo':
        return this.processMoMo(order, paymentData);
      case 'stripe':
      case 'Card':
        return this.processStripe(order, paymentData);
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  // ── Cash on Delivery ─────────────────────────────────────────────────────

  static async processCOD(order) {
    return {
      success: true,
      paymentGateway: 'cod',
      paymentStatus: 'unpaid',
      transactionId: null,
    };
  }

  // ── Bank Transfer ─────────────────────────────────────────────────────────

  static async processBankTransfer(order) {
    let bankDetails = { bankName: 'Contact admin for bank details' };

    try {
      const settings = await SiteSetting.findOne().lean();
      if (settings?.payment?.bankTransfer) {
        bankDetails = settings.payment.bankTransfer;
      }
    } catch (err) {
      console.warn('[PaymentService] Could not load bank details from SiteSetting:', err.message);
    }

    return {
      success: true,
      paymentGateway: 'bank-transfer',
      paymentStatus: 'unpaid',
      transactionId: null,
      bankDetails,
    };
  }

  // ── VNPay ─────────────────────────────────────────────────────────────────

  /**
   * VNPay integration — stub.
   *
   * To implement:
   *   1. npm install vnpay
   *   2. Set VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL in .env
   *   3. Build the redirect URL and return it as `redirectUrl`
   *   4. Handle the IPN callback in /api/v1/auth/payment/vnpay/ipn
   */
  static async processVNPay(order, paymentData) {
    return {
      success: false,
      error: 'VNPay integration pending — set VNPAY_TMN_CODE and VNPAY_HASH_SECRET to enable',
      paymentGateway: 'vnpay',
    };
  }

  // ── MoMo ──────────────────────────────────────────────────────────────────

  /**
   * MoMo integration — stub.
   *
   * To implement:
   *   1. npm install axios (already available or install separately)
   *   2. Set MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY in .env
   *   3. POST to MoMo's create-payment endpoint and return `redirectUrl`
   *   4. Handle the IPN callback in /api/v1/auth/payment/momo/ipn
   */
  static async processMoMo(order, paymentData) {
    return {
      success: false,
      error: 'MoMo integration pending — set MOMO_PARTNER_CODE and MOMO_ACCESS_KEY to enable',
      paymentGateway: 'momo',
    };
  }

  // ── Stripe ────────────────────────────────────────────────────────────────

  /**
   * Stripe integration — stub.
   *
   * The original Stripe PaymentIntent flow was disabled in a prior commit.
   * To re-enable:
   *   1. npm install stripe
   *   2. Set STRIPE_KEY in .env
   *   3. Implement create PaymentIntent and confirm steps here
   *   4. Handle the webhook in /api/v1/auth/payment/stripe/webhook
   */
  static async processStripe(order, paymentData) {
    return {
      success: false,
      error: 'Stripe integration pending — set STRIPE_KEY to enable',
      paymentGateway: 'stripe',
    };
  }
}

module.exports = PaymentService;
