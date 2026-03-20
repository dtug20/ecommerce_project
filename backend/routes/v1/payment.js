'use strict';

/**
 * Payment webhook routes — public (no auth)
 *
 * These endpoints are called by external payment gateways, not by the
 * Shofy client.  They must remain publicly accessible (no verifyToken).
 *
 * Mounted at: /api/v1/auth/payment/*
 *
 * Each handler is currently a stub.  Replace the console.log bodies with
 * real signature verification and order status updates when integrating
 * a live gateway.
 */

const express = require('express');
const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/v1/auth/payment/vnpay/ipn
// VNPay Instant Payment Notification callback
// VNPay requires a 200 response with { RspCode: '00', Message: '...' }
// ---------------------------------------------------------------------------

router.post('/vnpay/ipn', (req, res) => {
  console.log('[Payment] VNPay IPN received:', JSON.stringify(req.body));

  // TODO: Verify vnp_SecureHash with HMAC-SHA512 using VNPAY_HASH_SECRET
  // TODO: Find order by vnp_TxnRef, update paymentStatus → 'paid'
  // TODO: Emit order:updated socket event

  res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/payment/momo/ipn
// MoMo Instant Payment Notification callback
// ---------------------------------------------------------------------------

router.post('/momo/ipn', (req, res) => {
  console.log('[Payment] MoMo IPN received:', JSON.stringify(req.body));

  // TODO: Verify signature with HMAC-SHA256 using MOMO_SECRET_KEY
  // TODO: Find order by orderId, update paymentStatus → 'paid'
  // TODO: Emit order:updated socket event

  res.status(200).json({ resultCode: 0, message: 'Success' });
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/payment/stripe/webhook
// Stripe webhook (raw body required — configure in index.js if needed)
// ---------------------------------------------------------------------------

router.post('/stripe/webhook', (req, res) => {
  console.log('[Payment] Stripe webhook received');

  // TODO: Verify Stripe-Signature header using stripe.webhooks.constructEvent()
  // TODO: Handle payment_intent.succeeded → update order paymentStatus → 'paid'
  // TODO: Handle payment_intent.payment_failed → handle accordingly
  // TODO: Emit order:updated socket event

  res.status(200).json({ received: true });
});

module.exports = router;
