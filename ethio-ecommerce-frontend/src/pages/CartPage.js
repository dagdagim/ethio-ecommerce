import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Message from '../components/common/Message';
import '../styles/cartPage.css';

const CartPage = () => {
  const { cartItems, clearCart } = useCart();
  const totalUnits = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const progressSteps = ['Basket', 'Delivery', 'Payment', 'Confirmation'];

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <Container className="py-5">
          <div className="cart-empty card border-0 shadow-lg text-center p-5">
            <div className="cart-empty__icon mb-3">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <h3>Your cart is feeling lonely</h3>
            <p className="text-muted mb-4">
              Explore the marketplace and discover Ethiopian-made products you will love.
            </p>
            <Button as={Link} to="/products" size="lg" className="cart-primary-btn">
              Browse products
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-gradient" />
      <Container className="py-5 position-relative">
        <div className="cart-hero shadow-lg">
          <div className="cart-hero__badge">
            <Badge bg="light" text="dark">Active Basket</Badge>
          </div>
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
            <div>
              <h1 className="cart-hero__title">Review your picks before they sell out</h1>
              <p className="cart-hero__subtitle mb-0">
                Secure checkout, trusted sellers, and same-day dispatch across Addis Ababa when you complete your order today.
              </p>
            </div>
            <div className="cart-hero__stats">
              <div className="cart-hero__stat">
                <span className="cart-hero__stat-value">{totalUnits}</span>
                <small className="cart-hero__stat-label">Total items</small>
              </div>
              <div className="cart-hero__stat">
                <span className="cart-hero__stat-value">{cartItems.length}</span>
                <small className="cart-hero__stat-label">Unique products</small>
              </div>
            </div>
          </div>
          <div className="cart-progress mt-4">
            {progressSteps.map((step, index) => (
              <div key={step} className={`cart-progress__step ${index === 0 ? 'is-active' : ''}`}>
                <span className="cart-progress__index">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <Row className="mt-4 g-4">
          <Col lg={8}>
            <div className="cart-panel shadow-sm">
              <div className="cart-panel__header">
                <div>
                  <h2 className="mb-1">Shopping Cart</h2>
                  <small className="text-muted">{cartItems.length} products · {totalUnits} total items</small>
                </div>
                <Button variant="outline-danger" size="sm" onClick={clearCart}>
                  <i className="fas fa-times me-1"></i>
                  Clear cart
                </Button>
              </div>

              <Card className="border-0 cart-items-card">
                <Card.Body>
                  {cartItems.map((item) => (
                    <CartItem key={item._id} item={item} />
                  ))}
                </Card.Body>
              </Card>
            </div>
          </Col>

          <Col lg={4}>
            <div className="cart-summary-card shadow">
              <CartSummary />
            </div>

            <div className="cart-benefits mt-4">
              <div className="cart-benefits__item">
                <i className="fas fa-shield-alt"></i>
                Buyer protection on every order
              </div>
              <div className="cart-benefits__item">
                <i className="fas fa-biking"></i>
                Express dispatch for Addis orders
              </div>
              <div className="cart-benefits__item">
                <i className="fas fa-coins"></i>
                Earn reward points on checkout
              </div>
            </div>

            <div className="mt-3">
              <Button as={Link} to="/products" variant="outline-primary" className="w-100 cart-return-btn">
                <i className="fas fa-arrow-left me-2"></i>
                Continue shopping
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CartPage;