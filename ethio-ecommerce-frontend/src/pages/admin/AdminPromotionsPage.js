import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { promotionsAPI, productsAPI, categoriesAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    name: { en: '', am: '' },
    description: { en: '', am: '' },
    code: '',
    type: 'percentage',
    value: '',
    minimumOrderAmount: '',
    maximumDiscount: '',
    usageLimit: '',
    userUsageLimit: 1,
    validFrom: '',
    validUntil: '',
    isActive: true,
    appliesTo: 'all_products',
    categories: [],
    products: [],
    sellers: [],
    buyQuantity: '',
    getQuantity: ''
  });

  const { language, formatPrice } = useApp();

  useEffect(() => {
    fetchPromotions();
    fetchProductsAndCategories();
  }, [filter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionsAPI.getPromotions();
      let filteredPromotions = response.data.data;

      if (filter !== 'all') {
        if (filter === 'active') {
          filteredPromotions = filteredPromotions.filter(p => 
            p.isActive && new Date(p.validFrom) <= new Date() && new Date(p.validUntil) >= new Date()
          );
        } else if (filter === 'expired') {
          filteredPromotions = filteredPromotions.filter(p => new Date(p.validUntil) < new Date());
        } else if (filter === 'scheduled') {
          filteredPromotions = filteredPromotions.filter(p => new Date(p.validFrom) > new Date());
        } else if (filter === 'inactive') {
          filteredPromotions = filteredPromotions.filter(p => !p.isActive);
        }
      }

      setPromotions(filteredPromotions);
    } catch (error) {
      setError('Failed to load promotions');
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndCategories = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsAPI.getProducts({ limit: 100 }),
        categoriesAPI.getCategories()
      ]);
      setProducts(productsResponse.data.data);
      setCategories(categoriesResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCreateClick = () => {
    setEditingPromotion(null);
    setFormData({
      name: { en: '', am: '' },
      description: { en: '', am: '' },
      code: '',
      type: 'percentage',
      value: '',
      minimumOrderAmount: '',
      maximumDiscount: '',
      usageLimit: '',
      userUsageLimit: 1,
      validFrom: '',
      validUntil: '',
      isActive: true,
      appliesTo: 'all_products',
      categories: [],
      products: [],
      sellers: [],
      buyQuantity: '',
      getQuantity: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description,
      code: promotion.code,
      type: promotion.type,
      value: promotion.value || '',
      minimumOrderAmount: promotion.minimumOrderAmount || '',
      maximumDiscount: promotion.maximumDiscount || '',
      usageLimit: promotion.usageLimit || '',
      userUsageLimit: promotion.userUsageLimit || 1,
      validFrom: promotion.validFrom ? new Date(promotion.validFrom).toISOString().split('T')[0] : '',
      validUntil: promotion.validUntil ? new Date(promotion.validUntil).toISOString().split('T')[0] : '',
      isActive: promotion.isActive,
      appliesTo: promotion.appliesTo,
      categories: promotion.categories?.map(c => c._id) || [],
      products: promotion.products?.map(p => p._id) || [],
      sellers: promotion.sellers?.map(s => s._id) || [],
      buyQuantity: promotion.buyQuantity || '',
      getQuantity: promotion.getQuantity || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        value: formData.type !== 'free_shipping' ? parseFloat(formData.value) : undefined,
        minimumOrderAmount: parseFloat(formData.minimumOrderAmount) || 0,
        maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        userUsageLimit: parseInt(formData.userUsageLimit),
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
        buyQuantity: formData.type === 'buy_x_get_y' ? parseInt(formData.buyQuantity) : undefined,
        getQuantity: formData.type === 'buy_x_get_y' ? parseInt(formData.getQuantity) : undefined
      };

      if (editingPromotion) {
        await promotionsAPI.updatePromotion(editingPromotion._id, submitData);
      } else {
        await promotionsAPI.createPromotion(submitData);
      }

      setShowModal(false);
      fetchPromotions();
    } catch (error) {
      alert(`Failed to ${editingPromotion ? 'update' : 'create'} promotion`);
    }
  };

  const handleDelete = async (promotionId) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await promotionsAPI.deletePromotion(promotionId);
        fetchPromotions();
      } catch (error) {
        alert('Failed to delete promotion');
      }
    }
  };

  const handleStatusToggle = async (promotionId, currentStatus) => {
    try {
      await promotionsAPI.updatePromotion(promotionId, { isActive: !currentStatus });
      fetchPromotions();
    } catch (error) {
      alert('Failed to update promotion status');
    }
  };

  const getStatus = (promotion) => {
    const now = new Date();
    if (!promotion.isActive) return { variant: 'secondary', text: 'Inactive' };
    if (new Date(promotion.validFrom) > now) return { variant: 'warning', text: 'Scheduled' };
    if (new Date(promotion.validUntil) < now) return { variant: 'danger', text: 'Expired' };
    return { variant: 'success', text: 'Active' };
  };

  const getDiscountText = (promotion) => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}% off`;
      case 'fixed_amount':
        return `${formatPrice(promotion.value)} off`;
      case 'free_shipping':
        return 'Free Shipping';
      case 'buy_x_get_y':
        return `Buy ${promotion.buyQuantity} Get ${promotion.getQuantity} Free`;
      default:
        return 'Discount';
    }
  };

  if (loading) return <LoadingSpinner message="Loading promotions..." />;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Promotion Management</h1>
          <p className="text-muted mb-0">Manage discount codes and promotions</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select 
            style={{ width: '200px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Promotions</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
          <Button variant="primary" onClick={handleCreateClick}>
            <i className="fas fa-plus me-2"></i>
            Create Promotion
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Promotion Statistics */}
      <Row className="mb-4">
        <Col xl={2} md={4} sm={6}>
          <Card className="border-primary">
            <Card.Body className="text-center">
              <h4 className="text-primary">{promotions.length}</h4>
              <small className="text-muted">Total Promotions</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-success">
            <Card.Body className="text-center">
              <h4 className="text-success">
                {promotions.filter(p => getStatus(p).text === 'Active').length}
              </h4>
              <small className="text-muted">Active</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-warning">
            <Card.Body className="text-center">
              <h4 className="text-warning">
                {promotions.filter(p => getStatus(p).text === 'Scheduled').length}
              </h4>
              <small className="text-muted">Scheduled</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-danger">
            <Card.Body className="text-center">
              <h4 className="text-danger">
                {promotions.filter(p => getStatus(p).text === 'Expired').length}
              </h4>
              <small className="text-muted">Expired</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-info">
            <Card.Body className="text-center">
              <h4 className="text-info">
                {promotions.reduce((sum, p) => sum + p.usedCount, 0)}
              </h4>
              <small className="text-muted">Total Uses</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="border-secondary">
            <Card.Body className="text-center">
              <h4 className="text-secondary">
                {promotions.filter(p => p.scope === 'seller').length}
              </h4>
              <small className="text-muted">Seller Promotions</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Promotions ({promotions.length})
            {filter !== 'all' && <span className="text-muted"> - {filter}</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Promotion</th>
                <th>Code</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Scope</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(promotion => {
                const status = getStatus(promotion);
                return (
                  <tr key={promotion._id}>
                    <td>
                      <div>
                        <div className="fw-semibold">{promotion.name[language] || promotion.name.en}</div>
                        <small className="text-muted">
                          {promotion.description[language] || promotion.description.en}
                        </small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="dark" className="fs-6">{promotion.code}</Badge>
                    </td>
                    <td>
                      <div className="fw-semibold">{getDiscountText(promotion)}</div>
                      {promotion.minimumOrderAmount > 0 && (
                        <small className="text-muted">
                          Min: {formatPrice(promotion.minimumOrderAmount)}
                        </small>
                      )}
                    </td>
                    <td>
                      <div>
                        <small>{promotion.usedCount} / {promotion.usageLimit || '∞'}</small>
                        <div className="progress mt-1" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: promotion.usageLimit ? 
                                `${(promotion.usedCount / promotion.usageLimit) * 100}%` : '0%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <small>
                        {new Date(promotion.validFrom).toLocaleDateString()} - {' '}
                        {new Date(promotion.validUntil).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <Badge bg={status.variant}>{status.text}</Badge>
                    </td>
                    <td>
                      <Badge bg={promotion.scope === 'global' ? 'primary' : 'secondary'}>
                        {promotion.scope}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          as={Link}
                          to={`/admin/promotions/${promotion._id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleEditClick(promotion)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={promotion.isActive ? 'warning' : 'success'}
                          size="sm"
                          onClick={() => handleStatusToggle(promotion._id, promotion.isActive)}
                        >
                          {promotion.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(promotion._id)}
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

          {promotions.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-tag fa-3x text-muted mb-3"></i>
              <h5>No promotions found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'No promotions have been created yet.' : `No ${filter} promotions found.`}
              </p>
              <Button variant="primary" onClick={handleCreateClick}>
                Create Your First Promotion
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Promotion Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>English Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name.en}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, en: e.target.value }
                    }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amharic Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name.am}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, am: e.target.value }
                    }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Promotion Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="Leave empty to auto-generate"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Promotion Type *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                    <option value="buy_x_get_y">Buy X Get Y Free</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.type !== 'free_shipping' && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {formData.type === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      required
                      min="0"
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                    />
                  </Form.Group>
                </Col>
                {formData.type === 'percentage' && (
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Maximum Discount</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.maximumDiscount}
                        onChange={(e) => setFormData(prev => ({ ...prev, maximumDiscount: e.target.value }))}
                        min="0"
                        step="0.01"
                        placeholder="No maximum"
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>
            )}

            {formData.type === 'buy_x_get_y' && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Buy Quantity *</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.buyQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyQuantity: e.target.value }))}
                      required
                      min="1"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Get Quantity Free *</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.getQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, getQuantity: e.target.value }))}
                      required
                      min="1"
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Order Amount</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderAmount: e.target.value }))}
                    min="0"
                    step="0.01"
                    placeholder="0 for no minimum"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usage Limit</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                    min="0"
                    placeholder="0 for unlimited"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>User Usage Limit</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.userUsageLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, userUsageLimit: e.target.value }))}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Applies To</Form.Label>
                  <Form.Select
                    value={formData.appliesTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, appliesTo: e.target.value }))}
                  >
                    <option value="all_products">All Products</option>
                    <option value="specific_categories">Specific Categories</option>
                    <option value="specific_products">Specific Products</option>
                    <option value="specific_sellers">Specific Sellers</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.appliesTo === 'specific_categories' && (
              <Form.Group className="mb-3">
                <Form.Label>Select Categories</Form.Label>
                <Form.Select
                  multiple
                  value={formData.categories}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    categories: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                >
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name[language] || category.name.en}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {formData.appliesTo === 'specific_products' && (
              <Form.Group className="mb-3">
                <Form.Label>Select Products</Form.Label>
                <Form.Select
                  multiple
                  value={formData.products}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    products: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                >
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name[language] || product.name.en}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid From *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid Until *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminPromotionsPage;