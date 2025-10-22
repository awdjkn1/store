const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { verifyJWT } = require('./middlewares/auth');
const adminRoutes = require('./routes/admin');
const productsRoutes = require('./routes/products');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);

// Example protected route
app.get('/api/profile', verifyJWT, (req, res) => {
  res.json({ user: req.user });
});

module.exports = app;
