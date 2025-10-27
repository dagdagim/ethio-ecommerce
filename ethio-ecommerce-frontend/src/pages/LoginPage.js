import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, redirect]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate(redirect);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  if (loading) return <LoadingSpinner message="Signing in..." />;

  return (
    <div className="login-page-wrapper">
      <Container className="login-hero text-center">
        <p className="login-pill">Welcome back</p>
        <h1 className="login-title">Sign in to keep shopping</h1>
        <p className="login-subtitle">Unlock your saved carts, order history, and tailored offers.</p>
      </Container>

      <Container className="login-container py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="login-card shadow-lg">
              <Card.Body className="p-4 p-md-5">
                <div className="mb-4 login-header">
                  <div>
                    <h2 className="login-card-title">Sign In</h2>
                    <p className="text-muted mb-0">Enter your credentials to continue</p>
                  </div>
                  <div className="login-badge">Secure access</div>
                </div>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <div className="glass-panel form-section mb-4">
                    <div className="section-heading mb-3">
                      <span className="section-icon">📧</span>
                      <div>
                        <h5 className="section-title mb-1">Account email</h5>
                        <small className="section-subtitle">Use the email you registered with</small>
                      </div>
                    </div>
                    <Form.Group className="mb-0">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="name@example.com"
                      />
                    </Form.Group>
                  </div>

                  <div className="glass-panel form-section mb-3">
                    <div className="section-heading mb-3">
                      <span className="section-icon">🔑</span>
                      <div>
                        <h5 className="section-title mb-1">Password</h5>
                        <small className="section-subtitle">Your details remain encrypted</small>
                      </div>
                    </div>
                    <Form.Group className="mb-0">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Enter your password"
                      />
                    </Form.Group>
                    <div className="login-actions">
                      <Link to="/forgot-password" className="forgot-link">
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <div className="trust-pills mb-4">
                    <span className="trust-chip">🔒 Bank-level encryption</span>
                    <span className="trust-chip">⚡ Fast checkout access</span>
                    <span className="trust-chip">🧾 Track orders easily</span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 login-submit"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
                      Create one now
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;