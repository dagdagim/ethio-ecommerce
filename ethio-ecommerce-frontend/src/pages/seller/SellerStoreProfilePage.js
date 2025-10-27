import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert } from 'react-bootstrap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { sellerAPI } from '../../services/api';
import '../../styles/sellerStoreProfile.css';

const defaultProfile = {
  storeName: '',
  tagline: '',
  supportEmail: '',
  supportPhone: '',
  website: '',
  city: '',
  addressLine: '',
  about: '',
  fulfillmentTime: '2-3 business days',
  returnPolicy: 'Returns accepted within 14 days if items remain unopened.',
  pickupAvailable: false,
  featuredCategories: '',
  instagram: '',
  facebook: '',
  tiktok: ''
};

const SellerStoreProfilePage = () => {
  const [formData, setFormData] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
  const response = await sellerAPI.getSellerProfile();
  if (!active) return;
  const payload = response?.data;
  const profile = payload?.data || payload;
        const merged = { ...defaultProfile, ...(profile || {}) };
  setFormData(merged);
  localStorage.setItem('sellerProfileDraft', JSON.stringify(merged));
        if (!profile) {
          setFeedback({ variant: 'info', message: 'Started a new store profile. Fill in the details below.' });
        }
      } catch (error) {
        console.error('Failed to load seller profile', error);
        if (!active) return;
        const draft = localStorage.getItem('sellerProfileDraft');
        if (draft) {
          setFeedback({ variant: 'info', message: 'Loaded your locally saved profile draft.' });
          setFormData({ ...defaultProfile, ...JSON.parse(draft) });
        } else {
          setFeedback({ variant: 'warning', message: 'Using default profile data until we reach the server.' });
          setFormData(defaultProfile);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    const nextDraft = { ...formData, [name]: newValue };
    localStorage.setItem('sellerProfileDraft', JSON.stringify(nextDraft));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
  const response = await sellerAPI.updateSellerProfile(formData);
  const payload = response?.data;
  const profile = payload?.data || payload;
  setFormData({ ...defaultProfile, ...(profile || {}) });
      localStorage.removeItem('sellerProfileDraft');
  setFeedback({ variant: 'success', message: 'Store profile updated successfully.' });
    } catch (error) {
      console.error('Failed to save seller profile', error);
      if (error.response?.status === 404) {
        localStorage.setItem('sellerProfileDraft', JSON.stringify(formData));
        setFeedback({
          variant: 'info',
          message: 'Server endpoint not ready yet. Your draft is saved locally for now.'
        });
      } else {
        setFeedback({ variant: 'danger', message: 'Could not save changes. Please try again shortly.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const profileHighlights = useMemo(() => [
    { id: 'highlight-1', label: 'Brand Completeness', value: formData.about ? 90 : 65, variant: formData.about ? 'success' : 'warning' },
    { id: 'highlight-2', label: 'Support Channels', value: [formData.supportEmail, formData.supportPhone].filter(Boolean).length, variant: 'info' },
    { id: 'highlight-3', label: 'Social Presence', value: [formData.instagram, formData.facebook, formData.tiktok].filter(Boolean).length, variant: 'primary' }
  ], [formData]);

  if (loading) {
    return <LoadingSpinner message="Loading store profile…" />;
  }

  return (
    <Container fluid className="seller-store-profile-container py-5">
      <Row className="seller-store-profile-header align-items-center mb-4">
        <Col>
          <h1 className="seller-store-profile-title mb-1">Store Profile</h1>
          <p className="seller-store-profile-subtitle mb-0">Fine-tune how shoppers discover and trust your brand on EthioEcommerce.</p>
        </Col>
        <Col xs="auto" className="seller-store-highlight-wrapper d-flex align-items-center gap-3 flex-wrap">
          {profileHighlights.map(highlight => (
            <Card key={highlight.id} className="seller-store-highlight-card text-center shadow-sm border-0">
              <Card.Body className="py-3">
                <div className={`seller-store-highlight-value text-${highlight.variant}`}>{highlight.value}</div>
                <small className="seller-store-highlight-label">{highlight.label}</small>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>

      {feedback && (
        <Alert
          variant={feedback.variant}
          dismissible
          onClose={() => setFeedback(null)}
          className="shadow-sm seller-store-alert"
        >
          {feedback.message}
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="seller-store-card shadow-sm border-0 mb-4">
            <Card.Header className="seller-store-card-header">
              <div>
                <h5 className="mb-0">Brand Identity</h5>
                <small className="text-muted">Shape your narrative for every shopper touchpoint.</small>
              </div>
            </Card.Header>
            <Card.Body className="seller-store-card-body">
              <Form onSubmit={handleSubmit} className="seller-store-form">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Store Name</Form.Label>
                    <Form.Control
                      className="seller-store-input"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="Example: Shega Collections"
                      required
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Tagline</Form.Label>
                    <Form.Control
                      className="seller-store-input"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      placeholder="Elevate your home with Ethiopian craft"
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Brand Story</Form.Label>
                  <Form.Control
                    className="seller-store-input"
                    as="textarea"
                    rows={4}
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    placeholder="Share what makes your products unique and how customers benefit."
                  />
                </Form.Group>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Featured Categories</Form.Label>
                    <Form.Control
                      className="seller-store-input"
                      name="featuredCategories"
                      value={formData.featuredCategories}
                      onChange={handleChange}
                      placeholder="Coffee, Leather Goods, Home Decor"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      className="seller-store-input"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yourstore.com"
                    />
                  </Col>
                </Row>

                <Card className="seller-store-subcard mb-4">
                  <Card.Body>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          className="seller-store-input"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Addis Ababa"
                        />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label>Storefront Address</Form.Label>
                        <Form.Control
                          className="seller-store-input"
                          name="addressLine"
                          value={formData.addressLine}
                          onChange={handleChange}
                          placeholder="Bole Road, 3rd floor, Shop 12"
                        />
                      </Col>
                    </Row>
                    <Form.Check
                      type="switch"
                      id="pickupAvailable"
                      name="pickupAvailable"
                      className="seller-store-switch"
                      label="Offer local pickup for customers"
                      checked={formData.pickupAvailable}
                      onChange={handleChange}
                    />
                  </Card.Body>
                </Card>

                <Card className="seller-store-subcard shadow-sm mb-4">
                  <Card.Header className="seller-store-card-header">
                    <h6 className="mb-0">Customer Support</h6>
                  </Card.Header>
                  <Card.Body className="seller-store-card-body">
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>Support Email</Form.Label>
                        <Form.Control
                          className="seller-store-input"
                          type="email"
                          name="supportEmail"
                          value={formData.supportEmail}
                          onChange={handleChange}
                          placeholder="support@yourstore.com"
                        />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label>Support Phone</Form.Label>
                        <Form.Control
                          className="seller-store-input"
                          name="supportPhone"
                          value={formData.supportPhone}
                          onChange={handleChange}
                          placeholder="+251 91 123 4567"
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Label>Fulfillment Time</Form.Label>
                        <Form.Control
                          className="seller-store-input"
                          name="fulfillmentTime"
                          value={formData.fulfillmentTime}
                          onChange={handleChange}
                          placeholder="1-2 business days"
                        />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label>Return Policy</Form.Label>
                        <Form.Control
                          className="seller-store-input"
                          name="returnPolicy"
                          value={formData.returnPolicy}
                          onChange={handleChange}
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Label>Instagram</Form.Label>
                    <Form.Control
                      className="seller-store-input"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="@yourstore"
                    />
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Label>Facebook</Form.Label>
                    <Form.Control
                      className="seller-store-input"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      placeholder="facebook.com/yourstore"
                    />
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Label>TikTok</Form.Label>
                    <Form.Control
                      className="seller-store-input"
                      name="tiktok"
                      value={formData.tiktok}
                      onChange={handleChange}
                      placeholder="@yourstore"
                    />
                  </Col>
                </Row>

                <div className="seller-store-form-actions d-flex justify-content-end gap-3">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="seller-store-secondary"
                    onClick={() => {
                      setFormData(defaultProfile);
                      localStorage.removeItem('sellerProfileDraft');
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" variant="primary" className="seller-store-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="seller-store-preview-card shadow-sm border-0 mb-4">
            <Card.Header className="seller-store-card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Storefront Preview</h5>
                <small className="text-muted">See how shoppers experience your brand page.</small>
              </div>
              <Badge bg="secondary" className="seller-store-status-badge">Live</Badge>
            </Card.Header>
            <Card.Body className="seller-store-preview-body">
              <div className="seller-store-preview-hero">
                <h4 className="seller-store-preview-title mb-1">{formData.storeName || 'Your Store Name'}</h4>
                <p className="seller-store-preview-tagline mb-3">{formData.tagline || 'Add a compelling tagline to win attention.'}</p>
                <p className="seller-store-preview-about mb-3">{formData.about || 'Tell shoppers about your craft, sourcing story, and what makes you different.'}</p>
                <div className="seller-store-preview-categories d-flex flex-wrap gap-2 mb-3">
                  {formData.featuredCategories
                    ?.split(',')
                    .map(entry => entry.trim())
                    .filter(Boolean)
                    .map((entry, idx) => (
                      <Badge key={`${entry || 'category'}-${idx}`} bg="primary" className="seller-store-preview-pill">
                        {entry || 'Category'}
                      </Badge>
                    ))}
                </div>
                <div className="seller-store-preview-meta text-muted small">
                  <div>📍 {formData.city || 'City'}, {formData.addressLine || 'Add an address for in-store pickup'}</div>
                  <div>⏱ {formData.fulfillmentTime || 'Set your fulfillment timeline'}</div>
                  <div>↩️ {formData.returnPolicy || 'Define how returns are handled'}</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 seller-store-card">
            <Card.Header className="seller-store-card-header">
              <h5 className="mb-0">Trust Checklist</h5>
            </Card.Header>
            <Card.Body className="seller-store-card-body">
              <ul className="seller-store-checklist list-unstyled mb-0">
                <li className="mb-3">
                  <i className={`fas fa-${formData.supportEmail ? 'check text-success' : 'minus text-warning'} me-2`}></i>
                  Dedicated support email
                </li>
                <li className="mb-3">
                  <i className={`fas fa-${formData.supportPhone ? 'check text-success' : 'minus text-warning'} me-2`}></i>
                  Local phone contact
                </li>
                <li className="mb-3">
                  <i className={`fas fa-${formData.about ? 'check text-success' : 'minus text-warning'} me-2`}></i>
                  Brand story completed
                </li>
                <li className="mb-3">
                  <i className={`fas fa-${formData.instagram || formData.facebook || formData.tiktok ? 'check text-success' : 'minus text-warning'} me-2`}></i>
                  Social media connected
                </li>
                <li>
                  <i className={`fas fa-${formData.pickupAvailable ? 'check text-success' : 'minus text-warning'} me-2`}></i>
                  Pickup option enabled
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerStoreProfilePage;
