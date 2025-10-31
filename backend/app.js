const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { verifyJWT } = require('./middlewares/auth');

const adminRoutes = require('./routes/admin/index');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const invoicesRoutes = require('./routes/invoices');
const checkoutRoutes = require('./routes/checkout');
const reviewsRoutes = require('./routes/reviews');
const webhooksRoutes = require('./routes/webhooks');

const app = express();

const path = require('path');

app.use(morgan('dev'));
// capture raw request body for webhook signature verification while still
// allowing express.json() to parse JSON bodies for normal routes.
app.use(express.json({
  verify: (req, res, buf) => {
    // store raw buffer on request for routes that need exact bytes (webhooks)
    Object.defineProperty(req, 'rawBody', {
      value: buf,
      writable: false
    });
  }
}));
app.use(cookieParser());
// CORS: allow a single origin or comma-separated list via CLIENT_ORIGIN.
// In non-production environments, allow all origins for convenience (only for dev previews).
const clientOriginEnv = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
let allowedOrigins = clientOriginEnv.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like curl/postman) or if in dev allow all
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Serve uploaded files from /public/uploads at /uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Serve placeholder (and other public assets) directly from the backend so the file
// is available at http://localhost:5000/placeholder.svg in restricted dev envs.
app.get('/placeholder.svg', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'placeholder.svg'));
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Example protected route
app.get('/api/profile', verifyJWT, (req, res) => {
  res.json({ user: req.user });
});


// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, '..', 'build')));

// SPA fallback: serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

module.exports = app;
