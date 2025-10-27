import React, { createContext, useState, useContext, useEffect } from 'react';
import { currenciesAPI } from '../services/api';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currencies, setCurrencies] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState({});

  useEffect(() => {
    initializeCurrencies();
  }, []);

  const initializeCurrencies = async () => {
    try {
      const response = await currenciesAPI.getCurrencies();
      const currenciesData = response.data.data;
      
      setCurrencies(currenciesData);
      
      // Find base currency
      const base = currenciesData.find(currency => currency.isBaseCurrency);
      setBaseCurrency(base);
      
      // Set selected currency (default to base currency)
      const savedCurrency = localStorage.getItem('selectedCurrency');
      if (savedCurrency) {
        const selected = currenciesData.find(c => c.code === savedCurrency);
        setSelectedCurrency(selected || base);
      } else {
        setSelectedCurrency(base);
      }
      
      // Build exchange rates map
      const rates = {};
      currenciesData.forEach(currency => {
        rates[currency.code] = currency.exchangeRate;
      });
      setExchangeRates(rates);
      
    } catch (error) {
      console.error('Error initializing currencies:', error);
      // Fallback to ETB
      const fallbackCurrency = {
        code: 'ETB',
        name: { en: 'Ethiopian Birr', am: 'ኢትዮጵያ ብር' },
        symbol: 'ETB',
        exchangeRate: 1,
        isBaseCurrency: true,
        decimalPlaces: 2,
        formatting: {
          symbolPosition: 'before',
          thousandSeparator: ',',
          decimalSeparator: '.',
          spaceBetween: false
        }
      };
      setCurrencies([fallbackCurrency]);
      setBaseCurrency(fallbackCurrency);
      setSelectedCurrency(fallbackCurrency);
      setExchangeRates({ ETB: 1 });
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
      localStorage.setItem('selectedCurrency', currencyCode);
    }
  };

  const convertPrice = (price, fromCurrency = baseCurrency?.code, toCurrency = selectedCurrency?.code) => {
    if (!price || !fromCurrency || !toCurrency) return price;
    
    if (fromCurrency === toCurrency) return price;
    
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    
    // Convert to base currency first, then to target currency
    const priceInBase = price / fromRate;
    const convertedPrice = priceInBase * toRate;
    
    return convertedPrice;
  };

  const formatPrice = (price, currency = selectedCurrency) => {
    if (!currency || price === undefined || price === null) {
      return 'N/A';
    }

    const {
      symbol,
      decimalPlaces,
      formatting: {
        symbolPosition,
        thousandSeparator,
        decimalSeparator,
        spaceBetween
      }
    } = currency;

    // Format the number
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(price)
    .replace(/,/g, thousandSeparator)
    .replace(/\./g, decimalSeparator);

    // Add currency symbol
    const space = spaceBetween ? ' ' : '';
    
    if (symbolPosition === 'before') {
      return `${symbol}${space}${formattedNumber}`;
    } else {
      return `${formattedNumber}${space}${symbol}`;
    }
  };

  const getConvertedAndFormattedPrice = (price, fromCurrency = baseCurrency?.code) => {
    const convertedPrice = convertPrice(price, fromCurrency);
    return formatPrice(convertedPrice);
  };

  const value = {
    currencies,
    baseCurrency,
    selectedCurrency,
    loading,
    exchangeRates,
    changeCurrency,
    convertPrice,
    formatPrice,
    getConvertedAndFormattedPrice
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};