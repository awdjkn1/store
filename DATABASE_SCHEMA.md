# Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          LEGO E-Commerce Database Schema                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       USERS          │
├──────────────────────┤
│ 🔑 id (UUID)         │
│    name              │
│    email (unique)    │
│    password (hashed) │
│    role              │
│    is_active         │
│    created_at        │
│    updated_at        │
└──────────────────────┘
         │
         │ 1
         │
         │ N
┌────────▼──────────────┐
│      ORDERS           │
├───────────────────────┤
│ 🔑 id (UUID)          │
│ 🔗 user_id            │
│    order_number       │
│    status             │
│    total_amount       │
│    shipping_address   │
│    billing_address    │
│    payment_method     │
│    payment_status     │
│    notes              │
│    shipped_at         │
│    delivered_at       │
│    created_at         │
│    updated_at         │
└───────────────────────┘
         │
         │ 1
         │
         │ N
┌────────▼──────────────┐              ┌──────────────────────┐
│    ORDER_ITEMS        │              │      PRODUCTS        │
├───────────────────────┤              ├──────────────────────┤
│ 🔑 id (UUID)          │              │ 🔑 id (UUID)         │
│ 🔗 order_id           │              │    name              │
│ 🔗 product_id         │◄─────────────┤    description       │
│    quantity           │      N   1   │    price             │
│    price_at_purchase  │              │    lego_pieces       │
│    subtotal           │              │    category          │
│    created_at         │              │    featured          │
│    updated_at         │              │    in_stock          │
└───────────────────────┘              │    stock_quantity    │
                                       │    created_at        │
                                       │    updated_at        │
                                       └──────────────────────┘
                                                │
                                                │ 1
                                                │
                                                │ N
                                       ┌────────▼──────────────┐
                                       │   PRODUCT_IMAGES      │
                                       ├───────────────────────┤
                                       │ 🔑 id (UUID)          │
                                       │ 🔗 product_id         │
                                       │    image_url          │
                                       │    is_primary         │
                                       │    display_order      │
                                       │    alt_text           │
                                       │    created_at         │
                                       │    updated_at         │
                                       └───────────────────────┘

         ┌──────────────────────┐
         │       USERS          │
         │  (from above)        │
         └──────────────────────┘
                  │
                  │ 1
                  │
                  │ N
         ┌────────▼──────────────┐
         │      REVIEWS          │
         ├───────────────────────┤
         │ 🔑 id (UUID)          │
         │ 🔗 product_id         │◄────────┐
         │ 🔗 user_id            │         │
         │    rating (1-5)       │         │ N
         │    title              │         │
         │    comment            │         │ 1
         │    is_verified_purchase│       │
         │    helpful_count      │  ┌──────┴────────────────┐
         │    created_at         │  │      PRODUCTS         │
         │    updated_at         │  │   (from above)        │
         └───────────────────────┘  └───────────────────────┘


Legend:
  🔑 = Primary Key (UUID)
  🔗 = Foreign Key (UUID)
  1  = One relationship
  N  = Many relationship
