import React from 'react';
import {
  Navbar,
  Nav,
  Container,
  NavDropdown,
  Badge,
  Button,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';
import '../../styles/header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const { language, updateLanguage, currency, updateCurrency, t } = useApp();

  const handleLogout = () => {
    logout();
  };

  const safeTranslate = (key, fallback) => {
    if (!t) {
      return fallback;
    }
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  return (
    <header className="app-header">
      <div className="header-top-bar">
        <Container className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="header-top-item">
            <i className="fas fa-shipping-fast me-2"></i>
            {safeTranslate('fast_delivery', 'Same-day delivery across Addis Ababa')}
          </div>
          <div className="header-top-item">
            <i className="fas fa-phone me-2"></i>
            {safeTranslate('support', '24/7 customer support: +251 987 654 321')}
          </div>
          <div className="header-top-item">
            <i className="fas fa-lock me-2"></i>
            {safeTranslate('secure_payment', 'Secure payments & easy returns')}
          </div>
        </Container>
      </div>

      <Navbar className="header-navbar" expand="lg" collapseOnSelect>
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand className="brand-highlight">
              <span className="brand-accent">Ethio</span>Ecommerce
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <LinkContainer to="/">
                <Nav.Link className="nav-pill">
                  <i className="fas fa-home me-1"></i>
                  {t('home')}
                </Nav.Link>
              </LinkContainer>
              <LinkContainer to="/products">
                <Nav.Link className="nav-pill">
                  <i className="fas fa-th-large me-1"></i>
                  {t('products')}
                </Nav.Link>
              </LinkContainer>
              <LinkContainer to="/orders">
                <Nav.Link className="nav-pill">
                  <i className="fas fa-shipping-fast me-1"></i>
                  {safeTranslate('orders', 'Track Orders')}
                </Nav.Link>
              </LinkContainer>
            </Nav>

            <Nav className="ms-auto align-items-lg-center">
              <NavDropdown
                title={language === 'en' ? 'English' : 'አማርኛ'}
                id="language-dropdown"
                className="nav-pill"
              >
                <NavDropdown.Item onClick={() => updateLanguage('en')}>
                  English
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => updateLanguage('am')}>
                  አማርኛ
                </NavDropdown.Item>
              </NavDropdown>

              <NavDropdown
                title={
                  <span>
                    <i className="fas fa-coins me-1"></i>
                    {currency}
                  </span>
                }
                id="currency-dropdown"
                className="nav-pill"
              >
                <NavDropdown.Item onClick={() => updateCurrency('ETB')}>
                  ETB
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => updateCurrency('USD')}>
                  USD
                </NavDropdown.Item>
              </NavDropdown>

              <LinkContainer to="/cart">
                <Nav.Link className="nav-pill cart-pill">
                  <i className="fas fa-shopping-cart me-1"></i>
                  {t('cart')}
                  {getCartItemsCount() > 0 && (
                    <Badge bg="warning" text="dark" className="ms-1">
                      {getCartItemsCount()}
                    </Badge>
                  )}
                </Nav.Link>
              </LinkContainer>

              {isAuthenticated ? (
                <NavDropdown
                  title={
                    <span>
                      <i className="fas fa-user-circle me-1"></i>
                      {user?.name}
                    </span>
                  }
                  id="username"
                  align="end"
                  className="nav-pill"
                >
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>
                      <i className="fas fa-user me-2"></i>Profile
                    </NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/orders">
                    <NavDropdown.Item>
                      <i className="fas fa-shopping-bag me-2"></i>My Orders
                    </NavDropdown.Item>
                  </LinkContainer>
                  {user?.role === 'seller' && (
                    <LinkContainer to="/seller">
                      <NavDropdown.Item>
                        <i className="fas fa-store me-2"></i>Seller Dashboard
                      </NavDropdown.Item>
                    </LinkContainer>
                  )}
                  {user?.role === 'admin' && (
                    <LinkContainer to="/admin">
                      <NavDropdown.Item>
                        <i className="fas fa-cog me-2"></i>Admin Dashboard
                      </NavDropdown.Item>
                    </LinkContainer>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    {t('logout')}
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Button variant="light" className="ms-lg-3 auth-btn">
                    <i className="fas fa-user me-2"></i>
                    {t('login')}
                  </Button>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
