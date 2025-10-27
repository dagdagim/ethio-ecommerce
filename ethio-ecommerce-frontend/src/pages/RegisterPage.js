import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/registerPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    role: 'customer',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    telebirrAccount: '',
    cbeAccount: '',
    address: {
      region: 'Addis Ababa',
      city: '',
      subcity: '',
      woreda: '',
      kebele: '',
      houseNumber: '',
      specificLocation: ''
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const { ethiopianRegions } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, redirect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Validate Ethiopian phone number
    const phoneRegex = /^(\+251|0)[1-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid Ethiopian phone number');
      setLoading(false);
      return;
    }

    // Prepare data for API (remove confirmPassword)
    const { confirmPassword, ...registerData } = formData;

    const result = await register(registerData);
    
    if (result.success) {
      navigate(redirect);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  if (loading) return <LoadingSpinner message="Creating your account..." />;

  return (
    <div className="register-page-wrapper">
      <Container className="register-hero text-center">
        <p className="register-pill">Step 1 · Create your EthioEcommerce profile</p>
        <h1 className="register-title">Let&apos;s set up your account</h1>
        <p className="register-subtitle">
          Share precise delivery details so our couriers can reach you without delays.
        </p>
      </Container>

      <Container className="register-container py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={7}>
            <Card className="register-card shadow-lg">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-5">
                  <h2 className="register-card-title">Create Account</h2>
                  <p className="text-muted mb-0">Complete your profile in three quick steps</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <div className="form-section glass-panel mb-4">
                    <div className="section-heading mb-4">
                      <span className="section-icon">👤</span>
                      <div>
                        <h5 className="section-title mb-1">Account Details</h5>
                        <small className="section-subtitle">Let&apos;s get to know you</small>
                      </div>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="align-items-end">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Account Type *</Form.Label>
                          <Form.Select name="role" value={formData.role} onChange={handleChange} required>
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <div className="info-kicker">
                          <span className="kicker-dot" />
                          Choose seller to add storefront payout details.
                        </div>
                      </Col>
                    </Row>

                    {formData.role === 'seller' && (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Telebirr Account</Form.Label>
                            <Form.Control
                              type="text"
                              name="telebirrAccount"
                              value={formData.telebirrAccount}
                              onChange={handleChange}
                              placeholder="Telebirr phone/account"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>CBE Account</Form.Label>
                            <Form.Control
                              type="text"
                              name="cbeAccount"
                              value={formData.cbeAccount}
                              onChange={handleChange}
                              placeholder="CBE account number"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                  </div>

                  <div className="form-section glass-panel address-section mb-4">
                    <div className="section-heading mb-4">
                      <span className="section-icon">📍</span>
                      <div>
                        <h5 className="section-title mb-1">Shipping Address</h5>
                        <small className="section-subtitle">Pinpoint your delivery destination</small>
                      </div>
                    </div>

                    <div className="address-guidelines mb-4">
                      <span className="guideline-chip">Double-check the region and city</span>
                      <span className="guideline-chip">Include a landmark for faster drop-off</span>
                      <span className="guideline-chip">We call before arriving</span>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number *</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="+251 91 123 4567"
                            pattern="^(\\+251|0)[1-9]\\d{8}$"
                          />
                          <Form.Text className="text-muted">
                            Format: +251XXXXXXXXX or 09XXXXXXXX
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Region *</Form.Label>
                          <Form.Select
                            name="address.region"
                            value={formData.address.region}
                            onChange={handleChange}
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
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City *</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            required
                            placeholder="Enter your city"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Subcity</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.subcity"
                            value={formData.address.subcity}
                            onChange={handleChange}
                            placeholder="Enter subcity"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Woreda</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.woreda"
                            value={formData.address.woreda}
                            onChange={handleChange}
                            placeholder="Enter woreda"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kebele</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.kebele"
                            value={formData.address.kebele}
                            onChange={handleChange}
                            placeholder="Enter kebele"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>House Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.houseNumber"
                            value={formData.address.houseNumber}
                            onChange={handleChange}
                            placeholder="Enter house number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <div className="address-card-tip">
                          Precise house numbers and landmarks help us deliver without extra calls.
                        </div>
                      </Col>
                    </Row>

                    <Form.Group className="mb-0">
                      <Form.Label>Specific Location *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address.specificLocation"
                        value={formData.address.specificLocation}
                        onChange={handleChange}
                        required
                        placeholder="Detailed location description (landmarks, nearby places)"
                      />
                    </Form.Group>
                  </div>

                  <div className="form-section glass-panel mb-4">
                    <div className="section-heading mb-4">
                      <span className="section-icon">🔒</span>
                      <div>
                        <h5 className="section-title mb-1">Security</h5>
                        <small className="section-subtitle">Protect your account access</small>
                      </div>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Password *</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter password (min 6 characters)"
                            minLength={6}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password *</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-0">
                      <Form.Check
                        type="checkbox"
                        label="I agree to the Terms and Conditions and Privacy Policy"
                        required
                      />
                    </Form.Group>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 register-submit"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link to={redirect ? `/login?redirect=${redirect}` : '/login'}>
                      Sign in here
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

export default RegisterPage;