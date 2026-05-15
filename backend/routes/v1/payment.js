'use strict';

const express = require('express');
const router = express.Router();

const Order = require('../../model/Order');
const { verifyVnpaySignature } = require('../../utils/vnpay');
const { emitOrderUpdated } = require('../../utils/socketEmitter');

router.get('/vnpay/ipn', async (req, res) => {
  try {
    const vnpParams = req.query;

    const isValidSignature = verifyVnpaySignature(vnpParams);
    if (!isValidSignature) {
      return res.status(200).json({
        RspCode: '97',
        Message: 'Invalid signature',
      });
    }

    const orderId = vnpParams.vnp_TxnRef;
    const vnpAmount = Number(vnpParams.vnp_Amount) / 100;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionStatus = vnpParams.vnp_TransactionStatus;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(200).json({
        RspCode: '01',
        Message: 'Order not found',
      });
    }

    if (Number(order.totalAmount) !== Number(vnpAmount)) {
      return res.status(200).json({
        RspCode: '04',
        Message: 'Invalid amount',
      });
    }

    if (order.paymentStatus === 'paid' || order.paymentStatus === 'failed') {
      return res.status(200).json({
        RspCode: '02',
        Message: 'Order already confirmed',
      });
    }

    if (responseCode === '00' && transactionStatus === '00') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.transactionId = vnpParams.vnp_TransactionNo;
      order.vnpayTransactionNo = vnpParams.vnp_TransactionNo;
      order.vnpayBankCode = vnpParams.vnp_BankCode;
      order.vnpayPayDate = vnpParams.vnp_PayDate;
      order.paidAt = new Date();
    } else {
      order.paymentStatus = 'failed';
      order.transactionId = vnpParams.vnp_TransactionNo;
    }

    await order.save();

    emitOrderUpdated(order);

    return res.status(200).json({
      RspCode: '00',
      Message: 'Confirm Success',
    });
  } catch (error) {
    console.error('[VNPay IPN] Error:', error);
    return res.status(200).json({
      RspCode: '99',
      Message: 'Unknown error',
    });
  }
});

router.get('/vnpay/return', async (req, res) => {
  try {
    const isValidSignature = verifyVnpaySignature(req.query);

    if (!isValidSignature) {
      return res.redirect(`${process.env.STORE_URL}/payment-result?status=invalid-signature`);
    }

    const orderId = req.query.vnp_TxnRef;
    const responseCode = req.query.vnp_ResponseCode;
    const transactionStatus = req.query.vnp_TransactionStatus;

    const status =
      responseCode === '00' && transactionStatus === '00'
        ? 'success'
        : 'failed';

    return res.redirect(
      `${process.env.STORE_URL}/payment-result?status=${status}&orderId=${orderId}`
    );
  } catch (error) {
    console.error('[VNPay Return] Error:', error);
    return res.redirect(`${process.env.STORE_URL}/payment-result?status=error`);
  }
});

module.exports = router;