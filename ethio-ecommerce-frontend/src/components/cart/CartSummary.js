import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CartSummary = () => {
  const { getCartSummary, cartItems } = useCart();
  const { formatPrice, t } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const summary = getCartSummary();
  const allFreeShipping = cartItems.length > 0 && cartItems.every(item => {
    const shippingInfo = item?.shipping || {};
    const freeFlag = shippingInfo.freeShipping ?? item?.freeShipping ?? false;
    const cost = shippingInfo.shippingCost ?? item?.shippingCost ?? 0;
    return freeFlag || cost === 0;
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">{t('orderSummary')}</h5>
      </Card.Header>
      
      <ListGroup variant="flush">
        <ListGroup.Item className="d-flex justify-content-between">
          <span>Subtotal ({summary.itemsCount} items):</span>
          <span>{formatPrice(summary.subtotal)}</span>
        </ListGroup.Item>
        
        <ListGroup.Item className="d-flex justify-content-between">
          <span>Shipping:</span>
          <span>
            {summary.shipping === 0 && allFreeShipping
              ? 'FREE'
              : formatPrice(summary.shipping)}
          </span>
        </ListGroup.Item>
        
        <ListGroup.Item className="d-flex justify-content-between">
          <strong>Total:</strong>
          <strong>{formatPrice(summary.total)}</strong>
        </ListGroup.Item>
      </ListGroup>
      
      <Card.Body>
        <Button 
          variant="primary" 
          size="lg" 
          className="w-100"
          onClick={handleCheckout}
        >
          {t('proceedToCheckout')}
        </Button>
        
        {summary.shipping === 0 && allFreeShipping && (
          <div className="text-success text-center mt-2">
            <small>🎉 You qualify for free shipping!</small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CartSummary;