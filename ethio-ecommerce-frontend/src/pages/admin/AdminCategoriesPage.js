import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { categoriesAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: { en: '', am: '' },
    description: { en: '', am: '' },
    code: '',
    parent: '',
    displayOrder: 0
  });

  const { language } = useApp();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getCategories();
      // Normalize response to always be an array to avoid runtime errors when API
      // returns an unexpected shape or `data` is undefined.
      const payload = response && response.data;
      if (Array.isArray(payload)) {
        setCategories(payload);
      } else if (payload && Array.isArray(payload.data)) {
        setCategories(payload.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      setError('Failed to load categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleCreateClick = () => {
    // Navigate to standalone create page
    navigate('/admin/categories/new');
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      code: category.code,
      parent: category.parent?._id || '',
      displayOrder: category.displayOrder || 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        displayOrder: parseInt(formData.displayOrder)
      };

      if (editingCategory) {
        await categoriesAPI.updateCategory(editingCategory._id, submitData);
      } else {
        await categoriesAPI.createCategory(submitData);
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      alert(`Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await categoriesAPI.deleteCategory(categoryId);
        fetchCategories();
      } catch (error) {
        alert('Failed to delete category');
      }
    }
  };

  const handleStatusToggle = async (categoryId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await categoriesAPI.updateCategory(categoryId, { isActive: newStatus });
      fetchCategories();
    } catch (error) {
      alert('Failed to update category status');
    }
  };

  const getParentCategories = () => {
    return (categories || []).filter(cat => !cat.parent);
  };

  const getSubcategories = (parentId) => {
    return (categories || []).filter(cat => {
      if (!cat.parent) return false;
      // parent may be stored as an object with _id, or as a string id
      if (typeof cat.parent === 'string') return cat.parent === parentId;
      if (typeof cat.parent === 'object') return cat.parent._id === parentId || cat.parent === parentId;
      return false;
    });
  };

  // Helpers to safely read localized fields (name/description) which may be
  // objects like { en: '...', am: '...' } or sometimes plain strings.
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      return obj[language] || obj.en || Object.values(obj)[0] || '';
    }
    return '';
  };

  const formatName = (categoryOrName) => {
    if (!categoryOrName) return '';
    if (typeof categoryOrName === 'string') return categoryOrName;
    if (categoryOrName.name) return getLocalized(categoryOrName.name);
    // fallback if object directly represents a localized map
    return getLocalized(categoryOrName);
  };

  const formatDescription = (category) => getLocalized(category && category.description);

  const getParentName = (parent) => {
    if (!parent) return '';
    if (typeof parent === 'string') {
      const p = (categories || []).find(c => c._id === parent);
      return p ? formatName(p) : parent;
    }
    return formatName(parent);
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Category Management</h1>
          <p className="text-muted mb-0">Organize your product categories</p>
        </div>
        <Button variant="primary" onClick={handleCreateClick}>
          <i className="fas fa-plus me-2"></i>
          Add Category
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Categories ({(categories && categories.length) || 0})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Parent</th>
                    <th>Display Order</th>
                    <th>Status</th>
                    <th>Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(categories || []).map(category => (
                    <tr key={category._id}>
                      <td>
                        <div className="fw-semibold">{formatName(category) || (category.name && typeof category.name === 'string' ? category.name : '')}</div>
                        {formatDescription(category) && (
                          <small className="text-muted">
                            {formatDescription(category).substring(0, 50)}...
                          </small>
                        )}
                      </td>
                      <td>
                        <Badge bg="secondary">{category.code}</Badge>
                      </td>
                      <td>
                        {category.parent ? (
                          <span>{getParentName(category.parent) || <span className="text-muted">Parent</span>}</span>
                        ) : (
                          <span className="text-muted">Main Category</span>
                        )}
                      </td>
                      <td>{category.displayOrder}</td>
                      <td>
                        <Badge bg={category.isActive ? 'success' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="info">0</Badge>{/* You would fetch product count */}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleEditClick(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={category.isActive ? 'warning' : 'success'}
                            size="sm"
                            onClick={() => handleStatusToggle(category._id, category.isActive)}
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(category._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {((categories && categories.length) || 0) === 0 && (
                <div className="text-center py-5">
                  <i className="fas fa-tags fa-3x text-muted mb-3"></i>
                  <h5>No categories found</h5>
                  <p className="text-muted">
                    Get started by creating your first product category.
                  </p>
                  <Button variant="primary" onClick={handleCreateClick}>
                    Create First Category
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Category Structure</h5>
            </Card.Header>
            <Card.Body>
              <div className="category-tree">
                {getParentCategories().map(category => (
                  <div key={category._id} className="mb-3">
                    <div className="fw-semibold d-flex align-items-center">
                      <i className="fas fa-folder text-warning me-2"></i>
                      {formatName(category)}
                      <Badge bg="secondary" className="ms-2">{category.code}</Badge>
                    </div>
                    {getSubcategories(category._id).length > 0 && (
                      <div className="ms-4 mt-1">
                        {getSubcategories(category._id).map(subcategory => (
                          <div key={subcategory._id} className="d-flex align-items-center mb-1">
                            <i className="fas fa-folder-open text-muted me-2"></i>
                            <span>{formatName(subcategory)}</span>
                            <Badge bg="light" text="dark" className="ms-2">
                              {subcategory.code}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Category Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Create New Category'}
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
                  <Form.Label>Category Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    required
                    maxLength={10}
                    placeholder="e.g., ELEC for Electronics"
                  />
                  <Form.Text className="text-muted">
                    Unique code for the category (max 10 characters)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Parent Category</Form.Label>
              <Form.Select
                value={formData.parent}
                onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
              >
                <option value="">No Parent (Main Category)</option>
                {categories
                  .filter(cat => !cat.parent)
                  .map(category => (
                    <option key={category._id} value={category._id}>
                      {formatName(category) || (category.name && typeof category.name === 'string' ? category.name : '')}
                    </option>
                  ))
                }
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>English Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: { ...prev.description, en: e.target.value }
                }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amharic Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description.am}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: { ...prev.description, am: e.target.value }
                }))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminCategoriesPage;