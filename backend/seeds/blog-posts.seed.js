#!/usr/bin/env node

/**
 * Seed blog posts into the BlogPost collection.
 *
 * Usage:
 *   cd backend && node seeds/blog-posts.seed.js
 *
 * This will insert sample blog posts (skips if slug already exists).
 * Requires at least one Admin in the database (used as author).
 */

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const BlogPost = require("../model/BlogPost");
const Admin = require("../model/Admin");
const { secret } = require("../config/secret");

const blogPosts = [
  {
    title: "The Modern Art of Clay Ceramics",
    slug: "modern-art-clay-ceramics",
    excerpt:
      "Discover how modern artisans are blending traditional clay techniques with contemporary design to create stunning home décor pieces.",
    content: `<p>Clay ceramics have been part of human culture for thousands of years. Today, a new generation of artisans is breathing fresh life into this ancient craft, merging traditional hand-building techniques with modern aesthetics.</p>
<h3>Why Ceramics Are Trending</h3>
<p>In a world dominated by mass-produced goods, handmade ceramics offer something unique — imperfection. Each piece carries the fingerprint of its maker, making it truly one-of-a-kind.</p>
<blockquote><p>"Ceramics teach you patience. The clay doesn't rush, and neither should you."</p></blockquote>
<h3>Choosing the Right Pieces</h3>
<p>When shopping for ceramic home décor, look for pieces that complement your existing colour palette. Earthy tones work beautifully in minimalist spaces, while bold glazes can serve as statement pieces.</p>
<ul>
<li>Vases and planters for living spaces</li>
<li>Handmade bowls for the dining table</li>
<li>Decorative plates as wall art</li>
</ul>
<p>Whether you're a collector or just starting to explore, ceramics add warmth and character to any room.</p>`,
    featuredImage: "https://i.ibb.co/WVdTgR8/headphone-1.png",
    category: "Electronics",
    tags: ["Design", "Home Décor", "Trending"],
    status: "published",
    featured: true,
    views: 142,
    publishedAt: new Date("2026-03-10"),
    i18n: {
      titleVi: "Nghệ thuật gốm sứ hiện đại",
      excerptVi:
        "Khám phá cách các nghệ nhân hiện đại kết hợp kỹ thuật gốm truyền thống với thiết kế đương đại.",
      contentVi: `<p>Gốm sứ đã là một phần văn hóa nhân loại trong hàng ngàn năm. Ngày nay, thế hệ nghệ nhân mới đang thổi sức sống mới vào nghề thủ công cổ xưa này.</p>
<h3>Tại sao gốm sứ đang thịnh hành</h3>
<p>Trong thế giới sản phẩm sản xuất hàng loạt, gốm sứ thủ công mang đến điều gì đó độc đáo — sự không hoàn hảo. Mỗi sản phẩm mang dấu ấn của người tạo ra nó.</p>`,
    },
  },
  {
    title: "How Clothes Are Linked to Climate Change",
    slug: "clothes-linked-climate-change",
    excerpt:
      "Fast fashion has a hidden cost. Learn how the clothing industry impacts the environment and what you can do about it.",
    content: `<p>The fashion industry is responsible for up to 10% of global carbon emissions — more than international flights and maritime shipping combined. As consumers, the choices we make at the checkout counter have real environmental consequences.</p>
<h3>The Hidden Cost of Fast Fashion</h3>
<p>A single cotton T-shirt requires approximately 2,700 litres of water to produce. When you multiply that by the billions of garments manufactured each year, the numbers become staggering.</p>
<h3>What Can You Do?</h3>
<ul>
<li><strong>Buy less, choose well:</strong> Invest in quality pieces that last longer</li>
<li><strong>Shop second-hand:</strong> Give pre-loved clothing a second life</li>
<li><strong>Support sustainable brands:</strong> Look for certifications like GOTS or Fair Trade</li>
<li><strong>Care for your clothes:</strong> Wash less, air dry, and repair when possible</li>
</ul>
<p>Every small change adds up. By being more intentional about our wardrobes, we can help reduce fashion's environmental footprint.</p>`,
    featuredImage: "https://i.ibb.co/n1YRvWJ/headphone-5.png",
    category: "Fashion",
    tags: ["Fashion", "Sustainability", "Environment"],
    status: "published",
    featured: true,
    views: 89,
    publishedAt: new Date("2026-03-15"),
    i18n: {
      titleVi: "Quần áo liên quan đến biến đổi khí hậu như thế nào",
      excerptVi:
        "Thời trang nhanh có chi phí ẩn. Tìm hiểu ngành may mặc ảnh hưởng đến môi trường ra sao.",
      contentVi: `<p>Ngành thời trang chịu trách nhiệm cho khoảng 10% lượng khí thải carbon toàn cầu. Với tư cách người tiêu dùng, lựa chọn của chúng ta có hậu quả thực sự đối với môi trường.</p>`,
    },
  },
  {
    title: "The Sound of Fashion: Malcolm McLaren's Words",
    slug: "sound-of-fashion-malcolm-mclaren",
    excerpt:
      "Exploring the intersection of music, art, and fashion through the lens of punk icon Malcolm McLaren.",
    content: `<p>Malcolm McLaren was more than a music manager — he was a cultural provocateur who understood that fashion, music, and art were inseparable forces. His influence continues to shape streetwear and high fashion decades later.</p>
<h3>Fashion as Rebellion</h3>
<p>McLaren and Vivienne Westwood didn't just design clothes; they created a movement. Punk fashion was a statement against the establishment, using ripped fabrics, safety pins, and bold graphics to challenge the status quo.</p>
<blockquote><p>"Fashion is about what you don't see rather than what you see."</p></blockquote>
<h3>Legacy in Modern Streetwear</h3>
<p>Today's streetwear brands owe much to the punk DIY ethos that McLaren championed. From Supreme to Off-White, the idea that fashion should provoke and inspire remains central to contemporary design.</p>
<p>The lesson? True style isn't about following trends — it's about making a statement.</p>`,
    featuredImage: "https://i.ibb.co/5FPhGtq/headphone-8.png",
    category: "Fashion",
    tags: ["Fashion", "Music", "Culture"],
    status: "published",
    featured: true,
    views: 67,
    publishedAt: new Date("2026-03-18"),
    i18n: {
      titleVi: "Âm thanh của thời trang: Những lời của Malcolm McLaren",
      excerptVi:
        "Khám phá giao điểm giữa âm nhạc, nghệ thuật và thời trang qua góc nhìn của biểu tượng punk Malcolm McLaren.",
      contentVi: `<p>Malcolm McLaren không chỉ là một quản lý âm nhạc — ông là người khiêu khích văn hóa hiểu rằng thời trang, âm nhạc và nghệ thuật là những lực lượng không thể tách rời.</p>`,
    },
  },
  {
    title: "Top 10 Gadgets You Need in 2026",
    slug: "top-10-gadgets-2026",
    excerpt:
      "From AI-powered earbuds to foldable tablets, here are the must-have tech gadgets shaping our digital lives this year.",
    content: `<p>Technology moves fast, and 2026 has brought us some truly game-changing devices. Whether you're a tech enthusiast or just looking for practical upgrades, these gadgets deserve your attention.</p>
<h3>1. AI-Powered Noise Cancelling Earbuds</h3>
<p>The latest generation of wireless earbuds uses on-device AI to adapt noise cancellation in real-time based on your environment. They learn your preferences over time.</p>
<h3>2. Foldable E-Ink Tablets</h3>
<p>Perfect for reading and note-taking, these lightweight tablets fold to fit in your pocket while offering a full-size reading experience.</p>
<h3>3. Smart Home Hubs with Matter Support</h3>
<p>The Matter protocol has finally unified smart home devices. New hubs work seamlessly with every major brand.</p>
<h3>4. Portable Solar Chargers</h3>
<p>High-efficiency panels that charge your devices as fast as a wall outlet — ideal for travel and outdoor adventures.</p>
<h3>5. Health Monitoring Smartwatches</h3>
<p>Blood pressure, blood oxygen, ECG, and now blood glucose estimation — wrist-worn health tech keeps getting better.</p>
<p>Stay tuned for the full list in our next update!</p>`,
    featuredImage: "https://i.ibb.co/jvGv6qf/mobile-1.png",
    category: "Electronics",
    tags: ["Technology", "Gadgets", "Reviews"],
    status: "published",
    featured: false,
    views: 210,
    publishedAt: new Date("2026-03-20"),
    i18n: {
      titleVi: "Top 10 thiết bị công nghệ bạn cần trong năm 2026",
      excerptVi:
        "Từ tai nghe AI đến máy tính bảng gập, đây là những thiết bị công nghệ định hình cuộc sống số năm nay.",
      contentVi: `<p>Công nghệ phát triển nhanh chóng, và năm 2026 mang đến cho chúng ta những thiết bị thực sự thay đổi cuộc chơi.</p>`,
    },
  },
  {
    title: "Skincare Essentials for Every Season",
    slug: "skincare-essentials-every-season",
    excerpt:
      "Your skin changes with the weather. Here's how to adapt your skincare routine throughout the year for healthy, glowing skin.",
    content: `<p>One skincare routine doesn't fit all seasons. As temperatures and humidity levels shift, your skin's needs change too. Here's a seasonal guide to keeping your skin healthy year-round.</p>
<h3>Spring: Lighten Up</h3>
<p>Swap heavy winter moisturisers for lighter, gel-based formulas. Introduce a gentle exfoliant to remove winter's dead skin buildup.</p>
<h3>Summer: Protect</h3>
<p>Sunscreen is non-negotiable — SPF 30 minimum, reapplied every two hours. Look for lightweight, non-comedogenic options.</p>
<h3>Autumn: Repair</h3>
<p>Summer sun can leave lasting damage. Focus on antioxidant serums (vitamin C) and hydrating ingredients like hyaluronic acid.</p>
<h3>Winter: Hydrate</h3>
<p>Cold air strips moisture from your skin. Layer on richer creams and consider adding a facial oil to lock in hydration.</p>
<p>The key is listening to your skin and adjusting as needed. What works in July probably won't work in January.</p>`,
    featuredImage: "https://i.ibb.co/bdKTWYy/skin-1.png",
    category: "Beauty",
    tags: ["Beauty", "Skincare", "Health"],
    status: "published",
    featured: false,
    views: 156,
    publishedAt: new Date("2026-03-22"),
    i18n: {
      titleVi: "Những sản phẩm chăm sóc da cần thiết cho mọi mùa",
      excerptVi:
        "Da bạn thay đổi theo thời tiết. Đây là cách điều chỉnh quy trình chăm sóc da quanh năm.",
      contentVi: `<p>Một quy trình chăm sóc da không phù hợp cho tất cả các mùa. Khi nhiệt độ và độ ẩm thay đổi, nhu cầu của da cũng thay đổi.</p>`,
    },
  },
  {
    title: "How to Style Your Home on a Budget",
    slug: "style-home-on-budget",
    excerpt:
      "You don't need to spend a fortune to create a beautiful living space. These budget-friendly tips will transform your home.",
    content: `<p>Interior design doesn't have to break the bank. With a little creativity and strategic shopping, you can create a space that looks expensive without the price tag.</p>
<h3>Start With Paint</h3>
<p>Nothing transforms a room faster than a fresh coat of paint. Neutral tones create a sophisticated base, while accent walls in bold colours add personality.</p>
<h3>Thrift and Upcycle</h3>
<p>Second-hand furniture stores and online marketplaces are goldmines for unique pieces. A coat of paint or new hardware can make old furniture look brand new.</p>
<h3>Plants Are Your Best Friend</h3>
<p>Indoor plants add life, colour, and texture to any room — and many are incredibly low-maintenance. Snake plants, pothos, and peace lilies thrive with minimal care.</p>
<h3>Lighting Matters</h3>
<p>Swap harsh overhead lighting for warm-toned lamps and string lights. Good lighting can make even the simplest room feel cosy and inviting.</p>
<p>Remember: a beautiful home isn't about how much you spend — it's about how thoughtfully you curate your space.</p>`,
    featuredImage: "https://i.ibb.co/3WMPkkf/mobile-5.png",
    category: "Lifestyle",
    tags: ["Home", "Design", "Budget"],
    status: "published",
    featured: true,
    views: 98,
    publishedAt: new Date("2026-03-24"),
    i18n: {
      titleVi: "Cách trang trí nhà với ngân sách tiết kiệm",
      excerptVi:
        "Bạn không cần chi nhiều tiền để tạo nên không gian sống đẹp. Những mẹo tiết kiệm này sẽ biến đổi ngôi nhà bạn.",
      contentVi: `<p>Thiết kế nội thất không nhất thiết phải tốn kém. Với một chút sáng tạo và mua sắm thông minh, bạn có thể tạo ra không gian trông sang trọng mà không tốn nhiều.</p>`,
    },
  },
];

async function seed() {
  await mongoose.connect(secret.db_url);
  console.log("Connected to MongoDB");

  // Find an admin to use as author
  const admin = await Admin.findOne({});
  if (!admin) {
    console.error("ERROR: No admin found in database. Please seed admins first.");
    process.exit(1);
  }
  console.log(`Using admin "${admin.name}" as author`);

  let inserted = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    const exists = await BlogPost.findOne({ slug: post.slug });
    if (exists) {
      console.log(`  Skipped (exists): ${post.slug}`);
      skipped++;
      continue;
    }

    await BlogPost.create({ ...post, author: admin._id });
    console.log(`  ✓ Created: ${post.title}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
