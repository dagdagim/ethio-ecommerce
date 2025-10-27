import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ordersAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    trackingNumber: '',
    carrier: '',
    internalNotes: ''
  });
  const [updatingOrder, setUpdatingOrder] = useState(false);

  const { formatPrice } = useApp();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrders();
      let filteredOrders = response.data.data;

      if (filter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filter);
      }

      setOrders(filteredOrders);
      setError('');
    } catch (error) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleUpdateClick = (order) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      carrier: order.carrier || '',
      internalNotes: order.internalNotes || ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.error('No order selected for update');
      return;
    }

    if (!updateData.status) {
      toast.error('Please select a status');
      return;
    }

    setUpdatingOrder(true);
    try {
      const payload = {
        status: updateData.status,
        trackingNumber: updateData.trackingNumber?.trim() || '',
        carrier: updateData.carrier?.trim() || '',
        internalNotes: updateData.internalNotes?.trim() || ''
      };

      await ordersAPI.updateOrderStatus(selectedOrder._id, payload);
      toast.success('Order updated successfully');
      setShowUpdateModal(false);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      const message = error.response?.data?.message || 'Failed to update order';
      toast.error(message);
    }
    finally {
      setUpdatingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await ordersAPI.cancelOrder(orderId, 'Cancelled by admin');
        fetchOrders();
      } catch (error) {
        alert('Failed to cancel order');
      }
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    return allStatuses.map(status => (
      <option key={status} value={status}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
        {status === currentStatus ? ' (current)' : ''}
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

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Order Management</h1>
          <p className="text-muted mb-0">Manage and process customer orders</p>
        </div>
        <Form.Select 
          style={{ width: '200px' }}
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
          <option value="returned">Returned</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Orders ({orders.length})
            {filter !== 'all' && <span className="text-muted"> - {filter}</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>
                    <Link to={`/admin/orders/${order._id}`} className="text-decoration-none fw-bold">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td>
                    <div>
                      <div className="fw-semibold">{order.customer?.name}</div>
                      <small className="text-muted">{order.customer?.phone}</small>
                    </div>
                  </td>
                  <td>
                    <small>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </small>
                  </td>
                  <td>
                    <strong>{formatPrice(order.totalAmount)}</strong>
                  </td>
                  <td>
                    <Badge bg={getStatusVariant(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <div>
                      <small className="text-capitalize">{order.paymentMethod}</small>
                      <br />
                      <Badge bg={order.paymentStatus === 'completed' ? 'success' : 'warning'} className="mt-1">
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <small>{formatDate(order.createdAt)}</small>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        as={Link}
                        to={`/admin/orders/${order._id}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleUpdateClick(order)}
                      >
                        Update
                      </Button>
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {orders.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
              <h5>No orders found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'No orders have been placed yet.' : `No ${filter} orders found.`}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Update Order Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update Order #{selectedOrder?.orderNumber}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Status</Form.Label>
                  <Form.Select
                    value={updateData.status}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    {selectedOrder && getStatusOptions(selectedOrder.status)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
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
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Tracking Number</Form.Label>
              <Form.Control
                type="text"
                value={updateData.trackingNumber}
                onChange={(e) => setUpdateData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Enter tracking number"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Internal Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={updateData.internalNotes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, internalNotes: e.target.value }))}
                placeholder="Add internal notes about this order..."
              />
            </Form.Group>

            {selectedOrder && (
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Order Summary</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <strong>Customer:</strong> {selectedOrder.customer?.name}<br />
                      <strong>Phone:</strong> {selectedOrder.customer?.phone}<br />
                      <strong>Email:</strong> {selectedOrder.customer?.email}
                    </Col>
                    <Col md={6}>
                      <strong>Items:</strong> {selectedOrder.items.length}<br />
                      <strong>Total:</strong> {formatPrice(selectedOrder.totalAmount)}<br />
                      <strong>Payment:</strong> {selectedOrder.paymentMethod}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={updatingOrder}>
              {updatingOrder ? 'Updating...' : 'Update Order'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminOrdersPage;