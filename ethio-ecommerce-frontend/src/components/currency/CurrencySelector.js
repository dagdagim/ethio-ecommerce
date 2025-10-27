import React, { useState } from 'react';
import { Dropdown, Form, Button, Modal, Table, Badge } from 'react-bootstrap';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useApp } from '../../contexts/AppContext';

const CurrencySelector = () => {
  const [showModal, setShowModal] = useState(false);
  const { 
    currencies, 
    selectedCurrency, 
    changeCurrency, 
    formatPrice,
    convertPrice,
    baseCurrency 
  } = useCurrency();
  const { language } = useApp();

  const handleCurrencyChange = (currencyCode) => {
    changeCurrency(currencyCode);
    setShowModal(false);
  };

  const getCurrencyName = (currency) => {
    return currency.name[language] || currency.name.en;
  };

  return (
    <>
      <Dropdown align="end">
        <Dropdown.Toggle 
          variant="outline-light" 
          className="border-0"
          id="currency-selector"
        >
          <i className="fas fa-money-bill-wave me-1"></i>
          {selectedCurrency?.code}
          {selectedCurrency?.code !== baseCurrency?.code && (
            <Badge bg="warning" className="ms-1" text="dark">
              {selectedCurrency?.exchangeRate?.toFixed(4)}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu style={{ minWidth: '200px' }}>
          <Dropdown.Header>
            <i className="fas fa-globe me-2"></i>
            Select Currency
          </Dropdown.Header>
          <Dropdown.Divider />
          
          {currencies.filter(c => c.isActive).map(currency => (
            <Dropdown.Item
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className="d-flex justify-content-between align-items-center"
              active={selectedCurrency?.code === currency.code}
            >
              <div>
                <strong>{currency.code}</strong>
                <div className="small text-muted">
                  {getCurrencyName(currency)}
                </div>
              </div>
              <div className="text-end">
                <div className="small">
                  {formatPrice(1, currency)}
                </div>
                {currency.code !== baseCurrency?.code && (
                  <div className="very-small text-muted">
                    {currency.exchangeRate.toFixed(4)}
                  </div>
                )}
              </div>
            </Dropdown.Item>
          ))}
          
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => setShowModal(true)}>
            <i className="fas fa-calculator me-2"></i>
            Currency Converter
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Currency Converter Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-calculator me-2"></i>
            Currency Converter
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CurrencyConverter />
        </Modal.Body>
      </Modal>
    </>
  );
};

// Currency Converter Component
const CurrencyConverter = () => {
  const { currencies, selectedCurrency, baseCurrency, convertPrice, formatPrice } = useCurrency();
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState(baseCurrency?.code || 'ETB');
  const [toCurrency, setToCurrency] = useState(selectedCurrency?.code || 'ETB');
  const [convertedAmount, setConvertedAmount] = useState(0);

  const handleConvert = () => {
    const result = convertPrice(amount, fromCurrency, toCurrency);
    setConvertedAmount(result);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount(convertedAmount);
    setConvertedAmount(amount);
  };

  React.useEffect(() => {
    handleConvert();
  }, [amount, fromCurrency, toCurrency]);

  const exchangeRate = convertPrice(1, fromCurrency, toCurrency);

  return (
    <div>
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <Form.Group>
            <Form.Label>From Currency</Form.Label>
            <Form.Select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {currencies.filter(c => c.isActive).map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name.en}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
        
        <div className="col-md-2 d-flex align-items-end justify-content-center">
          <Button 
            variant="outline-secondary" 
            onClick={swapCurrencies}
            className="mb-3"
          >
            <i className="fas fa-exchange-alt"></i>
          </Button>
        </div>
        
        <div className="col-md-5">
          <Form.Group>
            <Form.Label>To Currency</Form.Label>
            <Form.Select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {currencies.filter(c => c.isActive).map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name.en}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <Form.Group>
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group>
            <Form.Label>Converted Amount</Form.Label>
            <Form.Control
              type="text"
              value={formatPrice(convertedAmount, currencies.find(c => c.code === toCurrency))}
              readOnly
              className="fw-bold fs-5"
            />
          </Form.Group>
        </div>
      </div>

      <div className="alert alert-info">
        <div className="d-flex justify-content-between align-items-center">
          <span>
            <strong>Exchange Rate:</strong> 1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
          </span>
          <span>
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Popular Conversions */}
      <div className="mt-4">
        <h6>Popular Conversions</h6>
        <Table striped bordered size="sm">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {currencies
              .filter(c => c.isActive && c.code !== baseCurrency?.code)
              .slice(0, 5)
              .map(currency => (
                <tr key={currency.code}>
                  <td>1 {baseCurrency?.code}</td>
                  <td>{currency.code}</td>
                  <td>{currency.exchangeRate.toFixed(4)}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default CurrencySelector;