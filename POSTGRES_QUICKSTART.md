# PostgreSQL Database Quick Start

This guide will help you quickly set up the PostgreSQL database for the LEGO E-Commerce Store.

## Quick Setup with Docker (Recommended)

The easiest way to get started is using Docker Compose:

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Wait for PostgreSQL to be ready (about 10 seconds)
# Then run the setup script
node backend/scripts/setupDatabase.js
```

This will:
- Start PostgreSQL on `localhost:5432`
- Start pgAdmin on `http://localhost:5050` (login: admin@legostore.com / admin)
- Create all database tables
- Seed initial product data from the Excel spreadsheet

## Manual Setup (Without Docker)

If you prefer to install PostgreSQL manually:

1. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/
   - Or use your package manager (apt, brew, etc.)

2. **Create the database**
   ```bash
   psql -U postgres
   CREATE DATABASE lego_store;
   \q
   ```

3. **Configure environment variables**
   - Update `backend/.env` with your PostgreSQL credentials
   - Default values work if you used the standard PostgreSQL installation

4. **Run the setup script**
   ```bash
   node backend/scripts/setupDatabase.js
   ```

## Verify Setup

Test the database connection:

```bash
node backend/scripts/testDatabase.js
```

Expected output:
```
✓ PostgreSQL connection has been established successfully.
✓ Found 10 products in database
✓ All tests passed successfully!
```

## Database Access

### Using pgAdmin (if using Docker)
- URL: http://localhost:5050
- Email: admin@legostore.com
- Password: admin

To connect to the database in pgAdmin:
1. Right-click "Servers" → Create → Server
2. Name: LEGO Store
3. Connection tab:
   - Host: postgres (or localhost if not using Docker)
   - Port: 5432
   - Database: lego_store
   - Username: postgres
   - Password: postgres

### Using psql (Command Line)
```bash
psql -U postgres -d lego_store
```

Common psql commands:
- `\dt` - List all tables
- `\d+ products` - Describe products table
- `SELECT * FROM products;` - View all products
- `\q` - Quit

## What's Included

The database setup includes:

### Tables
- **users** - User accounts with authentication
- **products** - LEGO products with details
- **product_images** - Multiple images per product
- **orders** - Customer orders
- **order_items** - Individual items in orders
- **reviews** - Product reviews and ratings

### Initial Data
10 LEGO products are seeded from the Excel spreadsheet:
- Porsche 911 RSR ($50, 1,580 pieces)
- Batmobile Tumbler ($150, 2,049 pieces)
- Titanic ($100, 9,090 pieces)
- And 7 more...

## Next Steps

1. Start your backend server
2. Test the API endpoints
3. Connect your frontend to PostgreSQL backend

## Troubleshooting

**"Connection refused"**
- Make sure PostgreSQL is running: `docker-compose ps` or check your PostgreSQL service

**"Database does not exist"**
- Run: `docker-compose down -v && docker-compose up -d` to recreate everything

**"Permission denied"**
- Check your PostgreSQL credentials in `backend/.env`

## Documentation

For detailed information, see:
- [Complete Database Setup Guide](backend/DATABASE_SETUP.md)
- [API Documentation](backend/API_DOCUMENTATION.md) (coming soon)

## Clean Up

To stop and remove everything:
```bash
docker-compose down -v
```

Note: The `-v` flag removes volumes (data will be lost). Omit it to preserve data.
