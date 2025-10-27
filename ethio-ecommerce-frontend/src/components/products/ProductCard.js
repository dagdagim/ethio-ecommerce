import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';
import '../../styles/productCard.css';

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
const placeholderImage = 'https://via.placeholder.com/400x300?text=No+Image';

const getLocalized = (value, language) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || Object.values(value)[0] || '';
};

const resolveImageUrl = (product) => {
  if (!product) return placeholderImage;

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

  if (!url) return placeholderImage;

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

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { formatPrice, t, language } = useApp();

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const displayName = getLocalized(product?.name, language);
  const displayDescription = getLocalized(product?.description, language);
  const imageUrl = resolveImageUrl(product);
  const activePromotions = Array.isArray(product?.activePromotions)
    ? product.activePromotions.filter(promo => promo.status === 'Running')
    : [];

  return (
    <Card className="h-100 product-card">
      <Link to={`/product/${product._id}`} className="text-decoration-none">
        <Card.Img
          variant="top"
          src={imageUrl}
          alt={displayName}
          className="product-card-image"
        />
      </Link>
      
      <Card.Body className="d-flex flex-column product-card-body">
        <Link to={`/product/${product._id}`} className="text-decoration-none text-dark">
          <Card.Title className="h6 product-card-title">
            {displayName}
          </Card.Title>
        </Link>
        
        <Card.Text className="text-muted small flex-grow-1 product-card-description">
          {displayDescription.substring(0, 100)}...
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2 product-card-price-row">
            <span className="h5 text-primary mb-0 product-card-price">
              {formatPrice(product.price)}
            </span>
            {product.stock === 0 ? (
              <Badge bg="danger" className="product-card-stock">Out of Stock</Badge>
            ) : product.stock < 10 ? (
              <Badge bg="warning" className="product-card-stock">Low Stock</Badge>
            ) : (
              <Badge bg="success" className="product-card-stock">In Stock</Badge>
            )}
          </div>

          {activePromotions.length > 0 && (
            <div className="mb-2 d-flex flex-wrap gap-1 product-card-promotions">
              {activePromotions.map((promo, idx) => (
                <Badge key={`${promo.promotionId || idx}`} bg="warning" text="dark" className="product-card-promo-chip">
                  {promo.title}
                </Badge>
              ))}
            </div>
          )}
          
          <Button
            variant="primary"
            size="sm"
            className="w-100 product-card-button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : t('addToCart')}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;