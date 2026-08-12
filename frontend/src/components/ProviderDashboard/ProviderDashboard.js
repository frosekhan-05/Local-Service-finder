import React, { useState, useEffect } from 'react';
import './ProviderDashboard.css';

const ProviderDashboard = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: ''
  });
  const [editingService, setEditingService] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const categories = ['Plumbing', 'Gardening', 'Cleaning', 'Electrical', 'Painting', 'Assembly', 'Carpentry', 'Other'];

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user) {
      fetchServices();
      if (activeTab === 'bookings') {
        fetchBookings();
      }
    }
  }, [activeTab, user]);

  const fetchServices = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/services/provider/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/provider/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to add services');
      return;
    }

    try {
      const url = editingService 
        ? `http://localhost:3001/api/services/${editingService.id}`
        : 'http://localhost:3001/api/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          provider_id: user.id,
          price: parseFloat(formData.price)
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (editingService) {
          setServices(services.map(service => 
            service.id === editingService.id 
              ? { ...service, ...formData, price: parseFloat(formData.price) }
              : service
          ));
          setEditingService(null);
          alert('Service updated successfully!');
        } else {
          setServices([{
            id: data.service?.id || Date.now(), // Fallback for immediate UI update
            ...formData,
            price: parseFloat(formData.price),
            provider_id: user.id,
            created_at: new Date().toISOString()
          }, ...services]);
          alert('Service added successfully!');
        }
        
        setFormData({
          title: '',
          description: '',
          price: '',
          category: '',
          location: ''
        });
      } else {
        alert('Failed to save service: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      category: service.category,
      location: service.location
    });
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteService = async (serviceId) => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:3001/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_id: user.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setServices(services.filter(service => service.id !== serviceId));
        setShowDeleteConfirm(null);
        alert('Service deleted successfully!');
      } else {
        alert('Failed to delete service: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const cancelEdit = () => {
    setEditingService(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      location: ''
    });
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: status,
          provider_note: null
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchBookings(); // Refresh bookings
        alert(`Booking ${status} successfully`);
      } else {
        alert('Failed to update booking: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  const getActiveBookingsCount = (serviceId) => {
    return bookings.filter(booking => 
      booking.service_id === serviceId && 
      ['pending', 'accepted'].includes(booking.status)
    ).length;
  };

  return (
    <div className="provider-dashboard">
      <header className="provider-header">
        <div className="header-content">
          <h1>Service Provider Dashboard</h1>
          <p>Manage your services and customer bookings</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          My Services ({services.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings ({bookings.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'services' && (
          <>
            <div className="form-section">
              <div className="form-card">
                <h2>{editingService ? 'Edit Service' : 'Add a New Service'}</h2>
                
                {editingService && (
                  <div className="edit-notice">
                    <p>Editing: <strong>{editingService.title}</strong></p>
                    <button onClick={cancelEdit} className="btn btn-outline btn-small">
                      Cancel Edit
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="service-form">
                  <div className="form-group">
                    <label>Service Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Complete Lawn Care Package"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      placeholder="Describe your service in detail..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        placeholder="800"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      placeholder="City or area you serve"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <button type="submit" className="create-service-btn">
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </form>
              </div>
            </div>

            <div className="services-section">
              <h2>My Services ({services.length})</h2>
              
              {services.length === 0 ? (
                <div className="no-services">
                  <p>No services added yet. Create your first service!</p>
                </div>
              ) : (
                <div className="services-list">
                  {services.map(service => {
                    const activeBookings = getActiveBookingsCount(service.id);
                    return (
                      <div key={service.id} className="service-item">
                        <div className="service-item-header">
                          <h3>{service.title}</h3>
                          <div className="service-header-actions">
                            <span className="service-category">{service.category}</span>
                            {activeBookings > 0 && (
                              <span className="active-bookings-badge">
                                {activeBookings} active booking{activeBookings !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="service-description">{service.description}</p>
                        
                        <div className="service-item-footer">
                          <div className="service-details">
                            <span className="service-price">₹{formatPrice(service.price)}</span>
                            <span className="service-location">{service.location}</span>
                          </div>
                          
                          <div className="service-actions">
                            <button 
                              onClick={() => handleEditService(service)}
                              className="btn-edit"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(service.id)}
                              className="btn-delete"
                              disabled={activeBookings > 0}
                              title={activeBookings > 0 ? 'Cannot delete service with active bookings' : ''}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Delete Confirmation Modal */}
                        {showDeleteConfirm === service.id && (
                          <div className="delete-confirm-overlay">
                            <div className="delete-confirm-modal">
                              <h4>Confirm Delete</h4>
                              <p>Are you sure you want to delete "{service.title}"?</p>
                              {activeBookings > 0 && (
                                <p className="warning-text">
                                  ⚠️ This service has {activeBookings} active booking{activeBookings !== 1 ? 's' : ''}. 
                                  You cannot delete it until all bookings are completed or cancelled.
                                </p>
                              )}
                              <div className="delete-confirm-actions">
                                <button 
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="btn btn-outline"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleDeleteService(service.id)}
                                  className="btn btn-accent"
                                  disabled={activeBookings > 0}
                                >
                                  Delete Service
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h2>Customer Bookings</h2>
            
            {bookings.length === 0 ? (
              <div className="no-bookings">
                <p>No bookings yet. Your bookings will appear here.</p>
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-header">
                      <h3>{booking.service_title}</h3>
                      <span className={`status-badge status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="booking-details">
                      <p><strong>Customer:</strong> {booking.customer_email}</p>
                      <p><strong>Scheduled:</strong> {new Date(booking.scheduled_date).toLocaleString()}</p>
                      {booking.customer_note && (
                        <p><strong>Customer Note:</strong> {booking.customer_note}</p>
                      )}
                    </div>
                    {booking.status === 'pending' && (
                      <div className="booking-actions">
                        <button 
                          onClick={() => handleBookingStatus(booking.id, 'accepted')}
                          className="btn btn-secondary"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleBookingStatus(booking.id, 'rejected')}
                          className="btn btn-outline"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {booking.status === 'accepted' && (
                      <div className="booking-actions">
                        <button 
                          onClick={() => handleBookingStatus(booking.id, 'completed')}
                          className="btn btn-primary"
                        >
                          Mark Completed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;