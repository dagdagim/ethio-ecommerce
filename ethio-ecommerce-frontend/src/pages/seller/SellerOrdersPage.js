import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/sellerOrders.css';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    trackingNumber: '',
    carrier: ''
  });

  const { formatPrice } = useApp();
  const { user } = useAuth();

  const sellerId = user?._id;

  const belongsToSeller = useCallback((item) => {
    if (!sellerId || !item) return false;
    const sellerField = item.seller || item.product?.seller;

    if (!sellerField) return false;
    if (typeof sellerField === 'string') {
      return sellerField === sellerId;
    }

    if (typeof sellerField === 'object') {
      if (sellerField._id) {
        return sellerField._id === sellerId || sellerField._id?.toString?.() === sellerId;
      }
      if (sellerField.toString) {
        return sellerField.toString() === sellerId;
      }
    }

    return false;
  }, [sellerId]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrders();
      const payload = response.data?.data || [];

      const mappedOrders = payload
        .filter(order => order.items?.some(item => belongsToSeller(item)))
        .filter(order => filter === 'all' || order.status === filter);

      setOrders(mappedOrders);
    } catch (error) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [belongsToSeller, filter]);

  useEffect(() => {
    if (!sellerId) return;
    fetchOrders();
  }, [fetchOrders, sellerId]);

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

  const handleUpdateClick = (order) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      carrier: order.carrier || ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await ordersAPI.updateOrderStatus(selectedOrder._id, updateData);
      setShowUpdateModal(false);
      fetchOrders();
    } catch (error) {
      alert('Failed to update order');
    }
  };

  const getSellerItems = (order) => {
    if (!order?.items) return [];
    return order.items.filter(item => belongsToSeller(item));
  };

  const getSellerTotal = (order) => {
    const sellerItems = getSellerItems(order);
    return sellerItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };

    const availableStatuses = statusFlow[currentStatus] || [];
    return availableStatuses.map(status => (
      <option key={status} value={status}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </option>
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!sellerId) {
    return (
      <Container className="py-5">
        <LoadingSpinner message="Preparing your seller workspace..." />
      </Container>
    );
  }

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <Container fluid className="seller-orders-page-container py-5">
      <div className="seller-orders-topbar mb-4">
        <div>
          <h1 className="seller-orders-title">Order Management</h1>
          <p className="seller-orders-subtitle mb-0">Manage orders for your products</p>
        </div>
        <Form.Select
          className="seller-orders-filter"
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

      {error && <Alert variant="danger" className="seller-orders-alert">{error}</Alert>}

      {/* Order Statistics */}
      <Row className="seller-order-stats g-3 mb-4">
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-order-stat-card seller-order-total">
            <Card.Body className="text-center">
              <h4 className="seller-order-stat-value">{orders.length}</h4>
              <small className="seller-order-stat-label">Total Orders</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-order-stat-card seller-order-pending">
            <Card.Body className="text-center">
              <h4 className="seller-order-stat-value">
                {orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length}
              </h4>
              <small className="seller-order-stat-label">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-order-stat-card seller-order-shipped">
            <Card.Body className="text-center">
              <h4 className="seller-order-stat-value">
                {orders.filter(o => o.status === 'shipped').length}
              </h4>
              <small className="seller-order-stat-label">Shipped</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-order-stat-card seller-order-delivered">
            <Card.Body className="text-center">
              <h4 className="seller-order-stat-value">
                {orders.filter(o => o.status === 'delivered').length}
              </h4>
              <small className="seller-order-stat-label">Delivered</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-order-stat-card seller-order-cancelled">
            <Card.Body className="text-center">
              <h4 className="seller-order-stat-value">
                {orders.filter(o => o.status === 'cancelled').length}
              </h4>
              <small className="seller-order-stat-label">Cancelled</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-order-stat-card seller-order-revenue">
            <Card.Body className="text-center">
              <h4 className="seller-order-stat-value">
                {formatPrice(orders.reduce((total, order) => total + getSellerTotal(order), 0))}
              </h4>
              <small className="seller-order-stat-label">Total Revenue</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="seller-orders-table-card">
        <Card.Header className="seller-orders-table-header">
          <h5 className="mb-0 seller-orders-table-title">
            Orders ({orders.length})
            {filter !== 'all' && <span className="text-muted"> - {filter}</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-0 seller-orders-table-body">
          <Table responsive hover className="mb-0 seller-orders-table">
            <thead className="seller-orders-table-head">
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Your Items</th>
                <th>Your Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const sellerItems = getSellerItems(order);
                const sellerTotal = getSellerTotal(order);
                
                return (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/seller/orders/${order._id}`} className="seller-orders-link fw-bold">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold seller-orders-customer-name">{order.customer?.name}</div>
                        <small className="text-muted seller-orders-customer-contact">{order.customer?.phone}</small>
                      </div>
                    </td>
                    <td>
                      <div className="seller-orders-item-list">
                        {sellerItems.slice(0, 2).map((item, index) => (
                          <div key={index} className="d-flex align-items-center mb-1 seller-orders-item">
                            <img 
                              src={item.image} 
                              alt={item.name.en}
                              className="seller-orders-item-image me-2"
                            />
                            <small className="text-truncate seller-orders-item-name">
                              {item.name.en}
                            </small>
                            {item.quantity > 1 && (
                              <small className="text-muted ms-1 seller-orders-item-qty">x{item.quantity}</small>
                            )}
                          </div>
                        ))}
                        {sellerItems.length > 2 && (
                          <small className="text-muted seller-orders-more-items">
                            +{sellerItems.length - 2} more items
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong className="seller-orders-total">{formatPrice(sellerTotal)}</strong>
                    </td>
                    <td>
                      <Badge bg={getStatusVariant(order.status)} className="seller-orders-status-badge">
                        {order.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <small className="seller-orders-date">{formatDate(order.createdAt)}</small>
                    </td>
                    <td>
                      <div className="d-flex gap-1 seller-orders-actions">
                        <Button
                          as={Link}
                          to={`/seller/orders/${order._id}`}
                          variant="outline-primary"
                          size="sm"
                          className="seller-orders-action-btn"
                        >
                          View
                        </Button>
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="seller-orders-action-btn"
                            onClick={() => handleUpdateClick(order)}
                          >
                            Update
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {orders.length === 0 && (
            <div className="seller-orders-empty-state text-center py-5">
              <i className="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
              <h5>No orders found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'No orders for your products yet.' : `No ${filter} orders found.`}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

  {/* Update Order Modal */}
  <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} contentClassName="seller-orders-modal">
        <Modal.Header closeButton>
          <Modal.Title>Update Order #{selectedOrder?.orderNumber}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateSubmit}>
          <Modal.Body>
            {selectedOrder && (
              <>
                <div className="mb-3">
                  <strong>Customer:</strong> {selectedOrder.customer?.name}<br />
                  <strong>Your Items:</strong> {getSellerItems(selectedOrder).length} items<br />
                  <strong>Your Total:</strong> {formatPrice(getSellerTotal(selectedOrder))}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Update Status</Form.Label>
                  <Form.Select
                    value={updateData.status}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value={selectedOrder.status}>
                      Current: {selectedOrder.status}
                    </option>
                    {getStatusOptions(selectedOrder.status)}
                  </Form.Select>
                </Form.Group>

                {(updateData.status === 'shipped' || updateData.status === 'delivered') && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Carrier</Form.Label>
                      <Form.Select
                        value={updateData.carrier}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, carrier: e.target.value }))}
                      >
                        <option value="">Select Carrier</option>
                        <option value="ethiopian-post">Ethiopian Post</option>
                        <option value="dhl">DHL</option>
                        <option value="fedex">FedEx</option>
                        <option value="ups">UPS</option>
                        <option value="other">Other</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Tracking Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={updateData.trackingNumber}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                        placeholder="Enter tracking number"
                      />
                    </Form.Group>
                  </>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Order
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default SellerOrdersPage;