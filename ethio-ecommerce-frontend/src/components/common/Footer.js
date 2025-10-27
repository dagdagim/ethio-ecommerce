import React from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import '../../styles/footer.css';

const Footer = () => {
  const { t } = useApp();

  return (
    <footer className="footer-wrapper mt-5">
      <div className="footer-gradient" />
      <Container className="footer-content py-5">
        <Row className="gy-4">
          <Col md={4} lg={3}>
            <div className="footer-brand">
              <div className="footer-logo">Ethio<span>Ecommerce</span></div>
              <p className="footer-subtitle">
                Discover the best of Ethiopian commerce with curated products, secure checkout, and lightning-fast delivery.
              </p>
              <div className="footer-social">
                <a href="https://facebook.com" aria-label="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href="https://instagram.com" aria-label="Instagram">
                  <i className="fab fa-instagram" />
                </a>
                <a href="https://t.me" aria-label="Telegram">
                  <i className="fab fa-telegram-plane" />
                </a>
                <a href="https://linkedin.com" aria-label="LinkedIn">
                  <i className="fab fa-linkedin-in" />
                </a>
              </div>
            </div>
          </Col>

          <Col md={4} lg={3}>
            <h5 className="footer-title">Shop & Explore</h5>
            <ul className="footer-links">
              <li><Link to="/products">{t('products')}</Link></li>
              <li><Link to="/categories">Popular Categories</Link></li>
              <li><Link to="/orders">Order Tracking</Link></li>
              <li><Link to="/seller">Sell on EthioEcommerce</Link></li>
              <li><Link to="/admin">Business Dashboard</Link></li>
            </ul>
          </Col>

          <Col md={4} lg={3}>
            <h5 className="footer-title">Support</h5>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms & Conditions</Link></li>
            </ul>
          </Col>

          <Col md={12} lg={3}>
            <div className="footer-newsletter">
              <h5 className="footer-title">Stay in the loop</h5>
              <p>Get weekly drops, local artisan highlights, and member-only offers.</p>
              <Form className="newsletter-form">
                <Form.Control type="email" placeholder="you@example.com" aria-label="Email" />
                <Button type="submit" className="mt-3 w-100">Subscribe</Button>
              </Form>
              <div className="footer-payments">
                <span>TeleBirr</span>
                <span>CBE</span>
                <span>Chapa</span>
                <span>COD</span>
              </div>
            </div>
          </Col>
        </Row>

        <hr className="footer-divider" />

        <Row className="align-items-center gy-3">
          <Col md={6}>
            <p className="footer-copy">&copy; {new Date().getFullYear()} EthioEcommerce. Crafted with love in Addis Ababa.</p>
            <p className="footer-developer small mt-1">
              Developed by{' '}
              <a href="https://dagimbekelebunera.vercel.app" target="_blank" rel="noopener noreferrer">
                dagimbekelebunera.vercel.app
              </a>
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="footer-meta">
              <span className="me-3"><i className="fas fa-envelope me-2" />
                <a href="mailto:bekeledagim3@gmail.com">bekeledagim3@gmail.com</a>
              </span>
              <span className="me-3"><i className="fab fa-github me-2" />
                <a href="https://github.com/dagdagim" target="_blank" rel="noopener noreferrer">dagdagim</a>
              </span>
              <span><i className="fab fa-linkedin-in me-2" />
                <a href="https://www.linkedin.com/in/dagim-bekele-7a3b6529b/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </span>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
