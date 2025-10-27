import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/admin.css';
import '../../styles/AdminCategoryNewPage.css';

const AdminCategoryNewPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: { en: '', am: '' },
    description: { en: '', am: '' },
    code: '',
    parent: '',
    displayOrder: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await categoriesAPI.getCategories();
        const list = res.data?.data || res.data || [];
        setCategories(list);
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Ensure parent is null when empty string to avoid Mongoose CastError
      const submitData = {
        ...formData,
        displayOrder: parseInt(formData.displayOrder) || 0,
        parent: formData.parent && formData.parent !== '' ? formData.parent : null
      };
      await categoriesAPI.createCategory(submitData);
      navigate('/admin/categories');
    } catch (err) {
      console.error('Create category failed', err, err.response && err.response.data);
      // Backend may return { error: '...' } or { message: '...' }
      const serverErr = err.response?.data?.error || err.response?.data?.message || err.response?.data;
      setError(serverErr || err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Creating category..." />;

  return (
    <Container fluid className="admin-category-new py-4">
      <div className="category-hero mb-4">
        <div className="d-flex align-items-start gap-3">
          <div className="hero-icon">
            <i className="fas fa-folder-plus fa-2x"></i>
          </div>
          <div>
            <h2 className="mb-1">Create Category</h2>
            <p className="text-muted mb-0">Add a new product category to keep your catalog organized.</p>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="glass-card category-form-card">
        <Card.Body>
          <Form onSubmit={handleSubmit} className="category-form">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3 category-field">
                  <Form.Label className="form-label">English Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Electronics"
                    value={formData.name.en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: { ...prev.name, en: e.target.value } }))}
                    required
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3 category-field">
                  <Form.Label className="form-label">Amharic Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="የምርት ምድብ"
                    value={formData.name.am}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: { ...prev.name, am: e.target.value } }))}
                    required
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3 category-field">
                  <Form.Label className="form-label">Category Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. ELEC001"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    required
                    maxLength={10}
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3 category-field">
                  <Form.Label className="form-label">Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={12}>
                <Form.Group className="mb-3 category-field">
                  <Form.Label className="form-label">Parent Category</Form.Label>
                  <Form.Select
                    value={formData.parent}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
                    className="form-control-lg"
                  >
                    <option value="">No Parent (Main Category)</option>
                    {categories.filter(cat => !cat.parent).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name?.en || cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3 category-field">
                  <Form.Label className="form-label">English Description</Form.Label>
                  <Form.Control as="textarea" rows={3} value={formData.description.en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, en: e.target.value } }))}
                    placeholder="Short description for buyers"
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3 category-field">
                  <Form.Label className="form-label">Amharic Description</Form.Label>
                  <Form.Control as="textarea" rows={3} value={formData.description.am}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, am: e.target.value } }))}
                    placeholder="አጭር መግለጫ"
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2 justify-content-end mt-3">
              <Button variant="outline-secondary" onClick={() => navigate('/admin/categories')} className="btn-lg">Cancel</Button>
              <Button variant="primary" type="submit" className="btn-lg">Create Category</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminCategoryNewPage;
