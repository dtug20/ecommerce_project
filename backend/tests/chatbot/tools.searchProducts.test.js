const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../../model/Products');
const factory = require('../../services/chatbot/tools/searchProducts');

let mongo;
let registered;

const brandId = new mongoose.Types.ObjectId();
const categoryId = new mongoose.Types.ObjectId();

const baseProduct = {
  img: 'https://example.com/img.jpg',
  unit: 'pc',
  parent: 'Footwear',
  children: 'Sneakers',
  brand: { name: 'Nike', id: brandId },
  category: { name: 'Shoes', id: categoryId },
  description: 'A great product',
};

describe('searchProducts tool', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    factory((t) => { registered = t; });
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('finds products by title text', async () => {
    await Product.create({
      ...baseProduct,
      title: 'Red running shoes',
      price: 50,
      quantity: 5,
      productType: 'fashion',
      status: 'in-stock',
      slug: 'red-running-shoes'
    });
    const out = await registered.handler({ query: 'running shoes' }, { isAuthenticated: false });
    expect(out.items.length).toBeGreaterThanOrEqual(1);
    expect(out.items[0].title).toMatch(/running/i);
  });

  it('respects price filters', async () => {
    await Product.create({ ...baseProduct, title: 'Cheap Item', price: 10, quantity: 1, productType: 'electronics', status: 'in-stock', slug: 'cheap-item' });
    await Product.create({ ...baseProduct, title: 'Expensive Item', price: 1000, quantity: 1, productType: 'electronics', status: 'in-stock', slug: 'expensive-item' });
    const out = await registered.handler({ query: '', filters: { maxPrice: 100 } }, { isAuthenticated: false });
    const titles = out.items.map((i) => i.title);
    expect(titles).toContain('Cheap Item');
    expect(titles).not.toContain('Expensive Item');
  });
});
