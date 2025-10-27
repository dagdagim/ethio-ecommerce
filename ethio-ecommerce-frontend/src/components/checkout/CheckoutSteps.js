import React from 'react';
import { Nav } from 'react-bootstrap';
import { useApp } from '../../contexts/AppContext';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  const { t } = useApp();

  return (
    <Nav className="justify-content-center mb-4">
      <Nav.Item>
        {step1 ? (
          <Nav.Link href="/login">{t('signIn')}</Nav.Link>
        ) : (
          <Nav.Link disabled>{t('signIn')}</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step2 ? (
          <Nav.Link href="/shipping">{t('shipping')}</Nav.Link>
        ) : (
          <Nav.Link disabled>{t('shipping')}</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step3 ? (
          <Nav.Link href="/payment">{t('payment')}</Nav.Link>
        ) : (
          <Nav.Link disabled>{t('payment')}</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step4 ? (
          <Nav.Link href="/placeorder">{t('placeOrder')}</Nav.Link>
        ) : (
          <Nav.Link disabled>{t('placeOrder')}</Nav.Link>
        )}
      </Nav.Item>
    </Nav>
  );
};

export default CheckoutSteps;