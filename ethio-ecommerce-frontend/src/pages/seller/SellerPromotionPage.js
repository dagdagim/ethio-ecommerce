import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Table, ProgressBar, Alert } from 'react-bootstrap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { sellerAPI } from '../../services/api';
import '../../styles/sellerPromotion.css';

const typeLabelMap = {
  percentage: 'Percentage',
  amount: 'Fixed Amount',
  bundle: 'Bundle'
};

const statusVariantMap = {
  Running: 'success',
  Scheduled: 'primary',
  Draft: 'secondary',
  Completed: 'info',
  Archived: 'dark'
};

const SellerPromotionPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [formState, setFormState] = useState({
    title: '',
    type: 'percentage',
    discount: '',
    minSpend: '',
    startDate: '',
    endDate: '',
    audience: 'all-customers',
    description: ''
  });
  const [alert, setAlert] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      try {
        const { data } = await sellerAPI.getSellerPromotions();
        setPromotions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load promotions', err);
        setError('Unable to load promotions from the server right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const activePromotions = useMemo(
    () => promotions.filter(entry => entry.status !== 'Draft'),
    [promotions]
  );

  const draftPromotions = useMemo(
    () => promotions.filter(entry => entry.status === 'Draft'),
    [promotions]
  );

  const upcomingPromotion = useMemo(() => {
    return activePromotions
      .map(entry => ({ ...entry, start: entry.startDate ? new Date(entry.startDate) : null }))
      .filter(entry => entry.start && entry.start >= new Date())
      .sort((a, b) => a.start - b.start)[0];
  }, [activePromotions]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatePromotion = async (event) => {
    event.preventDefault();
    if (!formState.title || !formState.startDate || !formState.endDate) {
      setAlert('Please fill in the required fields to launch a promotion.');
      return;
    }

    const payload = {
      title: formState.title,
      type: formState.type,
      discountValue: Number(formState.discount) || 0,
      minSpend: Number(formState.minSpend) || 0,
      startDate: formState.startDate,
      endDate: formState.endDate,
      audience: formState.audience,
      description: formState.description,
      status: 'Scheduled'
    };

    try {
      const { data } = await sellerAPI.createSellerPromotion(payload);
      setPromotions(prev => [data, ...prev]);
      setError('');
      setAlert('Promotion created! Review and activate it when you are ready.');
      setFormState({
        title: '',
        type: 'percentage',
        discount: '',
        minSpend: '',
        startDate: '',
        endDate: '',
        audience: 'all-customers',
        description: ''
      });
    } catch (err) {
      console.error('Failed to create promotion', err);
      setAlert('');
      setError('Could not create promotion. Please try again.');
    }
  };

  const handlePromoteDraft = (draftId) => {
    const draft = promotions.find(entry => entry.id === draftId);
    if (!draft) return;
    setFormState(prev => ({
      ...prev,
      title: draft.title || draft.name || '',
      description: draft.idea || draft.description || ''
    }));
    setAlert('Draft loaded into the form. Review details before launching.');
  };

  const resetForm = () => {
    setFormState({
      title: '',
      type: 'percentage',
      discount: '',
      minSpend: '',
      startDate: '',
      endDate: '',
      audience: 'all-customers',
      description: ''
    });
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const handleStatusChange = async (promotionId, nextStatus) => {
    setProcessingId(promotionId);
    try {
      const { data } = await sellerAPI.updateSellerPromotion(promotionId, { status: nextStatus });
      setPromotions(prev => prev.map(promo => (promo.id === promotionId ? data : promo)));
      setError('');
      setAlert(`Promotion status updated to ${nextStatus}.`);
    } catch (err) {
      console.error('Failed to update promotion status', err);
      setAlert('');
      setError('Could not update promotion status. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading promotions..." />;
  }

  return (
    <Container fluid className="seller-promotion-container py-5">
      <Row className="align-items-center mb-4 seller-promotion-header">
        <Col>
          <h2 className="seller-promotion-title mb-1">Promotion Studio</h2>
          <p className="seller-promotion-subtitle mb-0">Design irresistible campaigns and boost conversions across your storefront.</p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center gap-3">
          {upcomingPromotion && (
            <div className="text-end seller-promotion-next">
              <small className="text-muted">Next scheduled launch</small>
              <div className="fw-semibold text-primary">{upcomingPromotion.title}</div>
            </div>
          )}
          <Button variant="outline-secondary" className="shadow-sm seller-promotion-secondary-btn">
            <i className="fas fa-lightbulb me-2"></i>
            Inspiration Gallery
          </Button>
        </Col>
      </Row>

      {alert && (
        <Alert variant="info" dismissible onClose={() => setAlert('')} className="shadow-sm seller-promotion-alert">
          {alert}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="shadow-sm seller-promotion-alert">
          {error}
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={5}>
          <Card className="shadow-sm border-0 seller-promotion-form-card">
            <Card.Body>
              <div className="seller-promotion-form-header mb-3">
                <div>
                  <h5 className="mb-0">Create a Promotion</h5>
                  <small className="text-muted">Blend discounts, time windows, and target audiences.</small>
                </div>
                <Badge bg="primary" className="seller-promotion-badge">New</Badge>
              </div>

              <div className="seller-promotion-form-highlights mb-4">
                <div className="seller-promotion-chip">
                  <i className="fas fa-stopwatch"></i>
                  <span>Drive urgency with timed launches</span>
                </div>
                <div className="seller-promotion-chip">
                  <i className="fas fa-users"></i>
                  <span>Target loyal and new shoppers</span>
                </div>
                <div className="seller-promotion-chip">
                  <i className="fas fa-magic"></i>
                  <span>Tell a story with your offer</span>
                </div>
              </div>

              <Form onSubmit={handleCreatePromotion} className="seller-promotion-form">
                <Form.Group className="seller-promotion-field">
                  <Form.Label>Promotion Title *</Form.Label>
                  <Form.Control
                    className="seller-promotion-input"
                    name="title"
                    value={formState.title}
                    onChange={handleChange}
                    placeholder="Example: Meskel Weekend Sale"
                    required
                  />
                </Form.Group>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="seller-promotion-field h-100">
                      <Form.Label>Promotion Type</Form.Label>
                      <Form.Select
                        className="seller-promotion-input"
                        name="type"
                        value={formState.type}
                        onChange={handleChange}
                      >
                        <option value="percentage">Percentage off</option>
                        <option value="amount">Fixed amount off</option>
                        <option value="bundle">Bundle / BOGO</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="seller-promotion-field h-100">
                      <Form.Label>{formState.type === 'bundle' ? 'Bundle Ratio' : 'Discount Value (%)'}</Form.Label>
                      <Form.Control
                        className="seller-promotion-input"
                        name="discount"
                        type="number"
                        min={0}
                        step="0.1"
                        value={formState.discount}
                        onChange={handleChange}
                        placeholder={formState.type === 'bundle' ? 'e.g. 3 for 2' : 'Enter % or amount'}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="seller-promotion-field">
                      <Form.Label>Starts *</Form.Label>
                      <Form.Control
                        className="seller-promotion-input"
                        type="date"
                        name="startDate"
                        value={formState.startDate}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="seller-promotion-field">
                      <Form.Label>Ends *</Form.Label>
                      <Form.Control
                        className="seller-promotion-input"
                        type="date"
                        name="endDate"
                        value={formState.endDate}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="seller-promotion-field">
                      <Form.Label>Minimum Spend</Form.Label>
                      <Form.Control
                        className="seller-promotion-input"
                        name="minSpend"
                        type="number"
                        min={0}
                        value={formState.minSpend}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="seller-promotion-field">
                      <Form.Label>Audience</Form.Label>
                      <Form.Select
                        className="seller-promotion-input"
                        name="audience"
                        value={formState.audience}
                        onChange={handleChange}
                      >
                        <option value="all-customers">All customers</option>
                        <option value="loyalty">Loyalty members</option>
                        <option value="new-customers">New customers</option>
                        <option value="custom-segment">Custom segment</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="seller-promotion-field">
                  <Form.Label>Promotion Story</Form.Label>
                  <Form.Control
                    className="seller-promotion-input"
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formState.description}
                    onChange={handleChange}
                    placeholder="Describe the hook, hero products, or creative direction."
                  />
                  <Form.Text className="seller-promotion-hint">Share the emotional angle for your marketing assets.</Form.Text>
                </Form.Group>

                <div className="seller-promotion-form-actions">
                  <Button type="submit" variant="success" className="shadow-sm seller-promotion-primary">
                    <i className="fas fa-bullhorn me-2"></i>
                    Launch Promotion
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="seller-promotion-secondary"
                    onClick={resetForm}
                  >
                    Reset Form
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="shadow-sm border-0 mb-4 seller-promotion-panel">
            <Card.Header className="seller-promotion-panel-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Active Campaigns</h5>
                <small className="text-muted">Monitor live promotions and adapt in real time.</small>
              </div>
              <Badge bg="info" className="seller-promotion-badge">{activePromotions.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {activePromotions.length === 0 ? (
                <div className="text-center text-muted py-4 seller-promotion-empty">
                  <i className="fas fa-bullhorn fa-2x mb-3"></i>
                  <p className="mb-0">No active campaigns yet. Launch one to see insights here.</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0 align-middle seller-promotion-table">
                  <thead className="seller-promotion-table-head">
                    <tr>
                      <th>Promotion</th>
                      <th>Schedule</th>
                      <th>Type</th>
                      <th>Performance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePromotions.map(entry => (
                      <tr key={entry.id}>
                        <td className="fw-semibold seller-promotion-name">{entry.title}</td>
                        <td>
                          <div>{formatDate(entry.startDate)}</div>
                          <small className="text-muted">to {formatDate(entry.endDate)}</small>
                        </td>
                        <td>{typeLabelMap[entry.type] || entry.type}</td>
                        <td>
                          <ProgressBar
                            className="seller-promotion-progress"
                            now={entry.performance || 0}
                            variant={entry.performance >= 75 ? 'success' : entry.performance >= 40 ? 'warning' : 'danger'}
                            label={`${entry.performance || 0}%`}
                          />
                        </td>
                        <td>
                          <Badge bg={statusVariantMap[entry.status] || 'secondary'} className="seller-promotion-badge">{entry.status}</Badge>
                        </td>
                        <td>
                          {entry.status === 'Running' ? (
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled={processingId === entry.id}
                              className="seller-promotion-action-btn"
                              onClick={() => handleStatusChange(entry.id, 'Completed')}
                            >
                              {processingId === entry.id ? 'Saving…' : 'Mark Complete'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="success"
                              disabled={processingId === entry.id}
                              className="seller-promotion-action-btn"
                              onClick={() => handleStatusChange(entry.id, 'Running')}
                            >
                              {processingId === entry.id ? 'Saving…' : 'Activate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 seller-promotion-panel">
            <Card.Header className="seller-promotion-panel-header">
              <div className="d-flex justify-content-between align-items-center w-100">
                <h5 className="mb-0">Idea Board</h5>
                <Badge bg="warning" text="dark" className="seller-promotion-badge">{draftPromotions.length}</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {draftPromotions.length === 0 ? (
                <div className="text-center text-muted py-4 seller-promotion-empty">
                  <i className="fas fa-mug-hot fa-2x mb-3 text-warning"></i>
                  <p className="mb-0">All your promotion ideas have been moved into planning.</p>
                </div>
              ) : (
                draftPromotions.map(draft => (
                  <Card key={draft.id} className="mb-3 border shadow-sm seller-promotion-draft">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{draft.title}</h6>
                          <p className="mb-2 text-muted">{draft.idea || draft.description}</p>
                        </div>
                        <Button size="sm" variant="outline-primary" className="seller-promotion-action-btn" onClick={() => handlePromoteDraft(draft.id)}>
                          Use Template
                        </Button>
                        <Button
                          size="sm"
                          className="ms-2 seller-promotion-action-btn"
                          variant="success"
                          disabled={processingId === draft.id}
                          onClick={() => handleStatusChange(draft.id, 'Running')}
                        >
                          {processingId === draft.id ? 'Saving…' : 'Activate'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerPromotionPage;
