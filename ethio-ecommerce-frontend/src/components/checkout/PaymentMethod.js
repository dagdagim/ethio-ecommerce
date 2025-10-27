import React, { useState } from 'react';
import { Form, Card, Button, Alert } from 'react-bootstrap';
import { useApp } from '../../contexts/AppContext';

const PaymentMethod = ({ onMethodSelect, selectedMethod }) => {
  const { t } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');

  const paymentMethods = [
    {
      id: 'telebirr',
      name: 'TeleBirr',
      description: 'Pay securely with TeleBirr',
      icon: '📱',
      requiresPhone: true
    },
    {
      id: 'chapa',
      name: 'Chapa',
      description: 'Pay online with cards, wallets, or mobile banking',
      icon: '💳',
      requiresPhone: false
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: '💰',
      requiresPhone: false
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer money to our bank account',
      icon: '🏦',
      requiresPhone: false
    }
  ];

  const handleMethodSelect = (methodId) => {
    onMethodSelect(methodId);
  };

  return (
    <div>
      <h4 className="mb-4">{t('selectPaymentMethod')}</h4>
      
      {paymentMethods.map(method => (
        <Card 
          key={method.id}
          className={`mb-3 cursor-pointer ${selectedMethod === method.id ? 'border-primary' : ''}`}
          onClick={() => handleMethodSelect(method.id)}
          style={{ cursor: 'pointer' }}
        >
          <Card.Body>
            <div className="d-flex align-items-center">
              <div className="me-3" style={{ fontSize: '2rem' }}>
                {method.icon}
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-1">{method.name}</h5>
                <p className="text-muted mb-0">{method.description}</p>
              </div>
              <Form.Check
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === method.id}
                onChange={() => handleMethodSelect(method.id)}
              />
            </div>
            
            {method.requiresPhone && selectedMethod === method.id && (
              <div className="mt-3">
                <Form.Group>
                  <Form.Label>TeleBirr Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+251 91 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    pattern="^(\+251|0)[1-9]\d{8}$"
                  />
                  <Form.Text className="text-muted">
                    Enter your TeleBirr registered phone number
                  </Form.Text>
                </Form.Group>
              </div>
            )}
          </Card.Body>
        </Card>
      ))}
      
      {selectedMethod === 'bank_transfer' && (
        <Alert variant="info" className="mt-3">
          <h6>Bank Transfer Instructions:</h6>
          <p className="mb-1"><strong>Bank:</strong> Commercial Bank of Ethiopia</p>
          <p className="mb-1"><strong>Account Name:</strong> EthioEcommerce</p>
          <p className="mb-1"><strong>Account Number:</strong> 1000 2345 6789</p>
          <p className="mb-0"><strong>Reference:</strong> Your Order Number</p>
        </Alert>
      )}
    </div>
  );
};

export default PaymentMethod;