```

## Relationships Summary

### One-to-Many Relationships

1. **User → Orders**
   - One user can have many orders
   - Foreign Key: `orders.user_id` → `users.id`
   - Delete: RESTRICT (can't delete user with orders)

2. **User → Reviews**
   - One user can write many reviews
   - Foreign Key: `reviews.user_id` → `users.id`
   - Delete: CASCADE (reviews deleted when user is deleted)

3. **Product → Product Images**
   - One product can have many images
   - Foreign Key: `product_images.product_id` → `products.id`
   - Delete: CASCADE (images deleted when product is deleted)

4. **Product → Order Items**
   - One product can appear in many order items
   - Foreign Key: `order_items.product_id` → `products.id`
   - Delete: RESTRICT (can't delete product in existing orders)

5. **Product → Reviews**
   - One product can have many reviews
   - Foreign Key: `reviews.product_id` → `products.id`
   - Delete: CASCADE (reviews deleted when product is deleted)

6. **Order → Order Items**
   - One order contains many order items
   - Foreign Key: `order_items.order_id` → `orders.id`
   - Delete: CASCADE (items deleted when order is deleted)

## Table Constraints & Features

### Users
- **Unique Constraint**: email
- **Index**: email (for fast authentication lookups)
- **Hook**: Password auto-hashing on create/update
- **Method**: comparePassword() for authentication

### Products
- **Indexes**: name, category, featured
- **Validation**: price >= 0, stock_quantity >= 0
- **Use Case**: Fast filtering by category and featured status

### Product Images
- **Indexes**: product_id, is_primary
- **Use Case**: Quick retrieval of product images, especially primary image

### Orders
- **Unique Constraint**: order_number
- **Indexes**: user_id, order_number, status, created_at
- **JSONB Fields**: shipping_address, billing_address (flexible structure)
- **Use Case**: Fast order lookup and status filtering

### Order Items
- **Indexes**: order_id, product_id
- **Validation**: quantity >= 1, prices >= 0
- **Use Case**: Quick retrieval of items in an order

### Reviews
- **Indexes**: product_id, user_id, rating
- **Validation**: rating between 1 and 5, helpful_count >= 0
- **Use Case**: Display reviews for products, filter by rating

## Data Types Used

- **UUID**: All primary keys and foreign keys (better for distributed systems)
- **STRING**: Names, emails, URLs (variable length up to 255 chars)
- **TEXT**: Descriptions, comments (unlimited length)
- **DECIMAL(10,2)**: Prices and monetary values (exact precision)
- **INTEGER**: Quantities, counts, piece counts
- **BOOLEAN**: Flags (in_stock, featured, is_primary, etc.)
- **ENUM**: Constrained choices (status, role, payment_status)
- **JSONB**: Flexible structured data (addresses)
- **TIMESTAMP**: Date/time tracking (created_at, updated_at, shipped_at, etc.)

## Indexes Strategy

### Primary Indexes (Automatic)
- All primary keys (id fields) - UUID

### Foreign Key Indexes (Automatic)
- All foreign key fields for join performance

### Custom Indexes
1. **products**
   - `name` - For product search
   - `category` - For category filtering
   - `featured` - For featured products page

2. **orders**
   - `order_number` (unique) - For order lookup
   - `status` - For order filtering by status
   - `created_at` - For date-based queries

3. **product_images**
   - `is_primary` - For quick primary image retrieval

4. **reviews**
   - `rating` - For filtering by rating

## Query Performance Considerations

### Optimized Queries
```sql
-- Get products by category (uses index)
SELECT * FROM products WHERE category = 'Technic';

-- Get featured products (uses index)
SELECT * FROM products WHERE featured = true;

-- Find order by order number (uses unique index)
SELECT * FROM orders WHERE order_number = 'ORD-123456';

-- Get user's orders (uses foreign key index)
SELECT * FROM orders WHERE user_id = 'uuid...';

-- Get product images (uses foreign key index)
SELECT * FROM product_images WHERE product_id = 'uuid...';
```

### Join Examples
```sql
-- Get order with items and product details
SELECT o.*, oi.*, p.name, p.price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.user_id = 'uuid...';

-- Get products with their reviews
SELECT p.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id;
```

## Scalability Considerations

1. **UUID Primary Keys**: Better for distributed systems and prevents ID conflicts
2. **Connection Pooling**: Max 5 concurrent connections configured
3. **JSONB for Addresses**: Flexible schema for international addresses
4. **Indexed Foreign Keys**: Fast joins across tables
5. **Cascade Deletes**: Automatic cleanup of orphaned records
6. **Timestamp Tracking**: Audit trail for all records

## Future Enhancements

### Potential Additional Tables
- **shopping_carts** - Store user's cart before checkout
- **product_categories** - Hierarchical category structure
- **inventory_logs** - Track stock changes
- **wish_lists** - User product wish lists
- **coupons** - Discount codes and promotions
- **shipping_methods** - Different shipping options
- **payment_transactions** - Payment gateway transaction logs
- **notifications** - User notifications history

### Potential Additional Fields
- **products.sku** - Stock Keeping Unit
- **products.weight** - For shipping calculations
- **products.dimensions** - Width, height, depth
- **orders.tracking_number** - Shipping tracking
- **users.phone** - Contact information
- **reviews.helpful_users** - Array of users who found review helpful
