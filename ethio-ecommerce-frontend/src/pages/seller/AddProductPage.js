import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { sellerAPI, categoriesAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/sellerAddProduct.css';

const AddProductPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name_en: '',
    price: '',
    stock: '',
    status: 'active',
    category: '',
    description: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'seller') {
      navigate('/');
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getCategories();
      setCategories(res.data?.data || []);
    } catch (err) {
      // ignore, keep categories empty
      console.error('Failed to load categories', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.name_en.trim()) return setError('Product name is required');
    if (!form.price || Number(form.price) <= 0) return setError('Valid price is required');
    if (!form.stock || Number(form.stock) < 0) return setError('Valid stock is required');

    setLoading(true);
    try {
      const payload = {
        name: { en: form.name_en },
        price: Number(form.price),
        stock: Number(form.stock),
        status: form.status,
        category: form.category || undefined,
        description: form.description
      };

  await sellerAPI.createSellerProduct(payload);
      toast.success('Product created successfully');
      navigate('/seller/products');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoadingSpinner message="Checking permissions..." />;

  return (
    <Container fluid className="seller-add-product-container py-5">
      <Row className="justify-content-center">
        <Col xl={7} lg={8}>
          <div className="seller-add-product-header mb-4">
            <div>
              <h1 className="seller-add-product-title">Add New Product</h1>
              <p className="seller-add-product-subtitle mb-0">Craft a standout listing with rich details and accurate inventory.</p>
            </div>
            <Badge bg="light" text="dark" className="seller-add-product-badge">
              <i className="fas fa-box-open me-2"></i>
              Ready to publish
            </Badge>
          </div>

          <div className="seller-add-product-highlights mb-4">
            <div className="seller-add-product-chip">
              <i className="fas fa-palette"></i>
              <span>Showcase your brand tone</span>
            </div>
            <div className="seller-add-product-chip">
              <i className="fas fa-tags"></i>
              <span>Highlight promotions instantly</span>
            </div>
            <div className="seller-add-product-chip">
              <i className="fas fa-shield-alt"></i>
              <span>Build trust with clear policies</span>
            </div>
          </div>

          <Card className="seller-add-product-card">
            <Card.Body className="seller-add-product-body">
              {error && <Alert variant="danger" className="seller-add-product-alert">{error}</Alert>}
              <Form onSubmit={handleSubmit} className="seller-add-product-form">
                <Form.Group className="seller-add-product-field">
                  <Form.Label>Product Name (English) *</Form.Label>
                  <Form.Control
                    className="seller-add-product-input"
                    name="name_en"
                    value={form.name_en}
                    onChange={handleChange}
                    placeholder="e.g. Premium Ethiopian Coffee Beans"
                    required
                  />
                </Form.Group>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="seller-add-product-field h-100">
                      <Form.Label>Price *</Form.Label>
                      <Form.Control
                        className="seller-add-product-input"
                        name="price"
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="Enter price in ETB"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="seller-add-product-field h-100">
                      <Form.Label>Stock *</Form.Label>
                      <Form.Control
                        className="seller-add-product-input"
                        name="stock"
                        type="number"
                        value={form.stock}
                        onChange={handleChange}
                        placeholder="Units available"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="seller-add-product-field h-100">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        className="seller-add-product-input"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                      >
                        <option value="">-- Select category --</option>
                        {categories.map((c) => {
                          const label = typeof c.name === 'object'
                            ? c.name.en || c.name.am || c.name?.default || 'Untitled'
                            : c.name || 'Untitled';
                          return (
                            <option key={c._id} value={c._id}>{label}</option>
                          );
                        })}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="seller-add-product-field h-100">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        className="seller-add-product-input"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="seller-add-product-field">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    className="seller-add-product-input"
                    as="textarea"
                    rows={4}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Share origin stories, materials, and unique selling points."
                  />
                  <Form.Text className="seller-add-product-hint">Rich storytelling boosts conversions and SEO visibility.</Form.Text>
                </Form.Group>

                <div className="seller-add-product-actions">
                  <Button type="submit" disabled={loading} variant="primary" className="seller-add-product-submit">
                    {loading ? 'Creating...' : 'Create Product'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="seller-add-product-secondary"
                    onClick={() => setForm({ name_en: '', price: '', stock: '', status: 'active', category: '', description: '' })}
                  >
                    Reset Fields
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddProductPage;
