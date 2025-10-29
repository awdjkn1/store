# Admin Login (Preview/Dev)

To log in as admin in preview/dev environments:

1. Run this command in your backend terminal:
	```bash
	curl -s -X POST http://localhost:5000/api/admin/auth/login \
	  -H "Content-Type: application/json" \
	  -d '{"username":"admin","password":"admin1234"}'
	```
	Copy the value of `token` from the output.

2. In your preview browser, open DevTools → Console and paste:
	```js
	localStorage.setItem('admin_token', '<PASTE_TOKEN_HERE>');
	localStorage.setItem('admin_user', JSON.stringify({ id: 1, username: 'admin' }));
	location.reload();
	```
	Replace `<PASTE_TOKEN_HERE>` with the token you copied.

## Security

- To disable auto-seeding the default admin user in production, set `ADMIN_AUTOSEED=false` in your backend `.env`.
- Always change the default admin password before deploying publicly.
# E-Commerce Store

This is a modern React-based e-commerce store application. It features product browsing, cart management, checkout, reviews, and an admin dashboard for product management.

## Features

- Product catalog with filters and search
- Product detail pages with image galleries and reviews
- Shopping cart with drawer and summary
- Checkout flow with shipping, payment, and order confirmation
- User reviews and ratings
- Admin tools for managing products and orders
- Responsive design and modern UI

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Run tests:

```bash
npm test
```

## Project Structure

- `src/components/` - UI components grouped by feature
- `src/pages/` - Top-level pages/routes
- `src/context/` - React context providers
- `src/services/` - API and business logic
- `src/data/` - Sample/mock data
- `src/hooks/` - Custom React hooks
- `src/styles/` - Global and variables CSS
- `src/utils/` - Utility functions

## License

MIT