import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Quick Local Service</h1>
          <h2>Your Trusted Local Service Platform</h2>
          <p className="hero-description">
            Finding reliable local service providers (plumbers, electricians, cleaners, etc.) can be time-consuming. 
            Our platform helps customers find ready services, check availability, and book appointments — while 
            allowing service providers to manage their listings efficiently.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Our Services</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Quick Booking</h3>
              <p>Book services remotely with our streamlined booking system. Find and book local services in just a few clicks.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Verified Providers</h3>
              <p>All service providers are thoroughly verified for quality, reliability, and professional expertise.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛠️</div>
              <h3>Wide Range of Services</h3>
              <p>From plumbing and electrical work to cleaning and gardening, we cover all your home service needs.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Transparent Pricing</h3>
              <p>No hidden costs. See upfront pricing and choose services that fit your budget perfectly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Customer Reviews</h3>
              <p>Make informed decisions with genuine reviews and ratings from other customers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>24/7 Support</h3>
              <p>Get assistance anytime with our round-the-clock customer support team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your account as a customer or service provider</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Find or List Services</h3>
              <p>Browse services or list your own professional services</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Book or Get Booked</h3>
              <p>Customers book services, providers get new clients</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Grow Together</h3>
              <p>Build your reputation and grow your business</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of satisfied customers and service providers</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-primary btn-large">
              Sign Up Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;