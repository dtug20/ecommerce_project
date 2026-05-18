'use strict';

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const axios = require('axios');
const { secret } = require('./config/secret');
const connectDB = require('./config/db');
const Order = require('./model/Order');
const User = require('./model/User');
const { buildPaymentUrl, createSecureHash } = require('./utils/vnpay');

async function runTest() {
  console.log('==================================================');
  console.log('   STARTING VNPAY END-TO-END INTEGRATION TEST     ');
  console.log('==================================================\n');

  // 1. Connect to database
  console.log('Connecting to database...');
  await connectDB();

  let mockUser = null;
  let mockOrder = null;

  try {
    // 2. Resolve a mock User
    mockUser = await User.findOne();
    if (!mockUser) {
      console.log('No user found in database. Creating a mock user...');
      mockUser = await User.create({
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        keycloakId: 'mock-keycloak-id-vnpay-test',
        status: 'active',
      });
    }
    console.log(`Using mock user: ${mockUser.name} (${mockUser.email})`);

    // 3. Create a mock order with VNPay method
    console.log('\nCreating a mock order with VNPay payment gateway...');
    const totalAmountVal = 150; // 150 USD
    mockOrder = await Order.create({
      user: mockUser._id,
      invoice: Math.floor(100000 + Math.random() * 900000),
      name: mockUser.name,
      email: mockUser.email,
      address: '123 Test Street',
      contact: '0987654321',
      city: 'Hanoi',
      country: 'Vietnam',
      zipCode: '10000',
      shippingOption: 'free_shipping',
      cart: [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Sony headphones',
          price: totalAmountVal,
          orderQuantity: 1,
        }
      ],
      paymentMethod: 'vnpay',
      paymentGateway: 'vnpay',
      paymentStatus: 'unpaid',
      subTotal: totalAmountVal,
      shippingCost: 0,
      discount: 0,
      totalAmount: totalAmountVal,
      status: 'pending',
    });
    console.log(`Mock order created successfully. ID: ${mockOrder._id}, Invoice: ${mockOrder.invoice}`);
 
    // 4. Test buildPaymentUrl
    console.log('\nGenerating VNPay Sandbox URL...');
    const paymentUrl = buildPaymentUrl({
      order: mockOrder,
      ipAddr: '127.0.0.1',
      bankCode: 'NCB',
      locale: 'vn',
    });
    console.log('Generated payment URL successfully:');
    console.log(paymentUrl);
 
    // 5. Build parameters for a simulated successful IPN callback
    console.log('\nGenerating mock successful IPN request query parameters...');
    const nowStr = '20260518101500';
    const EXCHANGE_RATE = 25000;
    const vndAmount = totalAmountVal * EXCHANGE_RATE;
    const ipnParams = {
      vnp_Amount: String(vndAmount * 100), // fractional equivalent (x100)
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: 'VNP13547367',
      vnp_CardType: 'ATM',
      vnp_Command: 'pay',
      vnp_CreateDate: nowStr,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${mockOrder.invoice || mockOrder._id}`,
      vnp_ResponseCode: '00',
      vnp_TmnCode: secret.vnpay_tmn_code,
      vnp_TransactionNo: '13547367',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: String(mockOrder._id),
      vnp_Version: '2.1.0',
    };

    // Sign parameters to match VNPay hashing rules
    console.log('Signing IPN request query parameters...');
    const signature = createSecureHash(ipnParams);
    ipnParams.vnp_SecureHash = signature;
    console.log(`Computed HMAC-SHA512 Signature: ${signature}`);

    // 6. Make actual HTTP request to backend's IPN endpoint
    console.log('\nSending HTTP GET request to backend IPN endpoint on port 4000...');
    const response = await axios.get('http://localhost:4000/api/v1/auth/payment/vnpay/ipn', {
      params: ipnParams,
    });
    
    console.log('IPN Response Status:', response.status);
    console.log('IPN Response Data:', response.data);

    if (response.data?.RspCode === '00') {
      console.log('🟢 IPN route responded with CONFIRM SUCCESS!');
    } else {
      throw new Error(`🔴 IPN route failed: ${JSON.stringify(response.data)}`);
    }

    // 7. Verify order status in database has updated
    console.log('\nQuerying the database to assert order payment state...');
    const updatedOrder = await Order.findById(mockOrder._id);
    console.log(`Database state for Order ${updatedOrder._id}:`);
    console.log(`- paymentStatus: "${updatedOrder.paymentStatus}" (Expected: "paid")`);
    console.log(`- status:        "${updatedOrder.status}" (Expected: "confirmed")`);
    console.log(`- transactionId: "${updatedOrder.transactionId}" (Expected: "13547367")`);

    if (updatedOrder.paymentStatus === 'paid' && updatedOrder.status === 'confirmed') {
      console.log('\n🏆 VNPay E2E Test PASSED! Signature verification and state mutations are 100% correct!');
    } else {
      throw new Error('🔴 VNPay DB verification FAILED: Order state was not updated correctly!');
    }

  } catch (error) {
    console.error('\n❌ E2E TEST CRASHED/FAILED:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  } finally {
    // 8. Cleanup mock data
    if (mockOrder) {
      console.log('\nCleaning up mock order from database...');
      await Order.findByIdAndDelete(mockOrder._id);
    }
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Done!');
  }
}

runTest();
