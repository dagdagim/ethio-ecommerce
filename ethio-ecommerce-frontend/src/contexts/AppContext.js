import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'ETB');
  const [region, setRegion] = useState(localStorage.getItem('region') || 'Addis Ababa');

  // Ethiopian regions for dropdown
  const ethiopianRegions = [
    'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 
    'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 
    'Sidama', 'Somali', 'SNNPR', 'Tigray'
  ];

  // Translations
  const translations = {
    en: {
      welcome: 'Welcome',
      products: 'Products',
      cart: 'Cart',
      login: 'Login',
      logout: 'Logout',
      search: 'Search products...',
      addToCart: 'Add to Cart',
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      checkout: 'Checkout'
    },
    am: {
      welcome: 'እንኳን ደህና መጡ',
      products: 'ምርቶች',
      cart: 'ጋሪ',
      login: 'ግባ',
      logout: 'ውጣ',
      search: 'ምርቶችን ይፈልጉ...',
      addToCart: 'ወደ ጋሪ ጨምር',
      price: 'ዋጋ',
      quantity: 'ብዛት',
      total: 'ጠቅላላ',
      checkout: 'ጨርሰህ አሳልፍ'
    }
  };

  const updateLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const updateCurrency = (curr) => {
    setCurrency(curr);
    localStorage.setItem('currency', curr);
  };

  const updateRegion = (reg) => {
    setRegion(reg);
    localStorage.setItem('region', reg);
  };

  const formatPrice = (price) => {
    if (currency === 'ETB') {
      return `ETB ${price.toLocaleString()}`;
    }
    return `$${(price / 45).toFixed(2)}`; // Approximate USD conversion
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const value = {
    language,
    currency,
    region,
    ethiopianRegions,
    translations,
    t,
    formatPrice,
    updateLanguage,
    updateCurrency,
    updateRegion
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};