import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Message from '../components/common/Message';
import '../styles/orders.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const { formatPrice } = useApp();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!copyFeedback) return undefined;
    const timeout = setTimeout(() => setCopyFeedback(''), 2500);
    return () => clearTimeout(timeout);
  }, [copyFeedback]);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getOrders();
      setOrders(response.data.data);
    } catch (error) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'primary',
      shipped: 'secondary',
      delivered: 'success',
      cancelled: 'danger',
      returned: 'dark'
    };
    return variants[status] || 'secondary';
  };

  const getPaymentStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      failed: 'danger',
      refunded: 'dark',
      cancelled: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openTrackingModal = (order) => {
    setTrackingOrder(order);
    setShowTrackingModal(true);
    setCopyFeedback('');
  };

  const closeTrackingModal = () => {
    setShowTrackingModal(false);
    setTrackingOrder(null);
    setCopyFeedback('');
  };

  const handleCopyTrackingNumber = async (trackingNumber) => {
    if (!trackingNumber) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(trackingNumber);
        setCopyFeedback('Tracking number copied!');
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      console.warn('Clipboard copy failed, falling back to prompt.', err);
      window.prompt('Copy the tracking number:', trackingNumber);
      setCopyFeedback('Copied manually.');
    }
  };

  const buildTrackingDetails = (order) => {
    if (!order) {
      return { steps: [], currentIndex: -1 };
    }

    const steps = [
      {
        key: 'pending',
        label: 'Order Placed',
        description: 'We received your order and sent a confirmation email.'
      },
      {
        key: 'confirmed',
        label: 'Order Confirmed',
        description: 'A seller confirmed item availability.'
      },
      {
        key: 'processing',
        label: 'Preparing Order',
        description: 'Items are being packaged for shipment.'
      },
      {
        key: 'shipped',
        label: 'Shipped',
        description: 'Your package is on the way to the delivery address.'
      },
      {
        key: 'delivered',
        label: 'Delivered',
        description: 'The package arrived at its destination.'
      }
    ];

    if (order.status === 'cancelled') {
      steps.push({
        key: 'cancelled',
        label: 'Order Cancelled',
        description: order.cancellationReason || 'The order was cancelled.',
        variant: 'danger'
      });
    } else if (order.status === 'returned') {
      steps.push({
        key: 'returned',
        label: 'Return Completed',
        description: order.returnReason || 'The order was returned and processed.',
        variant: 'warning'
      });
    }

    const currentIndex = steps.findIndex(step => step.key === order.status);
    const effectiveIndex = currentIndex >= 0 ? currentIndex : steps.findIndex(step => step.key === 'delivered');

    const decoratedSteps = steps.map((step, index) => {
      let state = 'upcoming';
      if (effectiveIndex < 0) {
        state = index === 0 ? 'current' : 'upcoming';
      } else if (index < effectiveIndex) {
        state = 'completed';
      } else if (index === effectiveIndex) {
        state = order.status === 'cancelled' ? 'cancelled' : order.status === 'returned' ? 'returned' : 'current';
      }
      return {
        ...step,
        state
      };
    });

    return { steps: decoratedSteps, currentIndex: effectiveIndex };
  };

  const renderStepIcon = (step) => {
    if (step.state === 'cancelled') {
      return <i className="fas fa-ban text-danger me-2"></i>;
    }
    if (step.state === 'returned') {
      return <i className="fas fa-undo text-warning me-2"></i>;
    }
    if (step.state === 'completed') {
      return <i className="fas fa-check-circle text-success me-2"></i>;
    }
    if (step.state === 'current') {
      return <i className="fas fa-dot-circle text-primary me-2"></i>;
    }
    return <i className="far fa-circle text-muted me-2"></i>;
  };

  if (loading) return <LoadingSpinner message="Loading your orders..." />;

  return (
    <Container className="orders-page py-4">
      <Row>
        <Col>
          <div className="page-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-0">My Orders</h1>
              <p className="text-muted small mb-0">Track and manage your purchases</p>
            </div>
            <Form.Select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </div>

          {error && <Message variant="danger">{error}</Message>}

          {filteredOrders.length === 0 ? (
            <Message variant="info">
              <div className="empty-state text-center py-4">
                <div className="empty-illustration mb-3">📦</div>
                <h4 className="mb-1">No orders found</h4>
                <p className="text-muted mb-3">
                  {filter === 'all' 
                    ? "You haven't placed any orders yet." 
                    : `No ${filter} orders found.`}
                </p>
                <Button as={Link} to="/products" variant="primary" size="lg">
                  Start Shopping
                </Button>
              </div>
            </Message>
          ) : (
            <Card className="order-card">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 order-table">
                  <thead className="bg-light">
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order._id} className="order-row">
                        <td>
                          <strong>{order.orderNumber}</strong>
                        </td>
                        <td>
                          <small>{formatDate(order.createdAt)}</small>
                        </td>
                        <td>
                          <div className="items-inline">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="d-flex align-items-center me-3 mb-1 item-mini">
                                <img 
                                  src={item.image} 
                                  alt={item.name.en}
                                  className="rounded item-thumb"
                                />
                                <div className="d-flex flex-column">
                                  <small className="text-truncate item-name">{item.name.en}</small>
                                  {item.quantity > 1 && (
                                    <small className="text-muted">x{item.quantity}</small>
                                  )}
                                </div>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <small className="text-muted">+{order.items.length - 3} more</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong>{formatPrice(order.totalAmount)}</strong>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <Badge bg={getStatusVariant(order.status)} className="mb-1">
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {order.trackingNumber && (
                              <small className="text-muted tracking-sn">Track: {order.trackingNumber}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg={getPaymentStatusVariant(order.paymentStatus)}>
                            {order.paymentStatus.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div>
                            <small className="text-muted text-capitalize">
                              {order.paymentMethod?.replace('_', ' ')}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-2 actions-col">
                            <Button
                              as={Link}
                              to={`/order/${order._id}`}
                              variant="outline-primary"
                              size="sm"
                            >
                              View
                            </Button>
                            {order.trackingNumber && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => openTrackingModal(order)}
                              >
                                Track Package
                              </Button>
                            )}
                            {order.status === 'pending' && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to cancel this order?')) {
                                    try {
                                      await ordersAPI.cancelOrder(order._id, 'Cancelled by customer');
                                      fetchOrders(); // Refresh orders
                                    } catch (error) {
                                      alert('Failed to cancel order');
                                    }
                                  }
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                            {order.status === 'delivered' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
                                  // Implement reorder functionality
                                  alert('Reorder functionality coming soon!');
                                }}
                              >
                                Reorder
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Order Statistics */}
          {orders.length > 0 && (
            <Row className="mt-4">
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3>{orders.length}</h3>
                    <p className="text-muted mb-0">Total Orders</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-success">
                      {orders.filter(o => o.status === 'delivered').length}
                    </h3>
                    <p className="text-muted mb-0">Delivered</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-primary">
                      {orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length}
                    </h3>
                    <p className="text-muted mb-0">In Progress</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-danger">
                      {orders.filter(o => o.status === 'cancelled').length}
                    </h3>
                    <p className="text-muted mb-0">Cancelled</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Col>
      </Row>

      <Modal show={showTrackingModal} onHide={closeTrackingModal} centered size="lg" dialogClassName="tracking-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center gap-2">
              <i className="fas fa-shipping-fast fa-lg text-primary"></i>
              <div>
                <div>Track Shipment</div>
                <small className="text-muted">Real-time updates and timeline</small>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="tracking-modal-body">
          {trackingOrder && (
            <>
              <Row className="mb-3">
                <Col md={6} className="mb-3">
                  <p className="text-muted mb-1">Tracking Number</p>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h5 className="mb-0">{trackingOrder.trackingNumber}</h5>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleCopyTrackingNumber(trackingOrder.trackingNumber)}
                    >
                      Copy
                    </Button>
                    {copyFeedback && (
                      <Badge bg="success" className="ms-2">{copyFeedback}</Badge>
                    )}
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <p className="text-muted mb-1">Carrier</p>
                  <div>{trackingOrder.carrier || 'Not provided'}</div>
                </Col>
                <Col md={3} className="mb-3">
                  <p className="text-muted mb-1">Shipping Method</p>
                  <div className="text-capitalize">{trackingOrder.shippingMethod || 'Standard'}</div>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={4} className="mb-3">
                  <p className="text-muted mb-1">Order Status</p>
                  <Badge bg={getStatusVariant(trackingOrder.status)}>
                    {trackingOrder.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </Col>
                <Col md={4} className="mb-3">
                  <p className="text-muted mb-1">Placed On</p>
                  <div>{formatDateOnly(trackingOrder.createdAt)}</div>
                </Col>
                <Col md={4} className="mb-3">
                  <p className="text-muted mb-1">Estimated Delivery</p>
                  <div>
                    {trackingOrder.estimatedDelivery
                      ? formatDateOnly(trackingOrder.estimatedDelivery)
                      : 'Pending update'}
                  </div>
                </Col>
              </Row>

              {(() => {
                const { steps, currentIndex } = buildTrackingDetails(trackingOrder);
                const progressPercent = steps.length
                  ? Math.min(100, Math.round(((currentIndex >= 0 ? currentIndex + 1 : 1) / steps.length) * 100))
                  : 0;

                return (
                  <>
                    <div className="mb-3">
                      <ProgressBar now={progressPercent} label={`${progressPercent}%`} visuallyHidden={progressPercent === 0} />
                      {progressPercent === 0 && (
                        <small className="text-muted">Tracking updates will appear once your order is processed.</small>
                      )}
                    </div>
                    <div className="tracking-timeline">
                      {steps.map(step => (
                        <div key={step.key} className={`tracking-step ${step.state}`}>
                          <div className="step-icon">{renderStepIcon(step)}</div>
                          <div className="step-content">
                            <div className="fw-semibold d-flex align-items-center gap-2">
                              {step.label}
                              {step.state === 'cancelled' && (
                                <Badge bg="danger">Cancelled</Badge>
                              )}
                              {step.state === 'returned' && (
                                <Badge bg="warning" text="dark">Returned</Badge>
                              )}
                              {step.state === 'current' && step.key !== 'delivered' && step.key !== 'shipped' && (
                                <Badge bg="primary">In Progress</Badge>
                              )}
                            </div>
                            <small className="text-muted">{step.description}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeTrackingModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrdersPage;