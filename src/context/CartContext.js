import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_COUPON: 'APPLY_COUPON',
  REMOVE_COUPON: 'REMOVE_COUPON',
  SET_SHIPPING: 'SET_SHIPPING',
  LOAD_CART: 'LOAD_CART'
};

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  coupon: null,
  discount: 0,
  shippingMethod: 'standard'
};

// Tax rate (8.25%)
const TAX_RATE = 0.0825;

// Shipping options
const SHIPPING_OPTIONS = {
  standard: { name: 'Standard Shipping', price: 5.99, days: '5-7 business days' },
  express: { name: 'Express Shipping', price: 12.99, days: '2-3 business days' },
  overnight: { name: 'Overnight Shipping', price: 24.99, days: '1 business day' },
  free: { name: 'Free Shipping', price: 0, days: '7-10 business days', minOrder: 50 }
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity = 1, selectedVariant } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => 
          item.id === product.id && 
          JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
      );

      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        const newItem = {
          id: product.id,
          name: product.name,
          price: selectedVariant?.price || product.price,
          originalPrice: product.originalPrice,
          image: selectedVariant?.image || product.images?.[0] || product.image,
          category: product.category,
          quantity,
          selectedVariant,
          addedAt: new Date().toISOString()
        };
        updatedItems = [...state.items, newItem];
      }

      return calculateTotals({ ...state, items: updatedItems });
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const updatedItems = state.items.filter(
        item => !(item.id === action.payload.id && 
                 JSON.stringify(item.selectedVariant) === JSON.stringify(action.payload.selectedVariant))
      );
      return calculateTotals({ ...state, items: updatedItems });
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, selectedVariant, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return cartReducer(state, {
          type: CART_ACTIONS.REMOVE_ITEM,
          payload: { id, selectedVariant }
        });
      }

      const updatedItems = state.items.map(item =>
        item.id === id && JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
          ? { ...item, quantity }
          : item
      );

      return calculateTotals({ ...state, items: updatedItems });
    }

    case CART_ACTIONS.CLEAR_CART:
      return { ...initialState };

    case CART_ACTIONS.APPLY_COUPON: {
      const { coupon } = action.payload;
      const newState = { ...state, coupon };
      return calculateTotals(newState);
    }

    case CART_ACTIONS.REMOVE_COUPON: {
      const newState = { ...state, coupon: null };
      return calculateTotals(newState);
    }

    case CART_ACTIONS.SET_SHIPPING: {
      const newState = { ...state, shippingMethod: action.payload.method };
      return calculateTotals(newState);
    }

    case CART_ACTIONS.LOAD_CART:
      return calculateTotals(action.payload);

    default:
      return state;
  }
};

// Calculate totals helper function
const calculateTotals = (state) => {
  const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate discount
  let discount = 0;
  if (state.coupon) {
    if (state.coupon.type === 'percentage') {
      discount = subtotal * (state.coupon.value / 100);
    } else if (state.coupon.type === 'fixed') {
      discount = Math.min(state.coupon.value, subtotal);
    }
    
    // Apply maximum discount limit if exists
    if (state.coupon.maxDiscount) {
      discount = Math.min(discount, state.coupon.maxDiscount);
    }
  }

  // Calculate shipping
  const shippingOption = SHIPPING_OPTIONS[state.shippingMethod];
  let shipping = shippingOption.price;
  
  // Free shipping logic
  if (shippingOption.minOrder && subtotal >= shippingOption.minOrder) {
    shipping = 0;
  } else if (state.shippingMethod === 'free' && subtotal < shippingOption.minOrder) {
    // If free shipping selected but doesn't meet minimum, default to standard
    shipping = SHIPPING_OPTIONS.standard.price;
  }

  // Calculate tax on subtotal after discount
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * TAX_RATE;
  
  // Calculate final total
  const total = Math.max(0, subtotal - discount + tax + shipping);

  return {
    ...state,
    subtotal: Math.round(subtotal * 100) / 100,
    totalItems,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ecommerce_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('ecommerce_cart', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state]);

  // Action creators
  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product, quantity, selectedVariant }
    });
  };

  const removeFromCart = (id, selectedVariant = null) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { id, selectedVariant }
    });
  };

  const updateQuantity = (id, quantity, selectedVariant = null) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { id, quantity, selectedVariant }
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const applyCoupon = (coupon) => {
    dispatch({
      type: CART_ACTIONS.APPLY_COUPON,
      payload: { coupon }
    });
  };

  const removeCoupon = () => {
    dispatch({ type: CART_ACTIONS.REMOVE_COUPON });
  };

  const setShippingMethod = (method) => {
    dispatch({
      type: CART_ACTIONS.SET_SHIPPING,
      payload: { method }
    });
  };

  // Helper functions
  const getItemCount = (id, selectedVariant = null) => {
    const item = state.items.find(
      item => 
        item.id === id && 
        JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
    );
    return item ? item.quantity : 0;
  };

  const isInCart = (id, selectedVariant = null) => {
    return state.items.some(
      item => 
        item.id === id && 
        JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
    );
  };

  const getCartSummary = () => {
    return {
      itemCount: state.totalItems,
      subtotal: state.subtotal,
      discount: state.discount,
      tax: state.tax,
      shipping: state.shipping,
      total: state.total,
      coupon: state.coupon,
      shippingMethod: state.shippingMethod,
      shippingOption: SHIPPING_OPTIONS[state.shippingMethod]
    };
  };

  const validateCoupon = async (couponCode) => {
    // This would typically make an API call to validate the coupon
    // For now, we'll simulate with some sample coupons
    const validCoupons = {
      'SAVE10': { type: 'percentage', value: 10, minOrder: 25 },
      'SAVE20': { type: 'percentage', value: 20, minOrder: 50, maxDiscount: 30 },
      'NEWUSER': { type: 'fixed', value: 15, minOrder: 30 },
      'FREESHIP': { type: 'shipping', value: 0 }
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        const coupon = validCoupons[couponCode.toUpperCase()];
        if (coupon) {
          // Check minimum order requirement
          if (coupon.minOrder && state.subtotal < coupon.minOrder) {
            resolve({
              valid: false,
              error: `Minimum order of $${coupon.minOrder} required for this coupon`
            });
          } else {
            resolve({
              valid: true,
              coupon: { ...coupon, code: couponCode.toUpperCase() }
            });
          }
        } else {
          resolve({
            valid: false,
            error: 'Invalid coupon code'
          });
        }
      }, 1000); // Simulate API delay
    });
  };

  const contextValue = {
    // State
    cart: state.items,
    cartSummary: getCartSummary(),
    totalItems: state.totalItems,
    isEmpty: state.items.length === 0,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    setShippingMethod,
    
    // Helpers
    getItemCount,
    isInCart,
    validateCoupon,
    
    // Constants
    shippingOptions: SHIPPING_OPTIONS
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;