/**
 * Non-destructive mock data seed for the Shofy unified DB.
 *
 * Adds: users (customers + vendors), CMS home page, header/footer menus,
 *       extra banners, products across categories, orders, payouts, reviews.
 *
 * Idempotent — checks by unique fields before inserting.
 *
 * Run:  node backend/seeds/mock-data.seed.js
 */

const path = require('path');
const bcrypt = require(path.join(__dirname, '..', 'node_modules', 'bcryptjs'));
const { MongoClient, ObjectId } = require(path.join(__dirname, '..', 'node_modules', 'mongodb'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://187.124.3.207:27017/shofy';

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const log = (label, n) =>
  console.log(`  ${label.padEnd(28)} +${n}`);

async function seed() {
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db('shofy');
  console.log(`Connected to ${MONGO_URI}\n`);

  const now = new Date();
  const passwordHash = await bcrypt.hash('password123', 10);

  // ============ Look up existing reference data ============
  const brands = await db.collection('brands').find().toArray();
  const categories = await db.collection('categories').find().toArray();
  const existingProducts = await db.collection('products').find({}, { projection: { _id: 1 } }).toArray();

  if (brands.length === 0 || categories.length === 0) {
    throw new Error('Need at least one brand and one category before seeding.');
  }
  const brand = brands[0];
  const categoryByType = {};
  for (const c of categories) {
    if (!categoryByType[c.productType]) categoryByType[c.productType] = c;
  }
  const fallbackCategory = categories[0];

  // ============ USERS ============
  const userSeeds = [
    // Customers
    { name: 'Nguyen Van An',     email: 'an.nguyen@example.com',   role: 'user' },
    { name: 'Tran Thi Bich',     email: 'bich.tran@example.com',   role: 'user' },
    { name: 'Le Hoang Cuong',    email: 'cuong.le@example.com',    role: 'user' },
    { name: 'Pham Minh Dung',    email: 'dung.pham@example.com',   role: 'user' },
    { name: 'Hoang Thi Em',      email: 'em.hoang@example.com',    role: 'user' },
    { name: 'Vu Quang Phuc',     email: 'phuc.vu@example.com',     role: 'user' },
    // Vendors
    {
      name: 'Mai Anh Store Owner', email: 'maianh.store@example.com', role: 'vendor',
      vendorProfile: {
        storeName: 'Mai Anh Boutique', storeSlug: 'mai-anh-boutique',
        storeDescription: 'Curated Vietnamese fashion since 2020.',
        commissionRate: 12, verificationStatus: 'approved',
      },
    },
    {
      name: 'Saigon Tech Owner', email: 'saigontech.store@example.com', role: 'vendor',
      vendorProfile: {
        storeName: 'Saigon Tech Hub', storeSlug: 'saigon-tech-hub',
        storeDescription: 'Authentic electronics, full warranty.',
        commissionRate: 10, verificationStatus: 'approved',
      },
    },
    {
      name: 'Hanoi Beauty Owner', email: 'hanoibeauty.store@example.com', role: 'user',
      vendorProfile: {
        storeName: 'Hanoi Beauty Co.', storeSlug: 'hanoi-beauty-co',
        storeDescription: 'Korean & Japanese skincare imports.',
        commissionRate: 15, verificationStatus: 'pending',
      },
    },
    {
      name: 'Mekong Crafts Owner', email: 'mekongcrafts.store@example.com', role: 'user',
      vendorProfile: {
        storeName: 'Mekong Crafts', storeSlug: 'mekong-crafts',
        storeDescription: 'Handmade goods from the Delta.',
        commissionRate: 10, verificationStatus: 'rejected',
        rejectionReason: 'Missing tax registration documents.',
      },
    },
  ];

  let usersAdded = 0;
  const seededVendorIds = {};
  for (const u of userSeeds) {
    const existing = await db.collection('users').findOne({ email: u.email });
    if (existing) {
      if (u.vendorProfile) seededVendorIds[u.vendorProfile.storeSlug] = existing._id;
      continue;
    }
    const doc = {
      ...u,
      password: passwordHash,
      status: 'active',
      emailVerified: true,
      addresses: [{
        label: 'home',
        fullName: u.name,
        phone: '+84' + Math.floor(900000000 + Math.random() * 99999999),
        address: '123 Le Loi Street',
        city: 'Ho Chi Minh City',
        country: 'Vietnam',
        zipCode: '70000',
        isDefault: true,
      }],
      createdAt: now,
      updatedAt: now,
    };
    const r = await db.collection('users').insertOne(doc);
    if (u.vendorProfile) seededVendorIds[u.vendorProfile.storeSlug] = r.insertedId;
    usersAdded++;
  }
  log('users', usersAdded);

  // ============ PRODUCTS (more variety across categories) ============
  const productSeeds = [
    // Fashion
    { title: 'Ao Dai Truyen Thong Lua', price: 1290000, discount: 10, productType: 'fashion', quantity: 25, featured: true },
    { title: 'Vintage Denim Jacket',     price: 890000,  discount: 0,  productType: 'fashion', quantity: 18 },
    { title: 'Linen Summer Dress',       price: 650000,  discount: 15, productType: 'fashion', quantity: 30 },
    { title: 'Silk Scarf Hand-painted',  price: 380000,  discount: 0,  productType: 'fashion', quantity: 40, featured: true },
    // Beauty
    { title: 'K-Beauty Cleansing Set',   price: 980000,  discount: 20, productType: 'beauty', quantity: 50, featured: true },
    { title: 'Hyaluronic Serum 30ml',    price: 450000,  discount: 0,  productType: 'beauty', quantity: 100 },
    { title: 'Vitamin C Brightening Cream', price: 720000, discount: 10, productType: 'beauty', quantity: 60 },
    // Home & Living
    { title: 'Bamboo Tea Set',           price: 540000,  discount: 5,  productType: 'home', quantity: 22 },
    { title: 'Rattan Pendant Lamp',      price: 1450000, discount: 0,  productType: 'home', quantity: 12, featured: true },
    { title: 'Linen Bedding Set Queen',  price: 2100000, discount: 12, productType: 'home', quantity: 15 },
    // Electronics (more)
    { title: 'Wireless Earbuds Pro X',   price: 2490000, discount: 8,  productType: 'electronics', quantity: 35, featured: true },
    { title: 'Smart Watch Series 9',     price: 5990000, discount: 0,  productType: 'electronics', quantity: 20 },
    { title: 'Portable Bluetooth Speaker', price: 890000, discount: 15, productType: 'electronics', quantity: 45 },
    // Sports
    { title: 'Yoga Mat Premium 6mm',     price: 480000,  discount: 0,  productType: 'sports', quantity: 80 },
    { title: 'Resistance Band Set',      price: 320000,  discount: 10, productType: 'sports', quantity: 100, featured: true },
    // Jewelry
    { title: 'Pearl Drop Earrings',      price: 1890000, discount: 0,  productType: 'jewelry', quantity: 10 },
    { title: 'Gold-plated Bracelet',     price: 1290000, discount: 5,  productType: 'jewelry', quantity: 15 },
  ];

  let productsAdded = 0;
  const seededProductIds = [];
  for (const p of productSeeds) {
    const slug = slugify(p.title);
    const existing = await db.collection('products').findOne({ slug });
    if (existing) { seededProductIds.push(existing._id); continue; }
    const cat = categoryByType[p.productType] || fallbackCategory;
    const vendorRef = p.productType === 'fashion' ? seededVendorIds['mai-anh-boutique']
                   : p.productType === 'electronics' ? seededVendorIds['saigon-tech-hub']
                   : p.productType === 'beauty' ? seededVendorIds['hanoi-beauty-co']
                   : undefined;
    const doc = {
      sku: 'SKU-' + slug.toUpperCase().slice(0, 12) + '-' + Math.floor(Math.random() * 1000),
      img: 'https://i.ibb.co/placeholder/600x600.jpg',
      title: p.title,
      slug,
      unit: 'piece',
      imageURLs: [{
        color: { name: 'Default', clrCode: '#000000' },
        img: 'https://i.ibb.co/placeholder/600x600.jpg',
        sizes: ['S', 'M', 'L'],
      }],
      parent: cat.parent,
      children: (cat.children && cat.children[0]) || cat.parent,
      price: p.price,
      discount: p.discount || 0,
      quantity: p.quantity,
      brand: { name: brand.name, id: brand._id },
      category: { name: cat.parent, id: cat._id },
      status: p.quantity > 0 ? 'in-stock' : 'out-of-stock',
      reviews: [],
      productType: p.productType,
      description: `${p.title} — high-quality product from Shofy marketplace.`,
      additionalInformation: [],
      tags: [p.productType, p.featured ? 'featured' : 'new'],
      sizes: ['S', 'M', 'L'],
      featured: !!p.featured,
      sellCount: Math.floor(Math.random() * 50),
      ...(vendorRef ? { vendor: vendorRef } : {}),
      createdAt: now,
      updatedAt: now,
    };
    const r = await db.collection('products').insertOne(doc);
    seededProductIds.push(r.insertedId);
    productsAdded++;
  }
  log('products', productsAdded);

  // ============ PAGE: home with blocks ============
  let pagesAdded = 0;
  const homeExists = await db.collection('pages').findOne({ slug: 'home' });
  if (!homeExists) {
    const blockProductIds = (existingProducts.concat(seededProductIds.map(_id => ({ _id }))))
      .slice(0, 8)
      .map(p => p._id);

    await db.collection('pages').insertOne({
      title: 'Home',
      slug: 'home',
      type: 'home',
      status: 'published',
      publishedAt: now,
      blocks: [
        {
          _id: new ObjectId(), blockType: 'hero-slider', order: 1, isVisible: true,
          title: 'Hero Slider',
          settings: {
            slides: [
              { headline: 'New Season Arrivals',      subheadline: 'Up to 30% off',  buttonText: 'Shop Now', buttonUrl: '/shop', image: 'https://i.ibb.co/placeholder/1920x600.jpg' },
              { headline: 'Tech That Inspires',       subheadline: 'Latest gadgets', buttonText: 'Explore',  buttonUrl: '/shop?category=electronics', image: 'https://i.ibb.co/placeholder/1920x600.jpg' },
            ],
          },
        },
        {
          _id: new ObjectId(), blockType: 'category-showcase', order: 2, isVisible: true,
          title: 'Shop by Category',
          settings: { categoryIds: categories.slice(0, 6).map(c => c._id), layout: 'grid' },
        },
        {
          _id: new ObjectId(), blockType: 'featured-products', order: 3, isVisible: true,
          title: 'Featured Products', subtitle: 'Hand-picked for you',
          settings: { productIds: blockProductIds, limit: 8 },
        },
        {
          _id: new ObjectId(), blockType: 'banner-grid', order: 4, isVisible: true,
          title: 'Banner Grid',
          settings: { layout: '2-col' },
        },
        {
          _id: new ObjectId(), blockType: 'product-carousel', order: 5, isVisible: true,
          title: 'Best Sellers',
          settings: { productIds: blockProductIds.slice().reverse(), limit: 10 },
        },
        {
          _id: new ObjectId(), blockType: 'text-block', order: 6, isVisible: true,
          title: 'Why Shofy?',
          settings: {
            html: '<h2>Quality, curated.</h2><p>Every product in our marketplace is verified by our team. Free shipping on orders over 500,000 VND.</p>',
          },
        },
      ],
      seo: {
        metaTitle: 'Shofy — Curated Vietnamese Marketplace',
        metaDescription: 'Discover fashion, beauty, electronics, and more from trusted Vietnamese vendors.',
      },
      createdAt: now, updatedAt: now,
    });
    pagesAdded = 1;
  }
  log('pages', pagesAdded);

  // ============ MENUS: header-main, footer-main ============
  let menusAdded = 0;
  const headerExists = await db.collection('menus').findOne({ slug: 'header-main' });
  if (!headerExists) {
    await db.collection('menus').insertOne({
      name: 'Header Main',
      slug: 'header-main',
      location: 'header-main',
      status: 'active',
      isDefault: true,
      items: [
        { _id: new ObjectId(), label: 'Home',        labelVi: 'Trang chủ',  type: 'link', url: '/', order: 1, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Shop',        labelVi: 'Cửa hàng',   type: 'link', url: '/shop', order: 2, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Electronics', labelVi: 'Điện tử',    type: 'link', url: '/shop?category=electronics', order: 3, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Fashion',     labelVi: 'Thời trang', type: 'link', url: '/shop?category=fashion', order: 4, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Beauty',      labelVi: 'Làm đẹp',    type: 'link', url: '/shop?category=beauty', order: 5, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Blog',        labelVi: 'Blog',       type: 'link', url: '/blog', order: 6, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Contact',     labelVi: 'Liên hệ',    type: 'link', url: '/contact', order: 7, isVisible: true, children: [] },
      ],
      createdAt: now, updatedAt: now,
    });
    menusAdded++;
  }
  const footerExists = await db.collection('menus').findOne({ slug: 'footer-main' });
  if (!footerExists) {
    await db.collection('menus').insertOne({
      name: 'Footer Main',
      slug: 'footer-main',
      location: 'footer-main',
      status: 'active',
      items: [
        { _id: new ObjectId(), label: 'About Us',  labelVi: 'Về chúng tôi',     type: 'link', url: '/about', order: 1, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Privacy',   labelVi: 'Bảo mật',          type: 'link', url: '/privacy', order: 2, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Terms',     labelVi: 'Điều khoản',       type: 'link', url: '/terms', order: 3, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Shipping',  labelVi: 'Vận chuyển',       type: 'link', url: '/shipping', order: 4, isVisible: true, children: [] },
        { _id: new ObjectId(), label: 'Returns',   labelVi: 'Đổi trả',          type: 'link', url: '/returns', order: 5, isVisible: true, children: [] },
      ],
      createdAt: now, updatedAt: now,
    });
    menusAdded++;
  }
  log('menus', menusAdded);

  // ============ BANNERS (additional) ============
  const bannerSeeds = [
    {
      title: 'Spring Sale Hero',
      type: 'hero-slide',
      content: { text: 'Spring Sale — Up to 40% Off', textVi: 'Khuyến mãi mùa xuân — Giảm tới 40%', buttonText: 'Shop Now', buttonTextVi: 'Mua ngay', buttonUrl: '/shop', image: 'https://i.ibb.co/placeholder/1920x600.jpg' },
      priority: 10,
    },
    {
      title: 'Free Shipping Bar',
      type: 'announcement-bar',
      content: { text: 'Free shipping on orders over 500,000 VND', textVi: 'Miễn phí vận chuyển cho đơn hàng trên 500,000 VND' },
      position: 'top', priority: 100, dismissible: true,
    },
    {
      title: 'New Vendor Promo',
      type: 'promotional-banner',
      content: { text: 'Discover our newest vendors', textVi: 'Khám phá nhà bán hàng mới', buttonText: 'Browse', buttonUrl: '/vendors' },
      priority: 5,
    },
  ];
  let bannersAdded = 0;
  for (const b of bannerSeeds) {
    const exists = await db.collection('banners').findOne({ title: b.title });
    if (exists) continue;
    await db.collection('banners').insertOne({
      ...b,
      status: 'active',
      scheduling: { isAlwaysActive: true },
      targeting: { pages: ['home'], userSegments: [] },
      analytics: { impressions: 0, clicks: 0, dismissals: 0 },
      createdAt: now, updatedAt: now,
    });
    bannersAdded++;
  }
  log('banners', bannersAdded);

  // ============ ORDERS ============
  const customerUsers = await db.collection('users').find({ role: 'user' }).limit(6).toArray();
  const allProducts = await db.collection('products').find({}).limit(20).toArray();
  const lastInvoice = await db.collection('orders').find().sort({ invoice: -1 }).limit(1).toArray();
  let nextInvoice = lastInvoice[0] ? lastInvoice[0].invoice + 1 : 1100;

  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  let ordersAdded = 0;
  if (customerUsers.length > 0 && allProducts.length > 0) {
    for (let i = 0; i < 10; i++) {
      const u = customerUsers[i % customerUsers.length];
      const productPicks = [allProducts[i % allProducts.length], allProducts[(i + 3) % allProducts.length]];
      const items = productPicks.map(p => ({
        productId: p._id,
        title: p.title,
        img: p.img,
        price: p.price,
        quantity: 1 + (i % 3),
      }));
      const subTotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
      const shippingCost = subTotal > 500000 ? 0 : 30000;
      const discount = i % 4 === 0 ? Math.round(subTotal * 0.1) : 0;
      const totalAmount = subTotal + shippingCost - discount;
      const status = orderStatuses[i % orderStatuses.length];
      const paymentMethod = i % 3 === 0 ? 'bank-transfer' : 'COD';
      const paymentStatus = ['delivered', 'shipped'].includes(status) ? 'paid' : 'unpaid';

      const orderDoc = {
        user: u._id,
        cart: items,
        items,
        name: u.name,
        email: u.email,
        contact: '+84901234567',
        address: '123 Le Loi Street',
        city: 'Ho Chi Minh City',
        country: 'Vietnam',
        zipCode: '70000',
        subTotal, shippingCost, discount, totalAmount,
        paymentMethod,
        paymentStatus,
        paymentGateway: paymentMethod === 'COD' ? 'cod' : 'bank-transfer',
        invoice: nextInvoice++,
        status,
        statusHistory: [
          { status: 'pending',  timestamp: new Date(now.getTime() - 86400000 * 7), note: 'Order placed' },
          ...(status !== 'pending' ? [{ status, timestamp: new Date(now.getTime() - 86400000 * 2), note: 'Status updated' }] : []),
        ],
        ...(status === 'shipped' || status === 'delivered' ? {
          trackingNumber: 'GHN' + Math.floor(Math.random() * 9000000 + 1000000),
          carrier: 'GHN',
          shippedAt: new Date(now.getTime() - 86400000 * 3),
        } : {}),
        ...(status === 'delivered' ? { deliveredAt: new Date(now.getTime() - 86400000) } : {}),
        createdAt: new Date(now.getTime() - 86400000 * (10 - i)),
        updatedAt: now,
      };
      try {
        await db.collection('orders').insertOne(orderDoc);
        ordersAdded++;
      } catch (e) {
        if (e.code !== 11000) throw e;
        nextInvoice++;
      }
    }
  }
  log('orders', ordersAdded);

  // ============ PAYOUTS ============
  let payoutsAdded = 0;
  const vendorList = await db.collection('users').find({ role: 'vendor' }).toArray();
  if (vendorList.length > 0) {
    const payoutSeeds = [
      { vendor: vendorList[0]._id, amount: 4500000, status: 'paid', transactionRef: 'TXN-2026-001', processedAt: new Date(now.getTime() - 86400000 * 30) },
      { vendor: vendorList[0]._id, amount: 3200000, status: 'processing' },
      { vendor: vendorList[1 % vendorList.length]._id, amount: 5800000, status: 'pending' },
      { vendor: vendorList[1 % vendorList.length]._id, amount: 2100000, status: 'paid', transactionRef: 'TXN-2026-002', processedAt: new Date(now.getTime() - 86400000 * 15) },
    ];
    for (const p of payoutSeeds) {
      const existing = await db.collection('payouts').findOne({ vendor: p.vendor, amount: p.amount });
      if (existing) continue;
      await db.collection('payouts').insertOne({
        ...p,
        currency: 'VND',
        bankDetails: { bank: 'Vietcombank', accountNumber: '****1234', accountName: 'Vendor Store' },
        requestedAt: new Date(now.getTime() - 86400000 * 35),
        createdAt: new Date(now.getTime() - 86400000 * 35),
        updatedAt: now,
      });
      payoutsAdded++;
    }
  }
  log('payouts', payoutsAdded);

  // ============ REVIEWS (mixed status) ============
  let reviewsAdded = 0;
  if (customerUsers.length > 0 && allProducts.length > 0) {
    const reviewSeeds = [
      { rating: 5, comment: 'Sản phẩm tuyệt vời, giao hàng nhanh!',     status: 'approved', isVerifiedPurchase: true },
      { rating: 4, comment: 'Chất lượng tốt, đáng tiền.',                status: 'approved', isVerifiedPurchase: true },
      { rating: 5, comment: 'Will buy again. Excellent quality.',       status: 'approved', isVerifiedPurchase: false },
      { rating: 3, comment: 'Average product, packaging could be better.', status: 'pending' },
      { rating: 2, comment: 'Not as described.',                        status: 'pending' },
      { rating: 1, comment: 'Spam content here',                        status: 'rejected', rejectionReason: 'Inappropriate content' },
      { rating: 5, comment: 'Highly recommend this seller!',            status: 'approved', isVerifiedPurchase: true },
      { rating: 4, comment: 'Color slightly different from photo.',     status: 'approved', isVerifiedPurchase: true },
    ];
    for (let i = 0; i < reviewSeeds.length; i++) {
      const r = reviewSeeds[i];
      const product = allProducts[i % allProducts.length];
      const user = customerUsers[i % customerUsers.length];
      const existing = await db.collection('reviews').findOne({ productId: product._id, userId: user._id, comment: r.comment });
      if (existing) continue;
      await db.collection('reviews').insertOne({
        userId: user._id,
        productId: product._id,
        ...r,
        createdAt: new Date(now.getTime() - 86400000 * (8 - i)),
        updatedAt: now,
      });
      reviewsAdded++;
    }
  }
  log('reviews', reviewsAdded);

  await client.close();

  console.log('\nDone. Default password for all seeded users: password123');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
