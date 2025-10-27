import React from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';

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
const placeholderImage = 'https://via.placeholder.com/120?text=No+Image';

const getLocalized = (value, language) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || Object.values(value)[0] || '';
};

const toAbsoluteUrl = (urlCandidate) => {
  if (!urlCandidate) return placeholderImage;
  const url = typeof urlCandidate === 'string' ? urlCandidate : urlCandidate?.url;
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

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { formatPrice, language } = useApp();

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    updateQuantity(item._id, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item._id);
  };

  const imageSource = item?.resolvedImage || toAbsoluteUrl(item?.image || item?.images?.[0]);
  const displayName = getLocalized(item?.name, language);

  return (
    <Row className="align-items-center border-bottom pb-3 mb-3">
      <Col md={2}>
        <img 
          src={imageSource} 
          alt={displayName} 
          className="img-fluid rounded"
          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
        />
      </Col>
      
      <Col md={4}>
        <h6 className="mb-1">{displayName}</h6>
        {item.name?.am && <small className="text-muted">{item.name.am}</small>}
      </Col>
      
      <Col md={2}>
        <span className="fw-bold">{formatPrice(item.price)}</span>
      </Col>
      
      <Col md={2}>
        <Form.Select 
          value={item.quantity} 
          onChange={handleQuantityChange}
          size="sm"
        >
          {[...Array(Math.min(item.stock, 10)).keys()].map(x => (
            <option key={x + 1} value={x + 1}>
              {x + 1}
            </option>
          ))}
        </Form.Select>
      </Col>
      
      <Col md={1}>
        <span className="fw-bold">
          {formatPrice(item.price * item.quantity)}
        </span>
      </Col>
      
      <Col md={1}>
        <Button 
          variant="outline-danger" 
          size="sm"
          onClick={handleRemove}
        >
          <i className="fas fa-trash"></i>
        </Button>
      </Col>
    </Row>
  );
};

export default CartItem;