import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import '../styles/homePage.css';

const HomePage = () => {
  const { t } = useApp();

  const features = [
    {
      title: 'Nationwide Delivery',
      description: 'We deliver across all regions of Ethiopia',
      icon: '🚚',
      accent: 'feature-card__icon--teal'
    },
    {
      title: 'Secure Payments',
      description: 'Pay with TeleBirr, CBE, or Cash on Delivery',
      icon: '🔒',
      accent: 'feature-card__icon--purple'
    },
    {
      title: 'Best Prices',
      description: 'Competitive prices with regular discounts',
      icon: '💰',
      accent: 'feature-card__icon--amber'
    },
    {
      title: 'Customer Support',
      description: '24/7 support in Amharic and English',
      icon: '📞',
      accent: 'feature-card__icon--rose'
    }
  ];

  const stats = [
    {
      label: 'Products',
      value: '15k+',
      icon: 'fas fa-box-open'
    },
    {
      label: 'Happy Shoppers',
      value: '180k+',
      icon: 'fas fa-user-friends'
    },
    {
      label: 'Local Sellers',
      value: '1.2k',
      icon: 'fas fa-store'
    }
  ];

  const categories = [
    {
      title: 'Fashion & Style',
      description: 'Made-in-Ethiopia fashion, curated for you.',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Electronics',
      description: 'Phones, laptops, accessories, and more tech.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Home & Living',
      description: 'Upgrade every room with local craftsmanship.',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      title: 'Beauty & Care',
      description: 'Natural wellness picks from Ethiopian brands.',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  const steps = [
    {
      title: 'Discover',
      detail: 'Browse curated collections tailored to Ethiopian shoppers.',
      icon: 'fas fa-search'
    },
    {
      title: 'Checkout Securely',
      detail: 'Choose TeleBirr, CBE, bank transfer, or cash to pay your way.',
      icon: 'fas fa-credit-card'
    },
    {
      title: 'Fast Delivery',
      detail: 'We dispatch nationwide with trusted couriers and live tracking.',
      icon: 'fas fa-shipping-fast'
    },
    {
      title: 'Love It or Return It',
      detail: 'Hassle-free returns and a dedicated support team 24/7.',
      icon: 'fas fa-headset'
    }
  ];

  const testimonials = [
    {
      quote: 'Everything arrived faster than expected and the TeleBirr payment was effortless!',
      name: 'Martha A.',
      role: 'Addis Ababa'
    },
    {
      quote: 'As a seller, EthioEcommerce helped me reach customers in every region.',
      name: 'Samuel K.',
      role: 'Hawassa'
    },
    {
      quote: 'I trust the quality and love the local brands highlighted here.',
      name: 'Rahel T.',
      role: 'Bahir Dar'
    }
  ];

  const paymentOptions = [
    ['TeleBirr', 'bg-primary'],
    ['CBE', 'bg-success'],
    ['Cash on Delivery', 'bg-warning text-dark'],
    ['Bank Transfer', 'bg-info text-dark']
  ];

  const heroHighlights = [
    { label: 'Same-day Addis delivery', icon: 'fas fa-bolt' },
    { label: 'TeleBirr & COD ready', icon: 'fas fa-wallet' },
    { label: 'Trusted by 1,200 sellers', icon: 'fas fa-handshake' }
  ];

  const partnerLogos = [
    'Ethio Telecom',
    'Dashen Bank',
    'Habesha Breweries',
    'Zemen Bank',
    'Awash Insurance',
    'Sunrise Fashion',
    'Lucy Leather',
    'Blue Nile Foods'
  ];

  const spotlight = {
    title: 'Spotlight on artisans',
    description:
      'We collaborate with local cooperatives to bring handcrafted leather goods, woven textiles, and gourmet flavors to shoppers everywhere.',
    bulletPoints: [
      'Direct partnerships with 300+ artisans',
      'Fair pricing and sustainable sourcing',
      'Storytelling that celebrates Ethiopian culture'
    ],
    image:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1060&q=80'
  };

  const appBenefits = [
    {
      title: 'Track deliveries live',
      description: 'Map-based updates and SMS alerts when your package is nearby.',
      icon: 'fas fa-location-arrow'
    },
    {
      title: 'Checkout in one tap',
      description: 'Save TeleBirr and card details securely for faster payment.',
      icon: 'fas fa-mobile-alt'
    },
    {
      title: 'Member-only rewards',
      description: 'Earn points for every purchase and unlock seasonal perks.',
      icon: 'fas fa-gift'
    }
  ];

  return (
    <div className="home-page-wrapper">
      {/* Hero Section */}
      <section className="home-hero text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="home-hero__eyebrow mb-3">
                <i className="fas fa-circle me-2"></i>
                {t('welcomeTo')} EthioEcommerce
              </div>
              <h1 className="display-3 fw-bold mb-3 home-hero__title">
                Experience Ethiopian commerce, reimagined
              </h1>
              <p className="lead mb-4 home-hero__subtitle">
                Discover modern brands and beloved local artisans in one vibrant marketplace—with secure payments and
                lightning-fast delivery everywhere in Ethiopia.
              </p>

              <div className="home-hero__actions mb-4">
                <Button as={Link} to="/products" variant="light" size="lg" className="home-hero__cta">
                  <i className="fas fa-shopping-bag me-2"></i>
                  {t('shopNow')}
                </Button>
                <Button
                  as={Link}
                  to="/about"
                  variant="outline-light"
                  size="lg"
                  className="home-hero__cta home-hero__cta--ghost"
                >
                  <i className="fas fa-play me-2"></i>
                  Explore Our Story
                </Button>
              </div>

              <div className="home-hero__highlights mt-3">
                {heroHighlights.map(({ label, icon }) => (
                  <span key={label} className="home-hero__highlight">
                    <i className={`${icon} me-2`}></i>
                    {label}
                  </span>
                ))}
              </div>

              <div className="home-hero__rating mt-4">
                <div className="home-hero__rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i key={star} className="fas fa-star"></i>
                  ))}
                </div>
                <div>
                  <strong>4.9/5</strong>
                  <span className="text-white-50 ms-2">Loved by 32k Ethiopian shoppers</span>
                </div>
              </div>

              <div className="home-hero__stats mt-5">
                {stats.map(({ label, value, icon }) => (
                  <div key={label} className="home-hero__stat shadow-sm">
                    <div className="home-hero__stat-icon">
                      <i className={icon}></i>
                    </div>
                    <div>
                      <div className="home-hero__stat-value">{value}</div>
                      <div className="home-hero__stat-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
            <Col lg={6}>
              <div className="home-hero__visual">
                <div className="home-hero__blob home-hero__blob--one"></div>
                <div className="home-hero__blob home-hero__blob--two"></div>
                <div className="home-hero__pattern"></div>
                <img src="/images/hero-image.jpg" alt="Shopping" className="home-hero__image" />
                <Card className="home-hero__floating-card home-hero__floating-card--shipping shadow-lg">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="home-hero__floating-icon home-hero__floating-icon--shipping">
                        <i className="fas fa-truck"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">Express dispatch</div>
                        <small className="text-muted">Same-day delivery in Addis Ababa</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                <Card className="home-hero__floating-card home-hero__floating-card--secure shadow">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="home-hero__floating-icon home-hero__floating-icon--secure">
                        <i className="fas fa-shield-alt"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">Secure checkout</div>
                        <small className="text-muted">TeleBirr · CBE · Chapa · COD</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                <div className="home-hero__spark"></div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Partner Marquee */}
      <section className="home-partners py-4">
        <Container>
          <Row className="align-items-center g-3">
            <Col lg={3} className="text-lg-start text-center">
              <div className="home-partners__title">Trusted by Ethiopian brands</div>
            </Col>
            <Col lg={9}>
              <div className="home-partners__ticker">
                <div className="home-partners__track">
                  {partnerLogos.concat(partnerLogos).map((name, index) => (
                    <span key={`${name}-${index}`} className="home-partners__item">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 home-section">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2>Why Choose Us?</h2>
              <p className="lead">We make online shopping easy and reliable in Ethiopia</p>
            </Col>
          </Row>
          <Row>
            {features.map((feature) => (
              <Col key={feature.title} md={6} lg={3} className="mb-4">
                <Card className="h-100 text-center border-0 shadow feature-card">
                  <Card.Body>
                    <div className={`feature-card__icon ${feature.accent}`}>{feature.icon}</div>
                    <Card.Title>{feature.title}</Card.Title>
                    <Card.Text className="text-muted">{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Featured Categories */}
      <section className="home-section home-section--soft py-5">
        <Container>
          <Row className="align-items-center mb-4">
            <Col lg={8}>
              <h2 className="mb-2">Discover collections you will love</h2>
              <p className="text-muted mb-0">
                Explore vibrant categories curated for Ethiopian lifestyles and communities.
              </p>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <Button as={Link} to="/products" variant="primary" size="lg">
                Browse All Products
              </Button>
            </Col>
          </Row>

          <Row>
            {categories.map(({ title, description, gradient }) => (
              <Col key={title} md={6} className="mb-4">
                <Card className="category-card border-0 shadow-lg" style={{ backgroundImage: gradient }}>
                  <Card.Body>
                    <Badge bg="light" text="dark" className="mb-3">
                      Top Picks
                    </Badge>
                    <Card.Title className="text-white fs-3">{title}</Card.Title>
                    <Card.Text className="text-white-50 mb-4">{description}</Card.Text>
                    <Button as={Link} to="/products" variant="light">
                      Shop {title.split(' ')[0]}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Artisan Spotlight */}
      <section className="home-section home-section--spotlight py-5">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={6}>
              <div className="home-spotlight__visual">
                <div className="home-spotlight__glow"></div>
                <img src={spotlight.image} alt="Artisan products" className="home-spotlight__image" />
                <div className="home-spotlight__badge">
                  <i className="fas fa-heart me-2"></i>Supporting local artisans
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="home-spotlight__copy">
                <Badge bg="primary" className="home-spotlight__tag mb-3">
                  Community Impact
                </Badge>
                <h2 className="mb-3">{spotlight.title}</h2>
                <p className="text-muted mb-4">{spotlight.description}</p>
                <ul className="home-spotlight__list">
                  {spotlight.bulletPoints.map((point) => (
                    <li key={point}>
                      <i className="fas fa-check-circle me-2 text-primary"></i>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <Button as={Link} to="/categories" variant="primary">
                    Explore artisan picks
                  </Button>
                  <Button as={Link} to="/seller" variant="outline-primary">
                    Partner with us
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How it Works */}
      <section className="home-section py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="mb-3">How EthioEcommerce works</h2>
              <p className="text-muted">
                A few simple steps are all it takes to bring your favourite products to your door.
              </p>
            </Col>
          </Row>
          <Row>
            {steps.map(({ title, detail, icon }, index) => (
              <Col key={title} md={6} lg={3} className="mb-4">
                <div className="timeline-card h-100">
                  <div className="timeline-card__index">{index + 1}</div>
                  <div className="timeline-card__icon">
                    <i className={icon}></i>
                  </div>
                  <h5 className="mt-3">{title}</h5>
                  <p className="text-muted mb-0">{detail}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="home-section home-section--gradient py-5 text-white">
        <Container>
          <Row className="mb-5 justify-content-between align-items-center">
            <Col lg={7}>
              <h2 className="mb-2">Voices from our community</h2>
              <p className="mb-0 text-white-50">Thousands of Ethiopians trust us with their everyday shopping.</p>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <Button as={Link} to="/register" variant="light">
                Join our marketplace
              </Button>
            </Col>
          </Row>

          <Row>
            {testimonials.map(({ quote, name, role }) => (
              <Col key={name} md={4} className="mb-4">
                <Card className="testimonial-card border-0 h-100">
                  <Card.Body>
                    <i className="fas fa-quote-left testimonial-card__icon"></i>
                    <p className="testimonial-card__quote">{quote}</p>
                  </Card.Body>
                  <Card.Footer className="bg-transparent border-0">
                    <div className="fw-semibold">{name}</div>
                    <small className="text-white-50">{role}</small>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Payment Methods Section */}
      <section className="bg-light py-5">
        <Container>
          <Row className="text-center mb-4">
            <Col>
              <h3>Pay your way</h3>
              <p className="text-muted">Flexible and secure options trusted across Ethiopia.</p>
            </Col>
          </Row>
          <Row className="g-4 justify-content-center">
            {paymentOptions.map(([label, variant]) => (
              <Col key={label} xs={6} md={3}>
                <Card className="payment-card border-0 shadow-sm h-100">
                  <Card.Body className="d-flex align-items-center justify-content-center">
                    <Badge className={`p-3 fs-6 ${variant}`}>{label}</Badge>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* App Experience */}
      <section className="home-section home-section--app py-5">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5}>
              <div className="home-app__card shadow-lg">
                <div className="home-app__screen">
                  <div className="home-app__status">EthioEcommerce</div>
                  <div className="home-app__orders">
                    <div className="home-app__order">
                      <span>Leather Satchel</span>
                      <small className="text-primary">Out for delivery</small>
                    </div>
                    <div className="home-app__order">
                      <span>Shea Butter Collection</span>
                      <small className="text-success">Delivered</small>
                    </div>
                    <div className="home-app__order">
                      <span>Injera Stove</span>
                      <small className="text-warning">Preparing</small>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <Badge bg="light" text="dark" className="mb-3">
                App Experience
              </Badge>
              <h2 className="mb-3">Shopping that travels with you</h2>
              <p className="text-muted mb-4">
                Manage orders, chat with sellers, and unlock rewards using the EthioEcommerce mobile experience.
              </p>
              <Row className="g-3 mb-4">
                {appBenefits.map(({ title, description, icon }) => (
                  <Col key={title} sm={6}>
                    <div className="home-app__benefit">
                      <div className="home-app__benefit-icon">
                        <i className={icon}></i>
                      </div>
                      <div>
                        <h6>{title}</h6>
                        <p className="text-muted mb-0">{description}</p>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="d-flex flex-wrap gap-3">
                <Button variant="dark" className="home-app__store">
                  <i className="fab fa-google-play me-2"></i>
                  Google Play (soon)
                </Button>
                <Button variant="outline-dark" className="home-app__store">
                  <i className="fab fa-apple me-2"></i>
                  App Store (soon)
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA */}
      <section className="home-cta py-5">
        <Container>
          <Card className="home-cta__card border-0 shadow-lg">
            <Card.Body className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
              <div className="mb-4 mb-lg-0">
                <Badge bg="light" text="dark" className="mb-2">
                  Grow with us
                </Badge>
                <h2 className="mb-2">Ready to start selling to the whole country?</h2>
                <p className="mb-0 text-muted">
                  Launch your storefront today and tap into thousands of engaged buyers on EthioEcommerce.
                </p>
              </div>
              <div className="d-flex gap-3">
                <Button as={Link} to="/seller/register" variant="primary" size="lg">
                  Become a Seller
                </Button>
                <Button as={Link} to="/contact" variant="outline-primary" size="lg">
                  Talk to our team
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;