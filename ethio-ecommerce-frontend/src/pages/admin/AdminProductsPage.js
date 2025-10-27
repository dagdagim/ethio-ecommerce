import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim();

const resolveAssetBaseUrl = () => {
  const envAsset = (process.env.REACT_APP_ASSET_BASE_URL || '').trim();
  if (envAsset) {
    return envAsset;
  }

  if (apiBaseUrl) {
    return apiBaseUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return '';
};

const assetBaseUrl = resolveAssetBaseUrl();
const fallbackImageUrl = 'https://via.placeholder.com/60?text=No+Image';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
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

  const { ethiopianRegions, language } = useApp();

  // Safe localization helper: accepts either a localized map {en,am} or a plain string
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') return obj[language] || obj.en || Object.values(obj)[0] || '';
    return '';
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts({ limit: 100 });
      let filteredProducts = response.data.data;

      if (filter !== 'all') {
        if (filter === 'low-stock') {
          filteredProducts = filteredProducts.filter(product => product.stock < 10);
        } else if (filter === 'out-of-stock') {
          filteredProducts = filteredProducts.filter(product => product.stock === 0);
        } else if (filter === 'inactive') {
          filteredProducts = filteredProducts.filter(product => product.status === 'inactive');
        }
      }

      setProducts(filteredProducts);
    } catch (error) {
      setError('Failed to load products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchCategories = useCallback(async () => {
    try {
      const list = await categoriesAPI.getCategoriesList();
      console.debug('AdminProductsPage: fetched categories (normalized)', list);
      setCategories(list);
      return list;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // If the admin opens the "new product" route directly (e.g. /admin/products/new)
  // automatically open the Create Product modal so the user sees the form.
  const location = useLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Auto-open modal when visiting /admin/products/new. Do not depend on
    // `handleCreateClick` to avoid stale-deps lint warnings; inline the
    // minimal logic here.
    (async () => {
      try {
        if (location && location.pathname && location.pathname.endsWith('/new')) {
          setEditingProduct(null);
          setFormData({
            name: { en: '', am: '' },
            description: { en: '', am: '' },
            price: '',
            originalPrice: '',
            category: '',
            stock: '',
            brand: '',
            location: { region: 'Addis Ababa', city: '' },
            weight: { value: '', unit: 'g' },
            tags: '',
            shipping: { freeShipping: false, shippingCost: '0' }
          });

          if (!categories || categories.length === 0) {
            await fetchCategories();
          }
          setShowModal(true);
        }
      } catch (err) {
        console.warn('Could not auto-open new product modal', err);
      }
    })();
    // We only want to run this when pathname changes
  }, [categories, fetchCategories, location]);

  const handleCreateClick = async () => {
    setEditingProduct(null);
    setFormData({
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
    setImageFile(null);
    // Ensure categories are loaded before showing the modal so the Category select
    // has options available immediately.
    try {
      if (!categories || categories.length === 0) {
        await fetchCategories();
      }
    } catch (err) {
      console.warn('Failed to fetch categories before opening modal', err);
    }
    setShowModal(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || '',
      category: product.category?._id || '',
      stock: product.stock,
      brand: product.brand || '',
      location: product.location,
      weight: product.weight || { value: '', unit: 'g' },
      tags: product.tags?.join(', ') || '',
      shipping: product.shipping || { freeShipping: false, shippingCost: '0' }
    });
    setImageFile(null);
    // Ensure categories are available so the product's category can be selected
    // in the dropdown when editing.
    if (!categories || categories.length === 0) {
      fetchCategories().catch(err => console.warn('Failed to fetch categories', err));
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        shipping: {
          ...formData.shipping,
          shippingCost: parseFloat(formData.shipping.shippingCost)
        }
      };

      let productId = editingProduct?._id;
      let response;

      if (editingProduct) {
        response = await productsAPI.updateProduct(editingProduct._id, submitData);
      } else {
        response = await productsAPI.createProduct(submitData);
        productId = response?.data?.data?._id || response?.data?._id || productId;
      }

      if (imageFile && productId) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        try {
          await productsAPI.uploadImage(productId, uploadData);
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          alert('Product created but image upload failed. You can try uploading again from the edit menu.');
        }
      }

      handleModalClose();
      fetchProducts();
    } catch (error) {
      alert(`Failed to ${editingProduct ? 'update' : 'create'} product`);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    setImageFile(file);
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

  const getStockVariant = (stock) => {
    if (stock === 0) return 'danger';
    if (stock < 10) return 'warning';
    return 'success';
  };

  const getStockText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return `Low (${stock})`;
    return `In Stock (${stock})`;
  };

  const resolveImageUrl = (product) => {
    if (!product) return fallbackImageUrl;

    const candidates = [
      product.images?.find((img) => img?.isPrimary),
      ...(product.images || []),
      product.primaryImage,
      product.thumbnail,
      product.imageUrl,
      product.image,
      product.photo
    ];

    const candidate = candidates.find(Boolean);
    const url = typeof candidate === 'string' ? candidate : candidate?.url;

    if (!url) {
      return fallbackImageUrl;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;

    if (assetBaseUrl) {
      const normalizedBase = assetBaseUrl.endsWith('/') ? assetBaseUrl.slice(0, -1) : assetBaseUrl;
      return `${normalizedBase}${normalizedPath}`;
    }

    if (typeof window !== 'undefined') {
      const origin = `${window.location.protocol}//${window.location.hostname}:5000`;
      return `${origin}${normalizedPath}`;
    }

    return normalizedPath;
  };

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Product Management</h1>
          <p className="text-muted mb-0">Manage your product catalog</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select 
            style={{ width: '200px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
          <Button variant="primary" onClick={handleCreateClick}>
            <i className="fas fa-plus me-2"></i>
            Add Product
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Products ({products.length})
            {filter !== 'all' && <span className="text-muted"> - {filter.replace('-', ' ')}</span>}
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products || []).map(product => (
                <tr key={product._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img 
                        src={resolveImageUrl(product)} 
                        alt={getLocalized(product.name) || product.sku}
                        className="rounded me-3"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <div>
                        <div className="fw-semibold">{getLocalized(product.name)}</div>
                        {product.name && typeof product.name === 'object' && product.name.am && (
                          <small className="text-muted">{product.name.am}</small>
                        )}
                        <div>
                          <small className="text-muted">SKU: {product.sku}</small>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge bg="secondary">
                      {getLocalized(product.category?.name)}
                    </Badge>
                  </td>
                  <td>
                    <strong>ETB {(product.price || 0).toLocaleString()}</strong>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div>
                        <small className="text-muted text-decoration-line-through">
                          ETB {product.originalPrice.toLocaleString()}
                        </small>
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge bg={getStockVariant(product.stock)}>
                      {getStockText(product.stock)}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={product.status === 'active' ? 'success' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </td>
                  <td>
                      <small>
                      {product.location?.city || ''}{product.location?.city && product.location?.region ? ', ' : ''}{product.location?.region || ''}
                    </small>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        as={Link}
                        to={`/product/${product._id}`}
                        variant="outline-primary"
                        size="sm"
                        target="_blank"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleEditClick(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={product.status === 'active' ? 'warning' : 'success'}
                        size="sm"
                        onClick={() => handleStatusToggle(product._id, product.status)}
                      >
                        {product.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
              <h5>No products found</h5>
              <p className="text-muted">
                {filter === 'all' ? 'No products have been added yet.' : `No ${filter.replace('-', ' ')} products found.`}
              </p>
              <Button variant="primary" onClick={handleCreateClick}>
                Add Your First Product
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>


      {/* Product Form Modal */}
  <Modal show={showModal} onHide={handleModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? 'Edit Product' : 'Create New Product'}
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
                  <Form.Label>English Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description.en}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: { ...prev.description, en: e.target.value }
                    }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amharic Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description.am}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: { ...prev.description, am: e.target.value }
                    }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (ETB) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Price (ETB)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="For display discount"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Text muted>
                    Upload a primary product image (JPEG, PNG). You can add more images after saving.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    {(categories || []).map(category => (
                      <option key={category._id || category.id} value={category._id || category.id}>
                        {getLocalized(category.name) || category.code || category.title || (typeof category === 'string' ? category : '')}
                      </option>
                    ))}
                  </Form.Select>
                  {(categories || []).length === 0 ? (
                    <div className="mt-2">
                      <small className="text-muted">No categories loaded — ensure the backend is running and that GET /categories returns data.</small>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <small className="text-muted">Loaded {(categories || []).length} categories.</small>
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Region *</Form.Label>
                  <Form.Select
                    value={formData.location.region}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, region: e.target.value }
                    }))}
                    required
                  >
                    {(ethiopianRegions || []).map(region => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, city: e.target.value }
                    }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Separate tags with commas"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Shipping Cost (ETB)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.shipping.shippingCost}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, shippingCost: e.target.value }
                    }))}
                    disabled={formData.shipping.freeShipping}
                  />
                </Form.Group>
                <Form.Check
                  type="checkbox"
                  label="Free Shipping"
                  checked={formData.shipping.freeShipping}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping: { ...prev.shipping, freeShipping: e.target.checked }
                  }))}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminProductsPage;