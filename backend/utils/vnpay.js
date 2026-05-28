'use strict';

const crypto = require('crypto');
const qs = require('qs');
const dayjs = require('dayjs');
const { secret } = require('../config/secret');

function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
        }
    }

    return sorted;
}

function createSecureHash(params) {
    const sortedParams = sortObject(params);
    const signData = qs.stringify(sortedParams, { encode: false });

    return crypto
        .createHmac('sha512', secret.vnpay_hash_secret)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');
}

function verifyVnpaySignature(query) {
    const vnpParams = { ...query };
    const secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const signed = createSecureHash(vnpParams);

    return secureHash === signed;
}

function buildPaymentUrl({ order, ipAddr, bankCode, locale = 'vn' }) {
    if (!secret.vnpay_tmn_code || !secret.vnpay_hash_secret || !secret.vnpay_url) {
        throw new Error('VNPay is not configured (missing VNPAY_TMN_CODE, VNPAY_HASH_SECRET, or VNPAY_URL)');
    }

    const now = dayjs();
    const createDate = now.format('YYYYMMDDHHmmss');
    const expireDate = now.add(15, 'minute').format('YYYYMMDDHHmmss');

    const EXCHANGE_RATE = 25000;
    const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: secret.vnpay_tmn_code,
        vnp_Locale: locale || 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: String(order._id),
        vnp_OrderInfo: `Thanh toan don hang ${order.invoice || order._id}`,
        vnp_OrderType: 'other',
        vnp_Amount: Math.round(order.totalAmount * EXCHANGE_RATE) * 100,
        vnp_ReturnUrl: secret.vnpay_return_url,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    if (bankCode) {
        vnpParams.vnp_BankCode = bankCode;
    }

    const sortedParams = sortObject(vnpParams);
    const secureHash = createSecureHash(vnpParams);

    sortedParams.vnp_SecureHash = secureHash;

    return `${secret.vnpay_url}?${qs.stringify(sortedParams, { encode: false })}`;
}

module.exports = {
    sortObject,
    createSecureHash,
    verifyVnpaySignature,
    buildPaymentUrl,
};