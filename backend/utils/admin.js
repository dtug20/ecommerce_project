const bcrypt = require('bcryptjs');
const admins = [
  {
    name:'Dorothy R. Brown',
    image: "https://res.cloudinary.com/PLACEHOLDER/image/upload/v1/shofy/seed/placeholder.png",
    email: "dorothy@gmail.com",
    password: bcrypt.hashSync("123456"),
    phone: "708-628-3122",
    role: "Admin",
    joiningData: new Date()
  },
  {
    name:'Alice B. Porter',
    image: "https://res.cloudinary.com/PLACEHOLDER/image/upload/v1/shofy/seed/placeholder.png",
    email: "porter@gmail.com",
    password: bcrypt.hashSync("123456"),
    phone: "708-628-3122",
    role: "Admin",
    joiningData: new Date()
  },
  {
    name:'Corrie H. Cates',
    image: "https://res.cloudinary.com/PLACEHOLDER/image/upload/v1/shofy/seed/placeholder.png",
    email: "corrie@gmail.com",
    password: bcrypt.hashSync("123456"),
    phone: "708-628-3122",
    role: "Admin",
    joiningData: new Date()
  },
  {
    name:'Shawn E. Palmer',
    image: "https://res.cloudinary.com/PLACEHOLDER/image/upload/v1/shofy/seed/placeholder.png",
    email: "palmer@gmail.com",
    password: bcrypt.hashSync("123456"),
    phone: "902-628-3122",
    role: "CEO",
    joiningData: new Date()
  },
  {
    name:'Stacey J. Meikle',
    image: "https://res.cloudinary.com/PLACEHOLDER/image/upload/v1/shofy/seed/placeholder.png",
    email: "meikle@gmail.com",
    password: bcrypt.hashSync("123456"),
    phone: "102-628-3122",
    role: "Manager",
    joiningData: new Date()
  }
];

module.exports = admins;
