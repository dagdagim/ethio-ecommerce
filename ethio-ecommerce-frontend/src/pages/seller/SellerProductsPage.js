import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Message from '../../components/common/Message';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/sellerProducts.css';

const createEmptyProductForm = () => ({
  name: { en: '', am: '' },
  description: { en: '', am: '' },
  price: '',
  originalPrice: '',
  category: '',
  stock: '',
  brand: '',
  location: {
    region: 'Addis Ababa',
    city: ''
  },
  weight: {
    value: '',
    unit: 'g'
  },
  tags: '',
  shipping: {
    freeShipping: false,
    shippingCost: '0'
  }
});

const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(createEmptyProductForm());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const { ethiopianRegions, language, formatPrice } = useApp();
  const { user, loading: authLoading } = useAuth();

  const resetImageState = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(createEmptyProductForm());
    resetImageState();
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview('');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setError('You need to sign in as a seller to manage products.');
      return;
    }

    if (user.role !== 'seller') {
      setLoading(false);
      setError('Access denied. Seller privileges required.');
      return;
    }

  fetchProducts(user._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, user, authLoading]);

  const fetchProducts = async (sellerId = user?._id) => {
    if (!sellerId) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = { limit: 100, seller: sellerId };
      const response = await productsAPI.getProducts(params);
      const allProducts = response?.data?.data || [];

      let filteredProducts = allProducts;

      if (filter !== 'all') {
        if (filter === 'low-stock') {
          filteredProducts = allProducts.filter(product => Number(product.stock) < 10 && Number(product.stock) > 0);
        } else if (filter === 'out-of-stock') {
          filteredProducts = allProducts.filter(product => Number(product.stock) === 0);
        } else if (filter === 'inactive') {
          filteredProducts = allProducts.filter(product => product.status === 'inactive' || product.status === 'out_of_stock');
        }
      }

      setProducts(filteredProducts);
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      const payload = response?.data;
      const categoryList = Array.isArray(payload) ? payload : payload?.data || [];
      setCategories(categoryList);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateClick = () => {
    setEditingProduct(null);
    setFormData(createEmptyProductForm());
    resetImageState();
    setShowModal(true);
  };

  const handleEditClick = (product) => {
    resetImageState();
    setEditingProduct(product);
    setFormData({
      name: {
        en: product.name?.en || (typeof product.name === 'string' ? product.name : ''),
        am: product.name?.am || product.name?.en || ''
      },
      description: {
        en: product.description?.en || (typeof product.description === 'string' ? product.description : ''),
        am: product.description?.am || product.description?.en || ''
      },
      price: product.price,
      originalPrice: product.originalPrice || '',
      category: product.category?._id || (typeof product.category === 'string' ? product.category : ''),
      stock: product.stock,
      brand: product.brand || '',
      location: product.location || { region: 'Addis Ababa', city: '' },
      weight: product.weight || { value: '', unit: 'g' },
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      shipping: product.shipping || { freeShipping: false, shippingCost: '0' }
    });
    const existingImage = product.images?.[0]?.url || '';
    setImagePreview(existingImage);
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        shipping: {
          ...formData.shipping,
          shippingCost: formData.shipping.freeShipping
            ? 0
            : parseFloat(formData.shipping.shippingCost || '0')
        }
      };

      let productId;
      if (editingProduct) {
        await productsAPI.updateProduct(editingProduct._id, submitData);
        productId = editingProduct._id;
      } else {
        const response = await productsAPI.createProduct(submitData);
        productId = response?.data?.data?._id;
      }

      if (imageFile && productId) {
        const imageData = new FormData();
        imageData.append('file', imageFile);
        try {
          await productsAPI.uploadImage(productId, imageData);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert('Product saved, but image upload failed. Please try uploading again.');
        }
      }

      handleModalClose();
      fetchProducts();
    } catch (error) {
      alert(`Failed to ${editingProduct ? 'update' : 'create'} product`);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.deleteProduct(productId);
        fetchProducts();
      } catch (error) {
        alert('Failed to delete product');
      }
    }
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await productsAPI.updateProduct(productId, { status: newStatus });
      fetchProducts();
    } catch (error) {
      alert('Failed to update product status');
    }
  };

  const resolveCategoryName = (product) => {
    if (!product.category) return 'Uncategorized';

    if (typeof product.category === 'string') {
      const match = categories.find((cat) => cat._id === product.category);
      if (match?.name) {
        if (typeof match.name === 'object') {
          return match.name[language] || match.name.en || match.name.am || 'Uncategorized';
        }
        return match.name;
      }
      return 'Uncategorized';
    }

    const localizedName = product.category.name;
    if (localizedName && typeof localizedName === 'object') {
      return localizedName[language] || localizedName.en || localizedName.am || 'Uncategorized';
    }

    return localizedName || 'Uncategorized';
  };

  const getStockVariant = (stock) => {
    const quantity = Number(stock);
    if (!Number.isFinite(quantity) || quantity < 0) return 'secondary';
    if (quantity === 0) return 'danger';
    if (quantity < 10) return 'warning';
    return 'success';
  };

  const getStockText = (stock) => {
    const quantity = Number(stock);
    if (!Number.isFinite(quantity) || quantity < 0) return 'Unknown';
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 10) return `Low (${quantity})`;
    return `In Stock (${quantity})`;
  };

  const getProductName = (product, preferredKey) => {
    if (!product.name) return '';
    if (typeof product.name === 'string') return product.name;
    return product.name[preferredKey] || product.name.en || product.name.am || '';
  };

  if (authLoading || (loading && !error)) {
    return <LoadingSpinner message="Loading your products..." />;
  }

  if (!user || user.role !== 'seller') {
    return <Message variant="danger">{error || 'Access denied. Seller privileges required.'}</Message>;
  }

  return (
    <Container fluid className="seller-products-container py-5">
      <div className="seller-products-topbar mb-4">
        <div>
          <h1 className="seller-products-title">My Products</h1>
          <p className="seller-products-subtitle mb-0">Manage your product catalog</p>
        </div>
        <div className="d-flex gap-2 seller-products-actions">
          <Form.Select
            className="seller-products-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
          <Button variant="primary" className="seller-products-add-btn" onClick={handleCreateClick}>
            <i className="fas fa-plus me-2"></i>
            Add Product
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="seller-products-alert">{error}</Alert>}

      {/* Quick Stats */}
      <Row className="seller-products-stats g-3 mb-4">
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-products-stat-card seller-products-stat-total">
            <Card.Body className="text-center">
              <h4 className="seller-products-stat-value">{products.length}</h4>
              <small className="seller-products-stat-label">Total Products</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-products-stat-card seller-products-stat-instock">
            <Card.Body className="text-center">
              <h4 className="seller-products-stat-value">
                {products.filter(p => Number(p.stock) > 0).length}
              </h4>
              <small className="seller-products-stat-label">In Stock</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-products-stat-card seller-products-stat-low">
            <Card.Body className="text-center">
              <h4 className="seller-products-stat-value">
                {products.filter(p => Number(p.stock) < 10 && Number(p.stock) > 0).length}
              </h4>
              <small className="seller-products-stat-label">Low Stock</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-products-stat-card seller-products-stat-out">
            <Card.Body className="text-center">
              <h4 className="seller-products-stat-value">
                {products.filter(p => Number(p.stock) === 0).length}
              </h4>
              <small className="seller-products-stat-label">Out of Stock</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-products-stat-card seller-products-stat-active">
            <Card.Body className="text-center">
              <h4 className="seller-products-stat-value">
                {products.filter(p => p.status === 'active').length}
              </h4>
              <small className="seller-products-stat-label">Active</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={2} md={4} sm={6}>
          <Card className="seller-products-stat-card seller-products-stat-inactive">
            <Card.Body className="text-center">
              <h4 className="seller-products-stat-value">
                {products.filter(p => p.status === 'inactive').length}
              </h4>
              <small className="seller-products-stat-label">Inactive</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="seller-products-table-card">
        <Card.Header className="seller-products-table-header">
          <h5 className="mb-0 seller-products-table-title">
            Products ({products.length})
            {filter !== 'all' && <span className="text-muted"> - {filter.replace('-', ' ')}</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 seller-products-table">
            <thead className="seller-products-table-head">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Promotions</th>
                <th>Sales</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const englishName = getProductName(product, 'en') || getProductName(product, language);
                const amharicName = getProductName(product, 'am');
                const price = Number(product.price) || 0;
                const originalPrice = Number(product.originalPrice);
                const stockValue = Number(product.stock);
                const status = product.status || 'inactive';
                const activePromotions = Array.isArray(product.activePromotions) ? product.activePromotions : [];
                let imageUrl = product.images?.[0]?.url;
                if (imageUrl) {
                  imageUrl = productsAPI.buildImageUrl(imageUrl);
                }
                if (!imageUrl) {
                  imageUrl = '/images/placeholder.jpg';
                }

                return (
                  <tr key={product._id}>
                    <td>
                      <div className="d-flex align-items-center seller-products-item">
                        <img
                          src={imageUrl}
                          alt={englishName || 'Product image'}
                          className="seller-products-thumb me-3"
                        />
                        <div>
                          <div className="fw-semibold seller-products-name">{englishName || 'Unnamed product'}</div>
                          {amharicName && (
                            <small className="text-muted seller-products-name-secondary">{amharicName}</small>
                          )}
                          <div>
                            <small className="text-muted">SKU: {product.sku || 'N/A'}</small>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="secondary" className="seller-products-badge">
                        {resolveCategoryName(product)}
                      </Badge>
                    </td>
                    <td>
                      <strong className="seller-products-price">{formatPrice(price)}</strong>
                      {Number.isFinite(originalPrice) && originalPrice > price && (
                        <div>
                          <small className="text-muted text-decoration-line-through">
                            {formatPrice(originalPrice)}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge bg={getStockVariant(stockValue)} className="seller-products-badge">
                        {getStockText(stockValue)}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={status === 'active' ? 'success' : 'secondary'} className="seller-products-badge">
                        {status}
                      </Badge>
                    </td>
                    <td>
                      {activePromotions.length === 0 ? (
                        <span className="text-muted small">No promotion</span>
                      ) : (
                        <div className="d-flex flex-wrap gap-1">
                          {activePromotions.map((promo, idx) => (
                            <Badge key={`${promo.promotionId || promo.id || idx}`} bg="warning" text="dark" className="seller-products-badge">
                              {promo.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge bg="info" className="seller-products-badge">0</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1 seller-products-row-actions">
                        <Button
                          as={Link}
                          to={`/product/${product._id}`}
                          variant="outline-primary"
                          size="sm"
                          target="_blank"
                          className="seller-products-action-btn"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="seller-products-action-btn"
                          onClick={() => handleEditClick(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={status === 'active' ? 'warning' : 'success'}
                          size="sm"
                          className="seller-products-action-btn"
                          onClick={() => handleStatusToggle(product._id, status)}
                        >
                          {status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="seller-products-action-btn"
                          onClick={() => handleDelete(product._id)}
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

          {products.length === 0 && (
            <div className="text-center py-5 seller-products-empty">
              <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
              <h5>No products found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'You haven\'t added any products yet.' : `No ${filter.replace('-', ' ')} products found.`}
              </p>
              <Button variant="primary" className="seller-products-add-btn" onClick={handleCreateClick}>
                Add Your First Product
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

    {/* Product Form Modal */}
    <Modal show={showModal} onHide={handleModalClose} size="lg" contentClassName="seller-products-modal">
      <Modal.Header closeButton className="seller-products-modal-header">
        <div className="seller-products-modal-title-group">
          <span className="seller-products-modal-icon">
            <i className="fas fa-cube"></i>
          </span>
          <div>
            <Modal.Title className="seller-products-modal-title">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Modal.Title>
            <small className="text-muted">Complete the details below to showcase your product beautifully.</small>
          </div>
        </div>
        <Badge bg="info" className="seller-products-modal-badge">
          <i className="fas fa-magic me-1"></i>
          {editingProduct ? 'Enhance listing' : 'Fresh creation'}
        </Badge>
      </Modal.Header>
      <Form onSubmit={handleSubmit} className="seller-products-form">
        <Modal.Body className="seller-products-modal-body">
          <div className="seller-products-modal-highlights">
            <span className="seller-products-modal-chip">
              <i className="fas fa-image"></i>
              Add an eye-catching preview image
            </span>
            <span className="seller-products-modal-chip">
              <i className="fas fa-language"></i>
              Support both English and Amharic shoppers
            </span>
            <span className="seller-products-modal-chip">
              <i className="fas fa-ruler-combined"></i>
              Precise pricing + inventory builds trust
            </span>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>English Name *</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  type="text"
                  value={formData.name.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: { ...prev.name, en: e.target.value }
                  }))}
                  placeholder="Item name for international audience"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Amharic Name *</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  type="text"
                  value={formData.name.am}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: { ...prev.name, am: e.target.value }
                  }))}
                  placeholder="የእቃው ስም"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="seller-products-form-field">
            <Form.Label>Product Image</Form.Label>
            <Form.Control
              className="seller-products-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <Form.Text className="seller-products-hint">Use bright, high-resolution photography to capture attention.</Form.Text>
            {imagePreview && (
              <div className="seller-products-image-preview mt-3">
                <img
                  src={imagePreview}
                  alt="Product preview"
                />
              </div>
            )}
          </Form.Group>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>English Description *</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  as="textarea"
                  rows={3}
                  value={formData.description.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    description: { ...prev.description, en: e.target.value }
                  }))}
                  placeholder="Tell the story behind this product"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Amharic Description *</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  as="textarea"
                  rows={3}
                  value={formData.description.am}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    description: { ...prev.description, am: e.target.value }
                  }))}
                  placeholder="የምርቱን ተሞክሮ እና ልዩ ባህሪያት ይግለጹ"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={4}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Price (ETB) *</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Original Price (ETB)</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                  placeholder="Optional discount anchor"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Stock *</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="Units available"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Category *</Form.Label>
                <Form.Select
                  className="seller-products-input"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name?.[language] || category.name?.en || category.name?.am || category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Brand</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Optional brand name"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>Region *</Form.Label>
                <Form.Select
                  className="seller-products-input"
                  value={formData.location.region}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, region: e.target.value }
                  }))}
                  required
                >
                  {ethiopianRegions.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="seller-products-form-field">
                <Form.Label>City *</Form.Label>
                <Form.Control
                  className="seller-products-input"
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  placeholder="Where customers can collect"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="seller-products-form-field">
            <Form.Label>Tags</Form.Label>
            <Form.Control
              className="seller-products-input"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Separate tags with commas (e.g., electronics, gadget, mobile)"
            />
            <Form.Text className="seller-products-hint">Tags help shoppers discover your product faster.</Form.Text>
          </Form.Group>

          <Form.Group className="seller-products-form-field">
            <Form.Check
              type="checkbox"
              label="Free Shipping"
              checked={formData.shipping.freeShipping}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                shipping: { ...prev.shipping, freeShipping: e.target.checked }
              }))}
            />
          </Form.Group>

          {!formData.shipping.freeShipping && (
            <Form.Group className="seller-products-form-field">
              <Form.Label>Shipping Cost (ETB)</Form.Label>
              <Form.Control
                className="seller-products-input"
                type="number"
                step="0.01"
                value={formData.shipping.shippingCost}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  shipping: { ...prev.shipping, shippingCost: e.target.value }
                }))}
                placeholder="Enter delivery charge"
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer className="seller-products-modal-footer">
          <Button variant="outline-secondary" className="seller-products-secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" className="seller-products-primary">
            {editingProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
    </Container>
  );
};

export default SellerProductsPage;