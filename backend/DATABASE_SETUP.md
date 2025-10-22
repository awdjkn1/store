# PostgreSQL Database Setup Guide

This guide explains how to set up and use the PostgreSQL database for the LEGO E-Commerce Store.

## Prerequisites

1. **PostgreSQL installed**: Make sure PostgreSQL is installed on your system
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

2. **Node.js dependencies**: Make sure all npm packages are installed
   ```bash
   npm install
   ```

## Database Configuration

The PostgreSQL database configuration is managed through environment variables in `backend/.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=lego_store
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
NODE_ENV=development
```

Update these values according to your PostgreSQL setup.

## Database Schema

The database consists of the following tables:

### 1. **users**
- Stores user account information
- Fields: id, name, email, password (hashed), role (user/admin), is_active
- Passwords are automatically hashed using bcrypt

### 2. **products**
- Stores LEGO product information
- Fields: id, name, description, price, lego_pieces, category, featured, in_stock, stock_quantity
- Indexed on name, category, and featured fields

### 3. **product_images**
- Stores product images (one-to-many relationship with products)
- Fields: id, product_id, image_url, is_primary, display_order, alt_text
- Each product can have multiple images

### 4. **orders**
- Stores customer orders
- Fields: id, user_id, order_number, status, total_amount, shipping_address, billing_address, payment_method, payment_status, notes, shipped_at, delivered_at
- Status options: pending, processing, shipped, delivered, cancelled
- Addresses stored as JSONB for flexibility

### 5. **order_items**
- Stores individual items in each order
- Fields: id, order_id, product_id, quantity, price_at_purchase, subtotal
- Links orders to products with quantity and pricing information

### 6. **reviews**
- Stores product reviews by users
- Fields: id, product_id, user_id, rating (1-5), title, comment, is_verified_purchase, helpful_count
- Allows customers to rate and review products

## Setup Instructions

### Option 1: Complete Setup (Recommended)

Run the complete setup script that initializes the database and seeds it with product data:

```bash
node backend/scripts/setupDatabase.js
```

This will:
1. Create all database tables
2. Set up relationships and indexes
3. Seed the database with LEGO products from the spreadsheet

### Option 2: Step-by-Step Setup

#### Step 1: Initialize Database Tables

```bash
node backend/scripts/initDatabase.js
```

This creates all tables and their relationships.

#### Step 2: Seed Product Data

```bash
node backend/scripts/seedProducts.js
```

This populates the products table with LEGO sets from the spreadsheet.

## Database Models

All models are defined using Sequelize ORM in the `backend/models/` directory:

- `UserPG.js` - User model with password hashing
- `Product.js` - Product model
- `ProductImage.js` - Product image model
- `Order.js` - Order model
- `OrderItem.js` - Order item model
- `Review.js` - Review model
- `index.js` - Exports all models with relationships defined

## Usage in Backend

To use the database models in your backend code:

```javascript
const { User, Product, Order, Review } = require('./models');

// Example: Get all products with their images
const products = await Product.findAll({
  include: [{ 
    model: ProductImage, 
    as: 'images' 
  }]
});

// Example: Create a new order
const order = await Order.create({
  userId: user.id,
  orderNumber: 'ORD-' + Date.now(),
  totalAmount: 150.00,
  shippingAddress: { /* address object */ },
  paymentMethod: 'credit_card',
  status: 'pending'
});
```

## Product Data

The initial seed includes 10 LEGO products from the provided spreadsheet:

1. Porsche 911 RSR (1,580 pieces) - $50
2. Lego Batmobile Tumbler (2,049 pieces) - $150
3. LEGO Titanic (9,090 pieces) - $100
4. LEGO Technic 42096 Porsche 911 RSR (1,580 pieces) - $50
5. LEGO Peugeot 9X8 24H Le Mans (1,775 pieces) - $50
6. Lego Marvel Avengers Tower (5,201 pieces) - $75
7. LEGO Technic Bugatti Chiron (3,599 pieces) - $70
8. Lego Star Wars AT-AT (6,785 pieces) - $200
9. LEGO Star Wars Sandcrawler (3,296 pieces) - $100
10. LEGO Ferrari Daytona SP3 (3,778 pieces) - $75

## Database Management

### Reset Database

To reset and recreate all tables (WARNING: This will delete all data):

```javascript
await sequelize.sync({ force: true });
```

### Update Database Schema

To update tables to match model changes without losing data:

```javascript
await sequelize.sync({ alter: true });
```

### Backup Database

```bash
pg_dump -U postgres lego_store > backup.sql
```

### Restore Database

```bash
psql -U postgres lego_store < backup.sql
```

## Testing the Connection

To test if the database connection is working:

```javascript
const { testConnection } = require('./config/database');
await testConnection();
```

## Troubleshooting

### Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check PostgreSQL service:
   ```bash
   # On Linux/Mac
   sudo service postgresql status
   
   # On Windows
   pg_ctl status
   ```

3. Verify credentials and database exist:
   ```bash
   psql -U postgres -l
   ```

### Common Errors

- **"database does not exist"**: Create the database first:
  ```sql
  CREATE DATABASE lego_store;
  ```

- **"password authentication failed"**: Update your `.env` file with correct PostgreSQL credentials

- **"Connection refused"**: Make sure PostgreSQL is running and listening on the correct port

## Next Steps

1. Configure your PostgreSQL instance
2. Update `.env` with your database credentials
3. Run `node backend/scripts/setupDatabase.js`
4. Start developing your e-commerce backend!

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [LEGO Product Data Source](../lego%20spreadsheet.xlsx)
