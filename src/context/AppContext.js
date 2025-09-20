import React, { createContext, useContext, useReducer, useEffect } from 'react';

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
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }]
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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ecommerce_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        cartData.forEach(item => {
          dispatch({ type: actionTypes.ADD_TO_CART, payload: item });
        });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('ecommerce_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // Action creators
  const addToCart = (product) => {
    dispatch({ type: actionTypes.ADD_TO_CART, payload: product });
  };

  const updateCartItem = (id, quantity) => {
    dispatch({ type: actionTypes.UPDATE_CART_ITEM, payload: { id, quantity } });
  };

  const removeFromCart = (id) => {
    dispatch({ type: actionTypes.REMOVE_FROM_CART, payload: id });
  };

  const clearCart = () => {
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
  const cartTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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