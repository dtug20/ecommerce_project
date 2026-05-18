const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') })

module.exports.secret = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  db_url: process.env.MONGO_URI,

  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  cloudinary_upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,

  stripe_key: process.env.STRIPE_KEY,
  client_url: process.env.STORE_URL,
  admin_url: process.env.ADMIN_URL,

  vnpay_tmn_code: process.env.VNPAY_TMN_CODE,
  vnpay_hash_secret: process.env.VNPAY_HASH_SECRET,
  vnpay_url: process.env.VNPAY_URL,
  vnpay_return_url: process.env.VNPAY_RETURN_URL,
  vnpay_ipn_url: process.env.VNPAY_IPN_URL,
}
