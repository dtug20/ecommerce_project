const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../../model/Products');
const factory = require('../../services/chatbot/tools/getProductDetails');

let mongo;
let tool;

const brandId = new mongoose.Types.ObjectId();
const categoryId = new mongoose.Types.ObjectId();

const baseProduct = {
  img: 'https://example.com/img.jpg',
  unit: 'pc',
  parent: 'Electronics',
  children: 'Gadgets',
  brand: { name: 'Acme', id: brandId },
  category: { name: 'Gadgets', id: categoryId },
  description: 'A useful widget',
  price: 5,
  quantity: 3,
  productType: 'electronics',
  status: 'in-stock',
};

describe('getProductDetails tool', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    factory((t) => { tool = t; });
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('returns product by slug', async () => {
    await Product.create({ ...baseProduct, title: 'Widget Pro', slug: 'widget-pro' });
    const out = await tool.handler({ slug: 'widget-pro' }, {});
    expect(out.product.title).toBe('Widget Pro');
  });

  it('returns error when not found', async () => {
    const out = await tool.handler({ slug: 'nope-nope' }, {});
    expect(out.product).toBeNull();
    expect(out.error).toBe('not_found');
  });
});
