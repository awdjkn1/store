import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import ContactButton from './components/common/ContactButton';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import UserPage from './pages/UserPage';
import './styles/globals.css';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppProvider>
          <Router>
          <div style={{
            backgroundColor: '#1a1a1a',
            minHeight: '100vh',
            color: '#ffffff'
          }}>
            <Header />
            {/* Sample persistent Contact button to demonstrate .contact-us-button placement */}
            {/* Replaced with ContactButton component to show email on hover */}
            <ContactButton />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user" element={<UserPage />} />
            </Routes>
          </div>
          </Router>
        </AppProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;