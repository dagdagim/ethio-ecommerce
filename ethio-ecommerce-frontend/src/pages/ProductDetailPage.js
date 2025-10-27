import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Message from '../components/common/Message';
import '../styles/ProductDetailPage.css';

const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim();

const resolveAssetBaseUrl = () => {
  const envAsset = (process.env.REACT_APP_ASSET_BASE_URL || '').trim();
  if (envAsset) return envAsset;

  if (apiBaseUrl) {
    return apiBaseUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return '';
};

const assetBaseUrl = resolveAssetBaseUrl();
const placeholderImage = 'https://via.placeholder.com/600x400?text=No+Image';

const getLocalized = (value, language) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || Object.values(value)[0] || '';
};

const resolveImageCandidates = (product) => {
  if (!product) return [];
  return [
    product.images?.find((img) => img?.isPrimary),
    ...(product.images || []),
    product.primaryImage,
    product.thumbnail,
    product.imageUrl,
    product.image,
    product.photo
  ].filter(Boolean);
};

const toAbsoluteUrl = (entry) => {
  if (!entry) return placeholderImage;
  const url = typeof entry === 'string' ? entry : entry?.url;
  if (!url) return placeholderImage;
  if (/^https?:\/\//i.test(url)) return url;

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

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { formatPrice, language } = useApp();

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      setProduct(response.data.data);
    } catch (error) {
      setError('Product not found');
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/product/' + id);
      return;
    }

    addToCart(product, quantity);
    // Show success message
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/product/' + id);
      return;
    }

    addToCart(product, quantity);
    navigate('/cart');
  };

  if (loading) return <LoadingSpinner message="Loading product..." />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!product) return <Message variant="warning">Product not found</Message>;

  const displayName = getLocalized(product?.name, language);
  const displayDescription = getLocalized(product?.description, language);
  const imageOptions = resolveImageCandidates(product);
  const mainImage = toAbsoluteUrl(imageOptions[selectedImage] || imageOptions[0]);
  const activePromotions = Array.isArray(product?.activePromotions)
    ? product.activePromotions.filter(promo => promo.status === 'Running')
    : [];

  return (
    <Container className="py-5 product-detail-page">
      <Row className="detail-hero align-items-start">
        {/* Product Images */}
        <Col md={6} className="detail-gallery-column">
          <div className="mb-4 detail-image-frame">
            <img
              src={mainImage}
              alt={displayName}
              className="img-fluid detail-main-image"
            />
          </div>

          {imageOptions.length > 1 && (
            <Row className="g-2 detail-thumb-row">
              {imageOptions.map((image, index) => (
                <Col xs={3} key={index} className="detail-thumb-col">
                  <img
                    src={toAbsoluteUrl(image)}
                    alt={`${displayName} ${index + 1}`}
                    className={`img-fluid rounded cursor-pointer detail-thumbnail ${selectedImage === index ? 'detail-thumbnail-active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* Product Info */}
        <Col md={6} className="detail-info-column">
          <div className="mb-3 detail-info-card">
            <Badge bg="secondary" className="mb-2 detail-category-badge">
              {product.category?.name?.[language] || product.category?.name?.en}
            </Badge>
            <h1 className="h2 detail-title">{displayName}</h1>
            <div className="d-flex align-items-center mb-3 detail-price-wrap">
              <span className="h3 text-primary mb-0 me-3 detail-price">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-muted text-decoration-line-through detail-price-original">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {activePromotions.length > 0 && (
              <div className="mb-3 detail-promotions">
                <h6 className="text-warning detail-promotions-title">Active Promotions</h6>
                <div className="d-flex flex-wrap gap-2 detail-promotions-list">
                  {activePromotions.map((promo, idx) => (
                    <Badge key={`${promo.promotionId || idx}`} bg="warning" text="dark" className="px-3 py-2 detail-promo-chip">
                      {promo.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            {product.stock === 0 ? (
              <Alert variant="danger" className="mb-3 detail-stock-alert">
                Out of Stock
              </Alert>
            ) : product.stock < 10 ? (
              <Alert variant="warning" className="mb-3 detail-stock-alert">
                Only {product.stock} left in stock!
              </Alert>
            ) : (
              <Alert variant="success" className="mb-3 detail-stock-alert">
                In Stock
              </Alert>
            )}

            {/* Quantity Selector */}
            <Form.Group className="mb-3 detail-quantity-group">
              <Form.Label className="detail-quantity-label"><strong>Quantity:</strong></Form.Label>
              <Form.Select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="detail-quantity-select"
                disabled={product.stock === 0}
              >
                {[...Array(Math.min(product.stock, 10)).keys()].map(x => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Action Buttons */}
            <div className="d-grid gap-2 d-md-flex mb-4 detail-action-buttons">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-fill"
              >
                <i className="fas fa-shopping-cart me-2"></i>
                Add to Cart
              </Button>
              <Button
                variant="success"
                size="lg"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-fill"
              >
                Buy Now
              </Button>
            </div>

            {/* Product Features */}
            <div className="border-top pt-3 detail-summary">
              <h5 className="detail-summary-title">Product Details</h5>
              <ul className="list-unstyled detail-summary-list">
                <li><strong>SKU:</strong> {product.sku}</li>
                <li><strong>Brand:</strong> {product.brand || 'N/A'}</li>
                <li><strong>Location:</strong> {product.location.city}, {product.location.region}</li>
                {product.weight && (
                  <li><strong>Weight:</strong> {product.weight.value} {product.weight.unit}</li>
                )}
                {product.shipping && (
                  <li>
                    <strong>Shipping:</strong> {product.shipping.freeShipping ? 'Free Shipping' : formatPrice(product.shipping.shippingCost)}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Col>
      </Row>

      {/* Product Description Tabs */}
      <Row className="mt-5 detail-secondary">
        <Col>
          <Tabs defaultActiveKey="description" className="mb-3 detail-tabs">
            <Tab eventKey="description" title="Description">
              <div className="p-4 detail-tab-panel">
                <h4 className="detail-tab-title">Product Description</h4>
                <p className="detail-tab-text" style={{ whiteSpace: 'pre-wrap' }}>{displayDescription}</p>
              </div>
            </Tab>
            
            <Tab eventKey="specifications" title="Specifications">
              <div className="p-4 detail-tab-panel">
                <h4 className="detail-tab-title">Product Specifications</h4>
                <Row className="detail-specs-row">
                  <Col md={6}>
                    <table className="table table-striped detail-specs-table">
                      <tbody>
                        <tr>
                          <td><strong>Category</strong></td>
                          <td>{product.category?.name?.[language] || product.category?.name?.en}</td>
                        </tr>
                        <tr>
                          <td><strong>SKU</strong></td>
                          <td>{product.sku}</td>
                        </tr>
                        <tr>
                          <td><strong>Brand</strong></td>
                          <td>{product.brand || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                  <Col md={6}>
                    <table className="table table-striped detail-specs-table">
                      <tbody>
                        <tr>
                          <td><strong>Location</strong></td>
                          <td>{product.location.city}, {product.location.region}</td>
                        </tr>
                        {product.weight && (
                          <tr>
                            <td><strong>Weight</strong></td>
                            <td>{product.weight.value} {product.weight.unit}</td>
                          </tr>
                        )}
                        <tr>
                          <td><strong>Stock</strong></td>
                          <td>{product.stock} units</td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                </Row>
              </div>
            </Tab>
            
            <Tab eventKey="shipping" title="Shipping & Returns">
              <div className="p-4 detail-tab-panel">
                <h4 className="detail-tab-title">Shipping Information</h4>
                <p className="detail-tab-text">We deliver across Ethiopia with the following options:</p>
                <ul className="detail-tab-list">
                  <li><strong>Standard Shipping:</strong> 3-7 business days</li>
                  <li><strong>Express Shipping:</strong> 1-3 business days</li>
                  <li><strong>Free Shipping:</strong> Available for orders over 1000 ETB in Addis Ababa</li>
                </ul>

                <h5 className="mt-4 detail-tab-subtitle">Return Policy</h5>
                <p className="detail-tab-text">We accept returns within 7 days of delivery for defective products. Items must be in original condition with all tags attached.</p>
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetailPage;