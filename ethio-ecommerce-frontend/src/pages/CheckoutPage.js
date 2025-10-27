import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { ordersAPI, promotionsAPI } from '../services/api';
import CheckoutSteps from '../components/checkout/CheckoutSteps';
import PaymentMethod from '../components/checkout/PaymentMethod';
import Message from '../components/common/Message';
import '../styles/checkoutPage.css';

const CheckoutPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Form states
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    region: 'Addis Ababa',
    city: '',
    subcity: '',
    woreda: '',
    kebele: '',
    houseNumber: '',
    specificLocation: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const { cartItems, getCartSummary, resolveImageForCartItem } = useCart();
  const { user } = useAuth();
  const { ethiopianRegions, formatPrice } = useApp();
  const navigate = useNavigate();

  const summary = getCartSummary();
  const totalItems = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  // Promotion code states
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [promotionError, setPromotionError] = useState('');
  const [applyingPromotion, setApplyingPromotion] = useState(false);

  // Initialize shipping address with user data
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone,
        region: user.address?.region || 'Addis Ababa',
        city: user.address?.city || '',
        subcity: user.address?.subcity || '',
        woreda: user.address?.woreda || '',
        kebele: user.address?.kebele || '',
        houseNumber: user.address?.houseNumber || '',
        specificLocation: user.address?.specificLocation || ''
      }));
    }
  }, [user]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinueToPayment = () => {
    // Validate shipping address
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.specificLocation) {
      setError('Please fill in all required address fields');
      return;
    }
    setStep(2);
    setError('');
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order
      const orderData = {
        items: cartItems.map(item => ({
          product: item._id,
          quantity: item.quantity,
          image: resolveImageForCartItem?.(item)
        })),
        shippingAddress,
        paymentMethod,
        customerNotes,
        promotion: appliedPromotion?._id || null
      };

      const orderResponse = await ordersAPI.createOrder(orderData);
      const newOrder = orderResponse.data.data;

      navigate(`/order/${newOrder._id}/payment`, {
        state: {
          order: newOrder,
          paymentMethod,
          telebirrPhone: shippingAddress.phone
        }
      });

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Promotion functions
  const applyPromotion = async () => {
    if (!promotionCode.trim()) return;

    setApplyingPromotion(true);
    setPromotionError('');

    try {
      const response = await promotionsAPI.validatePromotion({
        code: promotionCode,
        cartItems: cartItems.map(item => ({
          product: {
            _id: item._id,
            category: item.category,
            seller: item.seller
          },
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: summary.subtotal,
        userId: user._id
      });

      setAppliedPromotion(response.data.data.promotion);
      setPromotionDiscount(response.data.data.discount);
    } catch (error) {
      setPromotionError(error.response?.data?.message || 'Failed to apply promotion');
    } finally {
      setApplyingPromotion(false);
    }
  };

  const removePromotion = () => {
    setPromotionCode('');
    setAppliedPromotion(null);
    setPromotionDiscount(0);
    setPromotionError('');
  };

  const finalTotal = summary.total - promotionDiscount;

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <Container className="py-5">
          <div className="checkout-empty text-center shadow-lg">
            <div className="checkout-empty__icon mb-3">
              <i className="fas fa-shopping-basket"></i>
            </div>
            <h3>Your checkout is waiting for its first item</h3>
            <p className="text-muted mb-4">Browse the marketplace and add products to complete your order.</p>
            <Button variant="primary" size="lg" onClick={() => navigate('/products')}>
              Explore products
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-gradient" />
      <Container className="py-5 position-relative">
        <div className="checkout-hero shadow-lg">
          <div className="checkout-hero__badge">
            <Badge bg="light" text="dark">Secure Checkout</Badge>
          </div>
          <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-4">
            <div>
              <h1 className="checkout-hero__title">Just a few details before delivery</h1>
              <p className="checkout-hero__subtitle mb-0">
                Complete your shipping information and choose your preferred payment method. We will handle the rest.
              </p>
            </div>
            <div className="checkout-hero__metrics">
              <div className="checkout-hero__metric">
                <span className="checkout-hero__metric-value">{cartItems.length}</span>
                <small className="checkout-hero__metric-label">Products</small>
              </div>
              <div className="checkout-hero__metric">
                <span className="checkout-hero__metric-value">{totalItems}</span>
                <small className="checkout-hero__metric-label">Items in cart</small>
              </div>
              <div className="checkout-hero__metric">
                <span className="checkout-hero__metric-value">{formatPrice(summary.total)}</span>
                <small className="checkout-hero__metric-label">Cart total</small>
              </div>
            </div>
          </div>

          <div className="checkout-progress mt-4">
            <CheckoutSteps
              step1={true}
              step2={step >= 2}
              step3={step >= 3}
              step4={step >= 4}
            />
          </div>
        </div>

        {error && <Alert variant="danger" className="checkout-alert">{error}</Alert>}

        <Row className="mt-5 g-4">
        {/* Checkout Steps */}
        <Col lg={8}>
          {step === 1 && (
            <Card className="checkout-card shadow-sm">
              <Card.Header className="checkout-card__header">
                <div>
                  <h4 className="mb-1">Shipping address</h4>
                  <small className="text-muted">Tell us where to deliver your products.</small>
                </div>
                <span className="checkout-card__step">Step 1 of 2</span>
              </Card.Header>
              <Card.Body className="checkout-card__body">
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={shippingAddress.name}
                          onChange={handleAddressChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={shippingAddress.phone}
                          onChange={handleAddressChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Region *</Form.Label>
                        <Form.Select
                          name="region"
                          value={shippingAddress.region}
                          onChange={handleAddressChange}
                          required
                        >
                          {ethiopianRegions.map(region => (
                            <option key={region} value={region}>
                              {region}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City *</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={shippingAddress.city}
                          onChange={handleAddressChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Subcity</Form.Label>
                        <Form.Control
                          type="text"
                          name="subcity"
                          value={shippingAddress.subcity}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Woreda</Form.Label>
                        <Form.Control
                          type="text"
                          name="woreda"
                          value={shippingAddress.woreda}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Specific Location *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="specificLocation"
                      value={shippingAddress.specificLocation}
                      onChange={handleAddressChange}
                      required
                      placeholder="Detailed location description with landmarks"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Order Notes (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Any special instructions for your order..."
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" className="checkout-nav-btn" onClick={() => navigate('/cart')}>
                      <i className="fas fa-arrow-left me-2"></i>
                      Back to cart
                    </Button>
                    <Button variant="primary" className="checkout-nav-btn" onClick={handleContinueToPayment}>
                      Continue to payment
                      <i className="fas fa-arrow-right ms-2"></i>
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {step === 2 && (
            <Card className="checkout-card shadow-sm">
              <Card.Header className="checkout-card__header">
                <div>
                  <h4 className="mb-1">Payment method</h4>
                  <small className="text-muted">Choose how you want to complete your purchase.</small>
                </div>
                <span className="checkout-card__step">Step 2 of 2</span>
              </Card.Header>
              <Card.Body className="checkout-card__body">
                <PaymentMethod 
                  onMethodSelect={setPaymentMethod}
                  selectedMethod={paymentMethod}
                />

                <div className="d-flex justify-content-between mt-4">
                  <Button variant="outline-secondary" className="checkout-nav-btn" onClick={() => setStep(1)}>
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to shipping
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handlePlaceOrder}
                    disabled={!paymentMethod || loading}
                    className="checkout-nav-btn"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          <Card className="checkout-summary sticky-top" style={{ top: '20px' }}>
            <Card.Header className="checkout-summary__header">
              <div>
                <h5 className="mb-1">Order summary</h5>
                <small className="text-muted">Review items before completing payment.</small>
              </div>
            </Card.Header>
            <Card.Body className="checkout-summary__body">
              {cartItems.map(item => (
                <div key={item._id} className="checkout-summary__item">
                  <div className="checkout-summary__item-info">
                    <img
                      src={resolveImageForCartItem?.(item)}
                      alt={item.name?.en || item.name}
                    />
                    <div>
                      <small className="d-block">{item.name?.en || item.name}</small>
                      <small className="text-muted">Qty: {item.quantity}</small>
                    </div>
                  </div>
                  <small>{formatPrice(item.price * item.quantity)}</small>
                </div>
              ))}

              <hr />

              {/* Promotion Code */}
              <Card className="checkout-promo">
                <Card.Header className="checkout-promo__header">
                  <h5 className="mb-0">Promotion code</h5>
                </Card.Header>
                <Card.Body>
                  {!appliedPromotion ? (
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        value={promotionCode}
                        onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        disabled={applyingPromotion}
                      />
                      <Button 
                        variant="outline-primary" 
                        onClick={applyPromotion}
                        disabled={applyingPromotion || !promotionCode.trim()}
                      >
                        {applyingPromotion ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Badge bg="success" className="me-2">{appliedPromotion.code}</Badge>
                        <span>{appliedPromotion.name?.en || appliedPromotion.name}</span>
                        {appliedPromotion.freeShipping && (
                          <Badge bg="info" className="ms-2">Free Shipping</Badge>
                        )}
                      </div>
                      <Button variant="outline-danger" size="sm" onClick={removePromotion}>
                        Remove
                      </Button>
                    </div>
                  )}
                  {promotionError && (
                    <Alert variant="danger" className="mt-2 mb-0 py-2">
                      {promotionError}
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              <div className="checkout-summary__row">
                <span>Shipping</span>
                <span>{summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping)}</span>
              </div>

              {/* Discount */}
              {appliedPromotion && (
                <div className="checkout-summary__row text-success">
                  <span>Discount ({appliedPromotion.code})</span>
                  <span>- {formatPrice(promotionDiscount)}</span>
                </div>
              )}

              <div className="checkout-summary__total">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>

              {summary.subtotal > 1000 && (
                <div className="text-success text-center mt-2">
                  <small>🎉 You qualify for free shipping!</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </Container>
    </div>
  );
};

export default CheckoutPage;
