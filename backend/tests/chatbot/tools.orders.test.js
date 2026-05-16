const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../../model/Order');
const myOrdersFactory = require('../../services/chatbot/tools/getMyOrders');
const orderStatusFactory = require('../../services/chatbot/tools/getOrderStatus');

let mongo;
let myOrders, orderStatus;
const userId = new mongoose.Types.ObjectId();

const baseOrder = {
  name: 'Test User',
  email: 'test@example.com',
  contact: '0123456789',
  address: '123 Main St',
  city: 'Hanoi',
  country: 'Vietnam',
  zipCode: '100000',
  subTotal: 50,
  shippingCost: 5,
  discount: 0,
  totalAmount: 55,
  paymentMethod: 'COD',
  status: 'pending',
};

describe('orders tools', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    myOrdersFactory((t) => { myOrders = t; });
    orderStatusFactory((t) => { orderStatus = t; });
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
  beforeEach(async () => { await Order.deleteMany({}); });

  it('requires auth', () => {
    expect(myOrders.requiresAuth).toBe(true);
    expect(orderStatus.requiresAuth).toBe(true);
  });

  it('lists orders for the authenticated user', async () => {
    await Order.create({ ...baseOrder, user: userId });
    const out = await myOrders.handler({}, { isAuthenticated: true, userId });
    expect(out.orders.length).toBe(1);
  });

  it("refuses to return another user's order", async () => {
    const other = new mongoose.Types.ObjectId();
    const o = await Order.create({ ...baseOrder, user: other });
    const out = await orderStatus.handler({ orderId: String(o._id) }, { isAuthenticated: true, userId });
    expect(out.error).toBe('forbidden');
  });
});
