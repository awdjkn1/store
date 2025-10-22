# E-Commerce Store

This is a modern React-based e-commerce store application for selling LEGO sets. It features product browsing, cart management, checkout, reviews, and an admin dashboard for product management.

## 🆕 PostgreSQL Database

The application now includes a fully implemented PostgreSQL database with 10 LEGO products seeded from the provided spreadsheet.

**Quick Start:**
```bash
# Install dependencies
npm install

# Set up PostgreSQL database (using Docker)
docker-compose up -d
npm run db:setup

# Or use the quick start guide
```

📖 **Documentation:**
- [**POSTGRES_QUICKSTART.md**](POSTGRES_QUICKSTART.md) - Quick start guide for database setup
- [**IMPLEMENTATION_SUMMARY.md**](IMPLEMENTATION_SUMMARY.md) - Complete implementation details
- [**DATABASE_SCHEMA.md**](DATABASE_SCHEMA.md) - Database schema and relationships
- [**backend/DATABASE_SETUP.md**](backend/DATABASE_SETUP.md) - Detailed setup instructions

## Features

### Frontend
- Product catalog with filters and search
- Product detail pages with image galleries and reviews
- Shopping cart with drawer and summary
- Checkout flow with shipping, payment, and order confirmation
- User reviews and ratings
- Admin tools for managing products and orders
- Responsive design and modern UI

### Backend (PostgreSQL)
- RESTful API for products with CRUD operations
- User authentication with JWT
- Order management system
- Product reviews and ratings
- Database with 6 tables and proper relationships
- 10 LEGO products pre-seeded from Excel spreadsheet

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+ (or use Docker)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database:**
   
   Using Docker (recommended):
   ```bash
   docker-compose up -d
   npm run db:setup
   ```
   
   Or manually:
   ```bash
   # See POSTGRES_QUICKSTART.md for manual setup
   npm run db:setup
   ```

3. **Start the development servers:**
   
   Frontend:
   ```bash
   npm start
   ```
   
   Backend:
   ```bash
   node backend/server.js
   ```

4. **Test the setup:**
   ```bash
   npm run db:test
   ```

## Database Commands

```bash
npm run db:setup   # Complete database setup (init + seed)
npm run db:init    # Initialize database tables
npm run db:seed    # Seed product data
npm run db:test    # Test database connection
```

## API Endpoints

### Products
- `GET /api/products` - Get all products (with pagination)
- `GET /api/products/:id` - Get single product
- `GET /api/products/search?q=query` - Search products
- Filter by: `?category=Technic`, `?featured=true`, `?minPrice=50&maxPrice=150`

See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for complete API documentation.

## Project Structure

### Frontend
- `src/components/` - UI components grouped by feature
- `src/pages/` - Top-level pages/routes
- `src/context/` - React context providers
- `src/services/` - API and business logic
- `src/data/` - Sample/mock data
- `src/hooks/` - Custom React hooks
- `src/styles/` - Global and variables CSS
- `src/utils/` - Utility functions

### Backend
- `backend/config/` - Database configuration
- `backend/models/` - Sequelize models (User, Product, Order, Review, etc.)
- `backend/controllers/` - API controllers
- `backend/routes/` - API routes
- `backend/scripts/` - Database setup and utility scripts
- `backend/middlewares/` - Authentication and authorization

## Database Schema

The PostgreSQL database includes:
- **users** - User accounts with authentication
- **products** - LEGO products (10 pre-seeded)
- **product_images** - Multiple images per product
- **orders** - Customer orders
- **order_items** - Individual items in orders
- **reviews** - Product reviews and ratings

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for detailed schema and relationships.

## Run Tests

Frontend tests:
```bash
npm test
```

Database tests:
```bash
npm run db:test
```

API tests:
```bash
node backend/scripts/testProductsAPI.js
```

## License

MIT