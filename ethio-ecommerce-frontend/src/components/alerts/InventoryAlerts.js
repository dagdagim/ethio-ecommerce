import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { productsAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../common/LoadingSpinner';

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    outOfStockAlerts: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const { formatPrice } = useApp();

  useEffect(() => {
    fetchAlerts();
    fetchSettings();
  }, []);

  const fetchAlerts = async () => {
    try {
      // In real app: await productsAPI.getLowStockProducts()
      const response = await productsAPI.getProducts({ limit: 50 });
      const lowStockProducts = response.data.data.filter(product => 
        product.stock < settings.lowStockThreshold && product.stock > 0
      );
      
      const outOfStockProducts = response.data.data.filter(product => 
        product.stock === 0
      );

      const alertData = [
        ...lowStockProducts.map(product => ({
          type: 'low_stock',
          product,
          message: `Low stock: Only ${product.stock} units left`,
          priority: 'medium'
        })),
        ...outOfStockProducts.map(product => ({
          type: 'out_of_stock',
          product,
          message: 'Out of stock: Product unavailable',
          priority: 'high'
        }))
      ];

      setAlerts(alertData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    // In real app, fetch from API
    const savedSettings = localStorage.getItem('inventoryAlertSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      await productsAPI.updateProduct(productId, { stock: newStock });
      fetchAlerts(); // Refresh alerts
    } catch (error) {
      alert('Failed to update stock');
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('inventoryAlertSettings', JSON.stringify(settings));
    setShowSettings(false);
    fetchAlerts(); // Refresh with new threshold
  };

  const getAlertVariant = (priority) => {
    return priority === 'high' ? 'danger' : 'warning';
  };

  const getAlertIcon = (type) => {
    return type === 'out_of_stock' ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';
  };

  if (loading) return <LoadingSpinner message="Loading inventory alerts..." />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4>Inventory Alerts</h4>
          <p className="text-muted mb-0">
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          variant="outline-primary" 
          onClick={() => setShowSettings(true)}
        >
          <i className="fas fa-cog me-2"></i>
          Alert Settings
        </Button>
      </div>

      {alerts.length === 0 ? (
        <Alert variant="success">
          <i className="fas fa-check-circle me-2"></i>
          All products are well stocked! No alerts at this time.
        </Alert>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Alert</th>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, index) => (
                  <tr key={index} className={alert.priority === 'high' ? 'table-danger' : 'table-warning'}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className={`${getAlertIcon(alert.type)} me-2 text-${getAlertVariant(alert.priority)}`}></i>
                        <div>
                          <div className="fw-semibold">{alert.message}</div>
                          <small className="text-muted">
                            {alert.type === 'low_stock' ? 'Low Stock Alert' : 'Out of Stock Alert'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <img 
                          src={alert.product.images[0]?.url || '/images/placeholder.jpg'} 
                          alt={alert.product.name.en}
                          className="rounded me-2"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                        <div>
                          <div className="fw-semibold">{alert.product.name.en}</div>
                          <small className="text-muted">SKU: {alert.product.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={alert.product.stock === 0 ? 'danger' : 'warning'}>
                        {alert.product.stock} units
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getAlertVariant(alert.priority)}>
                        {alert.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {alert.type === 'low_stock' && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              const newStock = parseInt(prompt('Enter new stock quantity:', alert.product.stock));
                              if (!isNaN(newStock) && newStock >= 0) {
                                handleUpdateStock(alert.product._id, newStock);
                              }
                            }}
                          >
                            Update Stock
                          </Button>
                        )}
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            // Mark as resolved
                            const updatedAlerts = alerts.filter(a => a !== alert);
                            setAlerts(updatedAlerts);
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Alert Settings Modal */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Alert Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Low Stock Threshold</Form.Label>
              <Form.Control
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  lowStockThreshold: parseInt(e.target.value)
                }))}
                min="1"
                max="100"
              />
              <Form.Text className="text-muted">
                Products with stock below this number will trigger low stock alerts
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Out of Stock Alerts"
                checked={settings.outOfStockAlerts}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  outOfStockAlerts: e.target.checked
                }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Email Notifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emailNotifications: e.target.checked
                }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="SMS Notifications"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  smsNotifications: e.target.checked
                }))}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettings(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <Card className="mt-4">
          <Card.Header>
            <h6 className="mb-0">Alert Summary</h6>
          </Card.Header>
          <Card.Body>
            <div className="row text-center">
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <h4 className="text-warning">
                    {alerts.filter(a => a.type === 'low_stock').length}
                  </h4>
                  <small className="text-muted">Low Stock Items</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <h4 className="text-danger">
                    {alerts.filter(a => a.type === 'out_of_stock').length}
                  </h4>
                  <small className="text-muted">Out of Stock Items</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <h4 className="text-info">
                    {alerts.filter(a => a.priority === 'high').length}
                  </h4>
                  <small className="text-muted">High Priority</small>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default InventoryAlerts;