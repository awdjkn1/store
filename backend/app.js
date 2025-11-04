
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// --- CORS FIX: move to top, explicit preflight, hardcoded whitelist ---
const allowedOrigins = [
  'https://shenzhenbricks-com.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
// Handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));
// Use CORS for all requests
app.use(cors(corsOptions));

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

const path = require('path');

app.use(morgan('dev'));
// --- IMPORTANT: mount webhook routes BEFORE the global JSON parser so
// that they may use express.raw() and receive the untouched request body
// for signature verification. The webhook route itself uses express.raw().
app.use('/api/webhooks', webhooksRoutes);

// capture raw request body for routes that still need the buffer while
// allowing express.json() to parse JSON bodies for the remaining routes.
app.use(express.json({
  verify: (req, res, buf) => {
    // store raw buffer on request for routes that need exact bytes (non-webhook fallback)
    try {
      Object.defineProperty(req, 'rawBody', {
        value: buf,
        writable: false
      });
    } catch (e) {
      // ignore non-fatal defineProperty errors
    }
  }
}));
app.use(cookieParser());
// ...existing code...

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
