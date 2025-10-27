import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';  // ✅ Import toast
import 'react-toastify/dist/ReactToastify.css'; // ✅ Import CSS once in your app (or in App.jsx)

const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim();

const resolveAssetBaseUrl = () => {
  const envAsset = (process.env.REACT_APP_ASSET_BASE_URL || '').trim();
  if (envAsset) return envAsset;

  if (apiBaseUrl) {
    return apiBaseUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return '';
};

const assetBaseUrl = resolveAssetBaseUrl();
const placeholderImage = 'https://via.placeholder.com/120?text=No+Image';

const toAbsoluteUrl = (candidate) => {
  if (!candidate) return placeholderImage;
  const url = typeof candidate === 'string' ? candidate : candidate?.url;
  if (!url) return placeholderImage;
  if (/^https?:\/\//i.test(url)) return url;

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;

  if (assetBaseUrl) {
    const normalizedBase = assetBaseUrl.endsWith('/') ? assetBaseUrl.slice(0, -1) : assetBaseUrl;
    return `${normalizedBase}${normalizedPath}`;
  }

  if (typeof window !== 'undefined') {
    const origin = `${window.location.protocol}//${window.location.hostname}:5000`;
    return `${origin}${normalizedPath}`;
  }

  return normalizedPath;
};

const resolveProductImage = (product) => {
  if (!product) return placeholderImage;
  const candidates = [
    product.images?.find((img) => img?.isPrimary),
    ...(product.images || []),
    product.primaryImage,
    product.thumbnail,
    product.imageUrl,
    product.image,
    product.photo
  ].filter(Boolean);

  const first = candidates[0];
  return toAbsoluteUrl(first || product.imageUrl || product.image || product.photo);
};

// Create context
const CartContext = createContext();

// Custom hook to use CartContext
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ethioEcommerce_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('ethioEcommerce_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ Enhanced addToCart function with toast notification
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      let newItems;

      const shippingInfo = product?.shipping ? { ...product.shipping } : {};
      if (shippingInfo.shippingCost === undefined && product?.shippingCost !== undefined) {
        shippingInfo.shippingCost = product.shippingCost;
      }
      if (shippingInfo.freeShipping === undefined && product?.freeShipping !== undefined) {
        shippingInfo.freeShipping = product.freeShipping;
      }

      if (existingItem) {
        newItems = prevItems.map(item =>
          item._id === product._id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                shipping: Object.keys(shippingInfo).length ? shippingInfo : item.shipping
              }
            : item
        );
      } else {
        const resolvedImage = resolveProductImage(product);

        newItems = [
          ...prevItems,
          {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: resolvedImage,
            resolvedImage,
            stock: product.stock,
            quantity: quantity,
            shipping: shippingInfo
          }
        ];
      }

      // ✅ Show toast notification
      toast.success(`${quantity} ${product.name?.en || product.name} added to cart!`, {
        position: "top-right",
        autoClose: 3000,
      });

      return newItems;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item._id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartSummary = () => {
    const subtotal = getCartTotal();
    const shipping = cartItems.reduce((sum, item) => {
      const shippingInfo = item?.shipping || {};
      const freeShipping = shippingInfo.freeShipping ?? item?.freeShipping ?? false;
      if (freeShipping) {
        return sum;
      }

      const itemShippingCost = shippingInfo.shippingCost ?? item?.shippingCost ?? 0;
      const quantity = Math.max(1, item?.quantity || 0);
      return sum + (itemShippingCost * quantity);
    }, 0);

    const total = subtotal + shipping;

    return {
      subtotal,
      shipping,
      total,
      itemsCount: getCartItemsCount()
    };
  };

  const resolveImageForCartItem = (cartItem) => {
    if (cartItem?.resolvedImage) return cartItem.resolvedImage;
    return toAbsoluteUrl(cartItem?.image || cartItem?.images?.[0]);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getCartSummary,
    resolveImageForCartItem,
    loading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
