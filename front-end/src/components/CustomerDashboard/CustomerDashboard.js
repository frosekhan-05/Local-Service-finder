import React, { useState, useEffect } from 'react';
import NotificationBell from '../NotificationBell/NotificationBell';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingData, setBookingData] = useState({
    scheduled_date: '',
    customer_note: ''
  });
  const [activeTab, setActiveTab] = useState('services');

  const categories = ['All Categories', 'Plumbing', 'Gardening', 'Cleaning', 'Electrical', 'Painting', 'Assembly', 'Carpentry'];

  useEffect(() => {
    fetchServices();
    if (activeTab === 'my-bookings') {
      fetchMyBookings();
    }
  }, [activeTab]);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchMyBookings = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:3001/api/bookings/customer/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || service.category === selectedCategory;
    const matchesLocation = !location || service.location.toLowerCase().includes(location.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const handleBookNow = (service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Please login to book a service');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          customer_id: user.id,
          scheduled_date: bookingData.scheduled_date,
          customer_note: bookingData.customer_note
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Booking request sent successfully!');
        setShowBookingModal(false);
        setSelectedService(null);
        setBookingData({ scheduled_date: '', customer_note: '' });
        fetchMyBookings(); // Refresh bookings
      } else {
        alert('Failed to send booking request: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to send booking request');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'pending', text: 'Pending' },
      accepted: { class: 'accepted', text: 'Accepted' },
      rejected: { class: 'rejected', text: 'Declined' },
      completed: { class: 'completed', text: 'Completed' }
    };

    const config = statusConfig[status] || { class: 'pending', text: status };
    return <span className={`status-badge status-${config.class}`}>{config.text}</span>;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="customer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-top">
            <div>
              <h1>Local Service Finder</h1>
              <p>Find and book trusted local services</p>
            </div>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Find Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-bookings')}
        >
          My Bookings ({bookings.length})
        </button>
      </div>

      {activeTab === 'services' && (
        <>
          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search for services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Enter your location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="category-filter">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="services-container">
            <h2 className="services-title">Available Services</h2>
            
            {filteredServices.length === 0 ? (
              <div className="no-services">
                <p>No services found matching your criteria.</p>
              </div>
            ) : (
              <div className="services-grid">
                {filteredServices.map(service => (
                  <div key={service.id} className="service-card">
                    <div className="service-header">
                      <h3 className="service-title">{service.title}</h3>
                      <span className="service-category">{service.category}</span>
                    </div>
                    
                    <div className="service-provider-location">
                      <p className="service-provider">by {service.provider_email}</p>
                      <p className="service-location">📍 {service.location}</p>
                    </div>
                    
                    <p className="service-description">{service.description}</p>
                    
                    <div className="service-footer">
                      <div className="service-price">
                        ₹{formatPrice(service.price)}
                      </div>
                      <button 
                        className="book-now-btn"
                        onClick={() => handleBookNow(service)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'my-bookings' && (
        <div className="bookings-container">
          <h2 className="bookings-title">My Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="no-bookings">
              <p>No bookings yet. Book a service to see your bookings here.</p>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>{booking.service_title}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="booking-details">
                    <p><strong>Provider:</strong> {booking.provider_email}</p>
                    <p><strong>Scheduled:</strong> {new Date(booking.scheduled_date).toLocaleString()}</p>
                    <p><strong>Price:</strong> ₹{formatPrice(booking.price)}</p>
                    {booking.customer_note && (
                      <p><strong>Your Note:</strong> {booking.customer_note}</p>
                    )}
                    {booking.provider_note && (
                      <p><strong>Provider Note:</strong> {booking.provider_note}</p>
                    )}
                  </div>
                  
                  <div className="booking-footer">
                    <span className="booking-date">
                      Booked on: {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Book Service: {selectedService?.title}</h3>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={bookingData.scheduled_date}
                  onChange={(e) => setBookingData({...bookingData, scheduled_date: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={bookingData.customer_note}
                  onChange={(e) => setBookingData({...bookingData, customer_note: e.target.value})}
                  className="form-input form-textarea"
                  placeholder="Any specific requirements..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowBookingModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;