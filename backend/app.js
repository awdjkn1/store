const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { verifyJWT } = require('./middlewares/auth');

const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/product');

const app = express();

const path = require('path');

app.use(morgan('dev'));
app.use(express.json());
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

// Example protected route
app.get('/api/profile', verifyJWT, (req, res) => {
  res.json({ user: req.user });
});

module.exports = app;
