import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Image } from 'react-bootstrap';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Message from '../components/common/Message';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { formatPrice } = useApp();

  useEffect(() => {
    const resolvedOrder = location.state?.order;

    if (resolvedOrder) {
      setOrder(resolvedOrder);
      setLoading(false);
      return;
    }

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

    fetchOrder();
  }, [id, location.state]);

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

  if (loading) return <LoadingSpinner message="Loading order details..." />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!order) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center p-4 shadow-sm">
              <Card.Body>
                <div className="mb-3">
                  <i className="fas fa-shopping-basket fa-3x text-primary"></i>
                </div>
                <h3 className="mb-3">Order is being processed</h3>
                <p className="text-muted mb-4">
                  Your order request has been submitted. It may take a few moments to appear in your account.
                </p>
                <div className="d-grid gap-2">
                  <Button as={Link} to="/orders" variant="primary">
                    View My Orders
                  </Button>
                  <Button as={Link} to="/products" variant="outline-secondary">
                    Continue Shopping
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-success">
            <Card.Body className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
              </div>
              <h1 className="text-success mb-3">Order Confirmed!</h1>
              <p className="lead mb-4">
                Thank you for your order. Your order has been received and is being processed.
              </p>
              
              <div className="mb-4">
                <h4>Order #: {order.orderNumber}</h4>
                <Badge bg={getStatusVariant(order.status)} className="fs-6">
                  {order.status.toUpperCase()}
                </Badge>
              </div>

              <div className="row text-start mb-4">
                <div className="col-md-6">
                  <h5>Shipping Address</h5>
                  <p className="mb-1"><strong>{order.shippingAddress.name}</strong></p>
                  <p className="mb-1">{order.shippingAddress.phone}</p>
                  <p className="mb-1">
                    {order.shippingAddress.specificLocation}
                  </p>
                  <p className="mb-1">
                    {order.shippingAddress.city}, {order.shippingAddress.region}
                  </p>
                </div>
                <div className="col-md-6">
                  <h5>Order Details</h5>
                  <p className="mb-1"><strong>Payment Method:</strong> {order.paymentMethod}</p>
                  <p className="mb-1"><strong>Payment Status:</strong> {order.paymentStatus}</p>
                  <p className="mb-1"><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                  {order.estimatedDelivery && (
                    <p className="mb-1">
                      <strong>Estimated Delivery:</strong> {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <Table striped bordered className="mb-4">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Image
                            src={item.image}
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80?text=No+Image'; }}
                            width={50}
                            height={50}
                            rounded
                            style={{ objectFit: 'cover' }}
                            alt={item.name?.en || `Product ${index + 1}`}
                          />
                          <div>
                            <div>{item.name?.en || item.name}</div>
                            {item.name?.am && (
                              <small className="text-muted d-block">{item.name.am}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Shipping:</strong></td>
                    <td><strong>{formatPrice(order.shippingCost)}</strong></td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td><strong>{formatPrice(order.totalAmount)}</strong></td>
                  </tr>
                </tbody>
              </Table>

              <div className="d-grid gap-2 d-md-flex justify-content-center">
                <Button as={Link} to="/products" variant="outline-primary" size="lg">
                  Continue Shopping
                </Button>
                <Button as={Link} to="/orders" variant="primary" size="lg">
                  View All Orders
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderSuccessPage;