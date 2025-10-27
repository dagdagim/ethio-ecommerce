import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { campaignsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';

const MarketingCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    message: '',
    template: 'basic',
    audience: {
      type: 'all_customers',
      segment: {
        minOrders: 0,
        minSpent: 0,
        lastPurchaseDays: '',
        regions: [],
        tags: []
      }
    },
    scheduledFor: '',
    isAutomated: false,
    trigger: {
      type: 'welcome',
      delay: 0
    }
  });

  useEffect(() => {
    fetchCampaigns();
  }, [filter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Mock campaigns data
      const mockCampaigns = [
        {
          _id: '1',
          name: 'Welcome Email Series',
          type: 'email',
          status: 'sent',
          subject: 'Welcome to Our Store!',
          message: 'Thank you for joining us. Get 10% off your first purchase.',
          metrics: {
            sent: 1250,
            delivered: 1200,
            opened: 850,
            clicked: 320,
            converted: 45
          },
          scheduledFor: '2024-01-15T10:00:00Z',
          sentAt: '2024-01-15T10:00:00Z',
          isAutomated: true,
          trigger: { type: 'welcome', delay: 1 }
        },
        {
          _id: '2',
          name: 'Spring Sale Announcement',
          type: 'email',
          status: 'scheduled',
          subject: 'Spring Sale - Up to 50% Off!',
          message: 'Don\'t miss our biggest sale of the season...',
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            converted: 0
          },
          scheduledFor: '2024-03-20T08:00:00Z',
          isAutomated: false
        },
        {
          _id: '3',
          name: 'Abandoned Cart Reminder',
          type: 'sms',
          status: 'sending',
          message: 'You left items in your cart! Complete your purchase now.',
          metrics: {
            sent: 156,
            delivered: 150,
            opened: 0,
            clicked: 0,
            converted: 12
          },
          isAutomated: true,
          trigger: { type: 'abandoned_cart', delay: 24 }
        }
      ];

      let filteredCampaigns = mockCampaigns;

      if (filter !== 'all') {
        filteredCampaigns = mockCampaigns.filter(campaign => 
          filter === 'automated' ? campaign.isAutomated :
          filter === 'manual' ? !campaign.isAutomated :
          campaign.status === filter
        );
      }

      setCampaigns(filteredCampaigns);
    } catch (error) {
      setError('Failed to load campaigns');
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      type: 'email',
      subject: '',
      message: '',
      template: 'basic',
      audience: {
        type: 'all_customers',
        segment: {
          minOrders: 0,
          minSpent: 0,
          lastPurchaseDays: '',
          regions: [],
          tags: []
        }
      },
      scheduledFor: '',
      isAutomated: false,
      trigger: {
        type: 'welcome',
        delay: 0
      }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In real app: await campaignsAPI.createCampaign(formData);
      console.log('Creating campaign:', formData);
      setShowModal(false);
      fetchCampaigns();
    } catch (error) {
      alert('Failed to create campaign');
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      draft: 'secondary',
      scheduled: 'warning',
      sending: 'info',
      sent: 'success',
      cancelled: 'danger'
    };
    return variants[status] || 'secondary';
  };

  const getTypeIcon = (type) => {
    return type === 'email' ? 'fas fa-envelope' : 'fas fa-sms';
  };

  const calculateMetrics = (campaign) => {
    const openRate = campaign.metrics.sent > 0 ? 
      (campaign.metrics.opened / campaign.metrics.sent) * 100 : 0;
    const clickRate = campaign.metrics.opened > 0 ? 
      (campaign.metrics.clicked / campaign.metrics.opened) * 100 : 0;
    const conversionRate = campaign.metrics.clicked > 0 ? 
      (campaign.metrics.converted / campaign.metrics.clicked) * 100 : 0;

    return { openRate, clickRate, conversionRate };
  };

  if (loading) return <LoadingSpinner message="Loading campaigns..." />;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Marketing Campaigns</h1>
          <p className="text-muted mb-0">Manage email and SMS marketing campaigns</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select 
            style={{ width: '200px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Campaigns</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="automated">Automated</option>
            <option value="manual">Manual</option>
          </Form.Select>
          <Button variant="primary" onClick={handleCreateClick}>
            <i className="fas fa-plus me-2"></i>
            Create Campaign
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Campaign Statistics */}
      <Row className="mb-4">
        <Col xl={2} md={4} sm={6}>
          <Card className="border-primary">
            <Card.Body className="text-center">
              <h4 className="text-primary">{campaigns.length}</h4>
              <small className="text-muted">Total Campaigns</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-success">
            <Card.Body className="text-center">
              <h4 className="text-success">
                {campaigns.filter(c => c.status === 'sent').length}
              </h4>
              <small className="text-muted">Sent</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-warning">
            <Card.Body className="text-center">
              <h4 className="text-warning">
                {campaigns.filter(c => c.status === 'scheduled').length}
              </h4>
              <small className="text-muted">Scheduled</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-info">
            <Card.Body className="text-center">
              <h4 className="text-info">
                {campaigns.filter(c => c.isAutomated).length}
              </h4>
              <small className="text-muted">Automated</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-secondary">
            <Card.Body className="text-center">
              <h4 className="text-secondary">
                {campaigns.reduce((sum, c) => sum + c.metrics.converted, 0)}
              </h4>
              <small className="text-muted">Total Conversions</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-danger">
            <Card.Body className="text-center">
              <h4 className="text-danger">
                {campaigns.filter(c => c.type === 'sms').length}
              </h4>
              <small className="text-muted">SMS Campaigns</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Campaigns ({campaigns.length})
            {filter !== 'all' && <span className="text-muted"> - {filter}</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Campaign</th>
                <th>Type</th>
                <th>Status</th>
                <th>Metrics</th>
                <th>Audience</th>
                <th>Schedule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => {
                const metrics = calculateMetrics(campaign);
                return (
                  <tr key={campaign._id}>
                    <td>
                      <div>
                        <div className="fw-semibold">{campaign.name}</div>
                        {campaign.subject && (
                          <small className="text-muted">{campaign.subject}</small>
                        )}
                        {campaign.isAutomated && (
                          <Badge bg="info" className="ms-1">Auto</Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg={campaign.type === 'email' ? 'primary' : 'success'}>
                        <i className={getTypeIcon(campaign.type)}></i> {campaign.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getStatusVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="small">
                        <div>Sent: {campaign.metrics.sent}</div>
                        <div>Open: {metrics.openRate.toFixed(1)}%</div>
                        <div>Click: {metrics.clickRate.toFixed(1)}%</div>
                        <div>Convert: {metrics.conversionRate.toFixed(1)}%</div>
                      </div>
                    </td>
                    <td>
                      <small>
                        {campaign.audience?.type === 'all_customers' ? 'All Customers' :
                         campaign.audience?.type === 'segment' ? 'Segment' : 'Specific'}
                      </small>
                    </td>
                    <td>
                      <small>
                        {campaign.scheduledFor ? 
                          new Date(campaign.scheduledFor).toLocaleDateString() :
                          'Immediate'
                        }
                      </small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                        >
                          View
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                          >
                            Send
                          </Button>
                        )}
                        {campaign.status === 'scheduled' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {campaigns.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-bullhorn fa-3x text-muted mb-3"></i>
              <h5>No campaigns found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'No marketing campaigns have been created yet.' : `No ${filter} campaigns found.`}
              </p>
              <Button variant="primary" onClick={handleCreateClick}>
                Create Your First Campaign
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Campaign Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Campaign Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Campaign Type *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.type === 'email' && (
              <Form.Group className="mb-3">
                <Form.Label>Email Subject *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
                placeholder={
                  formData.type === 'email' ? 
                  'Write your email message here...' :
                  'Write your SMS message here...'
                }
              />
              {formData.type === 'sms' && (
                <Form.Text className="text-muted">
                  SMS character count: {formData.message.length}/160
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Target Audience</Form.Label>
              <Form.Select
                value={formData.audience.type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  audience: { ...prev.audience, type: e.target.value }
                }))}
              >
                <option value="all_customers">All Customers</option>
                <option value="segment">Customer Segment</option>
                <option value="specific_customers">Specific Customers</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule For</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                  <Form.Text className="text-muted">
                    Leave empty to send immediately
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Automated Campaign"
                    checked={formData.isAutomated}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAutomated: e.target.checked }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            {formData.isAutomated && (
              <Form.Group className="mb-3">
                <Form.Label>Trigger Type</Form.Label>
                <Form.Select
                  value={formData.trigger.type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    trigger: { ...prev.trigger, type: e.target.value }
                  }))}
                >
                  <option value="welcome">Welcome (New Customer)</option>
                  <option value="abandoned_cart">Abandoned Cart</option>
                  <option value="purchase">After Purchase</option>
                  <option value="birthday">Birthday</option>
                  <option value="inactivity">Inactivity</option>
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MarketingCampaignsPage;