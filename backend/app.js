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
const checkoutRoutes = require('./routes/checkout');

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
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
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
app.use('/api/checkout', checkoutRoutes);

// Example protected route
app.get('/api/profile', verifyJWT, (req, res) => {
  res.json({ user: req.user });
});

module.exports = app;
