import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Message from '../components/common/Message';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { formatPrice } = useApp();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getOrder(id);
      setOrder(response.data.data);
    } catch (error) {
      setError('Order not found');
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
      cancelled: 'danger'
    };
    return variants[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await ordersAPI.cancelOrder(order._id, 'Cancelled by customer');
        fetchOrder(); // Refresh order data
      } catch (error) {
        alert('Failed to cancel order');
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading order details..." />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!order) return <Message variant="warning">Order not found</Message>;

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>Order Details</h1>
              <p className="text-muted mb-0">Order #: {order.orderNumber}</p>
            </div>
            <Button as={Link} to="/orders" variant="outline-primary">
              Back to Orders
            </Button>
          </div>

          {/* Order Status Alert */}
          <Alert variant={getStatusVariant(order.status)} className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="alert-heading mb-1">
                  Order is {order.status.replace('_', ' ')}
                </h5>
                {order.status === 'shipped' && order.trackingNumber && (
                  <p className="mb-0">Tracking Number: <strong>{order.trackingNumber}</strong></p>
                )}
                {order.estimatedDelivery && (
                  <p className="mb-0">
                    Estimated Delivery: <strong>{formatDate(order.estimatedDelivery)}</strong>
                  </p>
                )}
              </div>
              <Badge bg={getStatusVariant(order.status)} className="fs-6">
                {order.status.toUpperCase()}
              </Badge>
            </div>
          </Alert>

          <Row>
            {/* Order Items */}
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Order Items</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive>
                    <thead className="bg-light">
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img 
                                src={item.image} 
                                alt={item.name.en}
                                className="rounded me-3"
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                              />
                              <div>
                                <h6 className="mb-1">{item.name.en}</h6>
                                {item.name.am && (
                                  <small className="text-muted d-block">{item.name.am}</small>
                                )}
                                <small className="text-muted">SKU: {item.product?.sku || 'N/A'}</small>
                              </div>
                            </div>
                          </td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Order Notes */}
              {order.customerNotes && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Order Notes</h5>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0">{order.customerNotes}</p>
                  </Card.Body>
                </Card>
              )}
            </Col>

            {/* Order Summary */}
            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body>
                  <Table borderless className="mb-0">
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td className="text-end">
                          {formatPrice(order.items.reduce((sum, item) => sum + item.subtotal, 0))}
                        </td>
                      </tr>
                      <tr>
                        <td>Shipping:</td>
                        <td className="text-end">
                          {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Total:</strong></td>
                        <td className="text-end">
                          <strong>{formatPrice(order.totalAmount)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Shipping Information */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Shipping Information</h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-1"><strong>{order.shippingAddress.name}</strong></p>
                  <p className="mb-1">{order.shippingAddress.phone}</p>
                  <p className="mb-1">{order.shippingAddress.specificLocation}</p>
                  <p className="mb-1">
                    {order.shippingAddress.city}, {order.shippingAddress.region}
                  </p>
                  {order.shippingAddress.subcity && (
                    <p className="mb-1">Subcity: {order.shippingAddress.subcity}</p>
                  )}
                  {order.shippingAddress.woreda && (
                    <p className="mb-1">Woreda: {order.shippingAddress.woreda}</p>
                  )}
                  {order.shippingAddress.kebele && (
                    <p className="mb-0">Kebele: {order.shippingAddress.kebele}</p>
                  )}
                </Card.Body>
              </Card>

              {/* Payment Information */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Payment Information</h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">
                    <strong>Method:</strong> {order.paymentMethod?.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusVariant(order.paymentStatus)}>
                      {order.paymentStatus?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </p>
                  {order.paymentId && (
                    <p className="mb-0">
                      <strong>Reference:</strong> {order.paymentId}
                    </p>
                  )}
                </Card.Body>
              </Card>

              {/* Order Timeline */}
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Order Timeline</h5>
                </Card.Header>
                <Card.Body>
                  <div className="timeline">
                    <div className="timeline-item">
                      <small className="text-muted">Order Placed</small>
                      <div>{formatDate(order.createdAt)}</div>
                    </div>
                    {order.status !== 'pending' && (
                      <div className="timeline-item">
                        <small className="text-muted">Order Confirmed</small>
                        <div>{formatDate(order.updatedAt)}</div>
                      </div>
                    )}
                    {order.deliveredAt && (
                      <div className="timeline-item">
                        <small className="text-muted">Delivered</small>
                        <div>{formatDate(order.deliveredAt)}</div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {/* Action Buttons */}
              {order.status === 'pending' && (
                <div className="d-grid mt-3">
                  <Button variant="danger" onClick={handleCancelOrder}>
                    Cancel Order
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetailPage;