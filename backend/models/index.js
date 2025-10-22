const { sequelize } = require('../config/database');

// Import all models
const User = require('./UserPG');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');

// Define model associations

// Product -> ProductImage (one-to-many)
Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  as: 'images',
  onDelete: 'CASCADE'
});
ProductImage.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// User -> Order (one-to-many)
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders'
});
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Order -> OrderItem (one-to-many)
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE'
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// Product -> OrderItem (one-to-many)
Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'orderItems'
});
OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Product -> Review (one-to-many)
Product.hasMany(Review, {
  foreignKey: 'product_id',
  as: 'reviews',
  onDelete: 'CASCADE'
});
Review.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// User -> Review (one-to-many)
User.hasMany(Review, {
  foreignKey: 'user_id',
  as: 'reviews',
  onDelete: 'CASCADE'
});
Review.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Product,
  ProductImage,
  Order,
  OrderItem,
  Review
};
