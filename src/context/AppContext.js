import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket } from '../utils/socket';
import { useToast } from './ToastContext';

const AppContext = createContext();

// Action types
const actionTypes = {
  ADD_TO_CART: 'ADD_TO_CART',
  UPDATE_CART_ITEM: 'UPDATE_CART_ITEM',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  CLEAR_CART: 'CLEAR_CART',
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_REVIEWS: 'SET_REVIEWS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_FILTERS: 'SET_FILTERS',
  TOGGLE_CART: 'TOGGLE_CART',
  SET_LOADING: 'SET_LOADING'
};

// Additional action to set cart from server
actionTypes.SET_CART = 'SET_CART';

// Initial state
const initialState = {
  cart: [],
  products: [],
  reviews: [],
  searchQuery: '',
  filters: {
    category: '',
    priceRange: [0, 1000],
    rating: 0
  },
  showCart: false,
  loading: false
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TO_CART:
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      const addQty = action.payload.quantity ? Number(action.payload.quantity) : 1;
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + addQty }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: addQty }]
      };

    case actionTypes.UPDATE_CART_ITEM:
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.id !== action.payload.id)
        };
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case actionTypes.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };

    case actionTypes.CLEAR_CART:
      return {
        ...state,
        cart: []
      };

    case actionTypes.SET_CART:
      // Normalize server cart items into the app's expected shape
      return {
        ...state,
        cart: (action.payload || []).map(item => {
          // server may return fields: cart_item_id, product_id, title, price_shipping_included, image, quantity
          const cartItemId = item.cart_item_id || item.id;
          const prodId = item.product_id || item.productId || item.productId;
          const title = item.title || item.name || item.product_name || '';
          const priceVal = Number(item.price_shipping_included ?? item.price ?? 0) || 0;
          return {
            // id is the cart item id (used for update/delete)
            id: cartItemId,
            // keep product id for navigation
            product_id: prodId,
            // display name
            name: title,
            // canonical numeric price (used by UI)
            price_shipping_included: Number(item.price_shipping_included ?? item.price ?? 0),
            price: priceVal,
            // image may be filename or URL depending on backend
            image: item.image || item.images?.[0] || null,
            quantity: Number(item.quantity) || 1
          };
        })
      };

    case actionTypes.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload
      };

    case actionTypes.SET_REVIEWS:
      return {
        ...state,
        reviews: action.payload
      };

    case actionTypes.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload
      };

    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case actionTypes.TOGGLE_CART:
      return {
        ...state,
        showCart: !state.showCart
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();
  // Hook for showing toasts (must be called at top-level of component)
  const { addToast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      const savedCart = localStorage.getItem('ecommerce_cart');
      if (!savedCart) return;
      try {
        const cartData = JSON.parse(savedCart) || [];
        // Enrich items missing price_shipping_included by fetching product details
        const enriched = await Promise.all(cartData.map(async (item) => {
          if (item.price_shipping_included || item.price) return item;
          try {
            const res = await fetch(`/api/products/${encodeURIComponent(item.id)}`);
            if (!res.ok) return item;
            const data = await res.json();
            const prod = data.product || data;
            return { ...item, price_shipping_included: prod.price_shipping_included || prod.price };
          } catch (e) {
            return item;
          }
        }));
        enriched.forEach(item => dispatch({ type: actionTypes.ADD_TO_CART, payload: item }));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('ecommerce_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // When a user logs in, sync local cart to server and replace local cart with server cart
  useEffect(() => {
    const syncCart = async () => {
      if (!user) return;
      try {
        // Merge local cart into server cart using bulk merge endpoint, but only once per user.
        // Otherwise saved server cart in localStorage will be re-merged on subsequent logins and double quantities.
        const localCartRaw = localStorage.getItem('ecommerce_cart');
        const lastMergedUser = localStorage.getItem('ecommerce_cart_last_merged_user');
        if (localCartRaw && lastMergedUser !== user.id) {
          try {
            const localCart = JSON.parse(localCartRaw) || [];
            if (localCart.length > 0) {
              const mergeItems = localCart.map(item => ({ product_id: item.product_id || item.id, quantity: item.quantity || 1 }));
              await fetch('/api/cart/merge', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: mergeItems })
              });
            }
          } catch (e) {
            console.error('Failed to merge local cart safely:', e);
          }
          // Mark that we've merged for this user so we don't merge again on subsequent logins
          try { localStorage.setItem('ecommerce_cart_last_merged_user', user.id); } catch (e) {}
        }

        // Fetch authoritative cart from server (cookie-based auth)
        const res = await fetch('/api/cart', {
          method: 'GET',
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.cart) {
            dispatch({ type: actionTypes.SET_CART, payload: data.cart });
          }
        }
      } catch (e) {
        console.error('Error syncing cart with server on login:', e);
      }
    };

    syncCart();
    // Intentionally depend on user only; we want to run this once when user becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Listen for server-side payment updates and clear cart when a matching confirmed payment is received
  useEffect(() => {
    try {
      const socket = connectSocket();

      function onPaymentUpdate(payload) {
        try {
          if (!payload) return;

          // Determine canonical order id and status from payload
          const orderId = payload.order_id || payload.orderId || (payload.payment && (payload.payment.order_id || payload.payment.orderId)) || (payload.metadata && payload.metadata.order_id) || null;
          const status = (payload.status || payload.state || (payload.payment && payload.payment.status) || '').toString().toLowerCase();
          const confirmedStates = ['confirmed', 'paid', 'completed', 'succeeded', 'success'];

          // If order id present, only act when it matches the last locally-created order id
          const localOrderId = (() => {
            try { return localStorage.getItem('last_local_order_id'); } catch (e) { return null; }
          })();

          // Show a toast for all payment updates (useful), but only clear cart for matching order id
          try { addToast({ title: 'Payment update', message: `Order ${orderId || '(unknown)'} status: ${status}` }); } catch (e) {}

          if (confirmedStates.includes(status) && user && orderId && localOrderId && orderId === localOrderId) {
            // Clear local and server cart
            dispatch({ type: actionTypes.CLEAR_CART });
            try { localStorage.removeItem('last_local_order_id'); } catch (e) {}
          }
        } catch (e) {
          console.warn('Error handling payment.update socket payload in AppContext:', e && e.message ? e.message : e);
        }
      }

      socket.on('payment.update', onPaymentUpdate);
      return () => {
        try { socket.off('payment.update', onPaymentUpdate); } catch (e) {}
      };
    } catch (e) {
      // socket not available or other failure — ignore
    }
  }, [user]);

  // Action creators
  const addToCart = async (product) => {
    // If user is logged in, call server API to add and sync (use cookie-based auth)
    if (user) {
      try {
        const prodId = product.product_id || product.id;
        const res = await fetch('/api/cart', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: prodId, quantity: product.quantity || 1 })
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          dispatch({ type: actionTypes.SET_CART, payload: data.cart });
        }
      } catch (e) {
        console.error('Error adding to cart (server):', e);
      }
      return;
    }

    // Fallback: local-only cart
    dispatch({ type: actionTypes.ADD_TO_CART, payload: product });
  };

  const updateCartItem = async (id, quantity) => {
    if (user) {
      try {
        const res = await fetch(`/api/cart/${encodeURIComponent(id)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity })
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          dispatch({ type: actionTypes.SET_CART, payload: data.cart });
        }
      } catch (e) {
        console.error('Error updating cart item (server):', e);
      }
      return;
    }

    dispatch({ type: actionTypes.UPDATE_CART_ITEM, payload: { id, quantity } });
  };

  const removeFromCart = async (id) => {
    if (user) {
      try {
        const res = await fetch(`/api/cart/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          dispatch({ type: actionTypes.SET_CART, payload: data.cart });
        }
      } catch (e) {
        console.error('Error removing cart item (server):', e);
      }
      return;
    }

    dispatch({ type: actionTypes.REMOVE_FROM_CART, payload: id });
  };

  const clearCart = async () => {
    if (user) {
      try {
        const res = await fetch('/api/cart', {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          dispatch({ type: actionTypes.SET_CART, payload: data.cart || [] });
        }
      } catch (e) {
        console.error('Error clearing cart (server):', e);
      }
      return;
    }

    dispatch({ type: actionTypes.CLEAR_CART });
  };

  const setProducts = (products) => {
    dispatch({ type: actionTypes.SET_PRODUCTS, payload: products });
  };

  const setReviews = (reviews) => {
    dispatch({ type: actionTypes.SET_REVIEWS, payload: reviews });
  };

  const setSearchQuery = (query) => {
    dispatch({ type: actionTypes.SET_SEARCH_QUERY, payload: query });
  };

  const setFilters = (filters) => {
    dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
  };

  const toggleCart = () => {
    dispatch({ type: actionTypes.TOGGLE_CART });
  };

  const setLoading = (loading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: loading });
  };

  // Computed values
  const cartTotal = state.cart.reduce((sum, item) => sum + ((item.price_shipping_included || item.price || 0) * item.quantity), 0);
  const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setProducts,
    setReviews,
    setSearchQuery,
    setFilters,
    toggleCart,
    setLoading,
    cartTotal,
    cartItemCount
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};