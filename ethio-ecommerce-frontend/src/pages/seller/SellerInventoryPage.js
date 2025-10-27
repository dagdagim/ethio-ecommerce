import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, ProgressBar, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';
import '../../styles/sellerInventory.css';

const statusVariant = {
  healthy: { label: 'Healthy', variant: 'success' },
  low: { label: 'Low', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' }
};

const SellerInventoryPage = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [restockQueue, setRestockQueue] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const selectedItem = useMemo(
    () => inventory.find(item => item.id === selectedId) || null,
    [inventory, selectedId]
  );
  const [formState, setFormState] = useState({ quantity: '', reason: 'restock', note: '' });

  const buildInventoryRows = (products = []) => {
    return products.map(product => {
      const stock = Number(product?.stock ?? 0);
      const reserved = Number(product?.inventory?.reserved ?? product?.reserved ?? 0);
      const incoming = Number(product?.inventory?.incoming ?? 0);
      const safetyStock = Number(product?.inventory?.safetyStock ?? product?.lowStockThreshold ?? 10);
      const status = stock === 0 ? 'critical' : stock < safetyStock ? 'low' : 'healthy';
      const coverage = safetyStock ? Math.min(100, Math.round((stock / safetyStock) * 100)) : 100;

      return {
        id: product._id,
        name: product?.name?.en || product?.name || 'Untitled Product',
        sku: product?.sku || 'N/A',
        stock,
        reserved,
        incoming,
        safetyStock,
        status,
        coverage,
        supplier: product?.supplier || 'Primary Supplier',
        leadTime: product?.inventory?.leadTime || '5 days'
      };
    });
  };

  const buildRestockSuggestions = (rows = []) => {
    return rows
      .filter(item => item.status !== 'healthy')
      .map(item => {
        const suggestedBase = item.safetyStock * 2;
        const suggestedQty = Math.max(suggestedBase - (item.stock + item.incoming), item.safetyStock);
        return {
          id: `restock-${item.id}`,
          productId: item.id,
          product: item.name,
          suggestedQty,
          leadTime: item.leadTime,
          supplier: item.supplier
        };
      });
  };

  const fetchInventory = useCallback(async () => {
    if (!user || user.role !== 'seller') {
      setLoading(false);
      if (user && user.role !== 'seller') {
        setError('Access denied. Seller privileges required.');
      }
      return;
    }

    const sellerId = user._id;
    if (!sellerId) {
      setLoading(false);
      setError('Unable to determine seller account.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await productsAPI.getProducts({ seller: sellerId, limit: 200 });
      const products = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const rows = buildInventoryRows(products);
      setInventory(rows);
      setRestockQueue(buildRestockSuggestions(rows));

      if (rows.length && !rows.some(row => row.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err?.response?.data?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [selectedId, user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSelectItem = (itemId) => {
    setSelectedId(itemId);
    const item = inventory.find(row => row.id === itemId);
    if (!item) return;
    setFormState({
      quantity: String(item.stock),
      reason: item.stock <= item.safetyStock ? 'restock' : 'adjustment',
      note: ''
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateInventory = async (event) => {
    event.preventDefault();
    if (!selectedItem) return;
    const quantity = Number(formState.quantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      setBanner({ variant: 'danger', text: 'Please provide a valid quantity.' });
      return;
    }

    try {
      setUpdating(true);
      await productsAPI.updateProduct(selectedItem.id, { stock: quantity });
      await fetchInventory();
      setBanner({ variant: 'success', text: 'Inventory updated successfully.' });
    } catch (err) {
      console.error('Failed to update inventory:', err);
      setBanner({
        variant: 'danger',
        text: err?.response?.data?.message || 'Failed to update inventory. Please try again.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToPurchaseOrder = (entryId) => {
    const entry = restockQueue.find(row => row.id === entryId);
    if (!entry) return;
    setBanner({
      variant: 'success',
      text: `Purchase order created for ${entry.product} (${entry.suggestedQty} units).`
    });
    setRestockQueue(prev => prev.filter(row => row.id !== entryId));
  };

  if (loading) {
    return <LoadingSpinner message="Loading inventory..." />;
  }

  if (error) {
    return <Message variant="danger">{error}</Message>;
  }

  if (!user || user.role !== 'seller') {
    return <Message variant="danger">Access denied. Seller privileges required.</Message>;
  }

  return (
    <Container fluid className="seller-inventory-container py-5">
      <Row className="seller-inventory-header mb-4">
        <Col>
          <h2 className="seller-inventory-title mb-1">Inventory Control Center</h2>
          <p className="seller-inventory-subtitle mb-0">
            Monitor stock levels, manage replenishment, and keep your best sellers available.
          </p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Button
            as={Link}
            to="/seller/products/add"
            variant="primary"
            className="seller-inventory-add-button shadow-sm"
          >
            <i className="fas fa-plus me-2"></i>
            Add New Product
          </Button>
        </Col>
      </Row>

      {banner && (
        <Alert
          variant={banner.variant}
          dismissible
          onClose={() => setBanner(null)}
          className="shadow-sm seller-inventory-alert"
        >
          {banner.text}
        </Alert>
      )}

      <Row className="g-4 align-items-stretch">
        <Col xl={8} className="d-flex flex-column">
          <Card className="h-100 shadow-sm seller-inventory-main-card">
            <Card.Header className="seller-inventory-card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Live Inventory</h5>
                <small className="text-muted">Tap a product row to adjust its availability.</small>
              </div>
              <Badge bg="info" className="seller-inventory-badge">{inventory.length} SKUs</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0 align-middle seller-inventory-table">
                <thead className="seller-inventory-table-head">
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-center">On Hand</th>
                    <th className="text-center">Reserved</th>
                    <th className="text-center">Incoming</th>
                    <th className="text-center">Coverage</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No inventory data available. Add products to start tracking stock.
                      </td>
                    </tr>
                  ) : (
                    inventory.map(item => {
                      const coverage = item.coverage;
                      const status = statusVariant[item.status] || statusVariant.healthy;
                      return (
                        <tr
                          key={item.id}
                          role="button"
                          className={`${selectedId === item.id ? 'table-primary' : ''} seller-inventory-table-row`}
                          onClick={() => handleSelectItem(item.id)}
                        >
                          <td className="fw-semibold seller-inventory-product-name">{item.name}</td>
                          <td className="text-muted seller-inventory-sku">{item.sku}</td>
                          <td className="text-center seller-inventory-count">{item.stock}</td>
                          <td className="text-center seller-inventory-count">{item.reserved}</td>
                          <td className="text-center seller-inventory-count">{item.incoming}</td>
                          <td>
                            <ProgressBar
                              className="seller-inventory-progress"
                              now={coverage}
                              variant={coverage < 40 ? 'danger' : coverage < 75 ? 'warning' : 'success'}
                              label={`${coverage}%`}
                            />
                          </td>
                          <td className="text-center">
                            <Badge bg={status.variant} className="seller-inventory-badge">{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4} className="d-flex flex-column">
          <Card className="mb-4 shadow-sm seller-inventory-adjust-card">
            <Card.Header className="seller-inventory-card-header">
              <h5 className="mb-0">Adjust Stock</h5>
            </Card.Header>
            <Card.Body>
              {selectedItem ? (
                <Form onSubmit={handleUpdateInventory}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-1 seller-inventory-selected-name">{selectedItem.name}</h6>
                      <Badge bg={statusVariant[selectedItem.status]?.variant || 'secondary'} className="seller-inventory-badge">
                        {statusVariant[selectedItem.status]?.label || 'Status Unknown'}
                      </Badge>
                    </div>
                    <small className="text-muted">SKU: {selectedItem.sku}</small>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Available Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      name="quantity"
                      min={0}
                      value={formState.quantity}
                      onChange={handleFormChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Reason</Form.Label>
                    <Form.Select name="reason" value={formState.reason} onChange={handleFormChange}>
                      <option value="restock">Restock received</option>
                      <option value="adjustment">Manual adjustment</option>
                      <option value="return">Customer return</option>
                      <option value="damage">Damaged or lost</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="note"
                      value={formState.note}
                      placeholder="Add context for your team..."
                      onChange={handleFormChange}
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button type="submit" variant="success" className="shadow-sm seller-inventory-primary-action" disabled={updating}>
                      <i className="fas fa-save me-2"></i>
                      {updating ? 'Updating...' : 'Apply Update'}
                    </Button>
                    <Button variant="outline-secondary" className="seller-inventory-secondary-action" onClick={() => setSelectedId(null)}>
                      Cancel
                    </Button>
                  </div>
                </Form>
              ) : (
                <div className="text-center py-4 text-muted seller-inventory-empty">
                  <i className="fas fa-clipboard-list fa-2x mb-3"></i>
                  <p className="mb-0">Select a product row to begin adjusting its stock.</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm flex-grow-1 seller-inventory-restock-card">
            <Card.Header className="seller-inventory-card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Restock Suggestions</h5>
                <small className="text-muted">Convert forecasts into purchase orders.</small>
              </div>
              <Badge bg="warning" text="dark" className="seller-inventory-badge">{restockQueue.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {restockQueue.length === 0 ? (
                <div className="text-center py-4 text-muted seller-inventory-empty">
                  <i className="fas fa-check-circle fa-2x mb-3 text-success"></i>
                  <p className="mb-0">No items need replenishment today.</p>
                </div>
              ) : (
                <Table hover responsive className="mb-0 seller-inventory-table">
                  <thead className="seller-inventory-table-head">
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Suggested</th>
                      <th>Lead Time</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {restockQueue.map(entry => (
                      <tr key={entry.id}>
                        <td>
                          <div className="fw-semibold seller-inventory-product-name">{entry.product}</div>
                          <small className="text-muted">Supplier: {entry.supplier}</small>
                        </td>
                        <td className="text-center">{entry.suggestedQty}</td>
                        <td>{entry.leadTime}</td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="seller-inventory-action-btn"
                            onClick={() => handleConvertToPurchaseOrder(entry.id)}
                          >
                            Create PO
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerInventoryPage;
