import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, AlertCircle, CheckCircle2, Clock, XCircle, Hotel, Eye, X } from 'lucide-react';

const CustomerDashboard = () => {
  const [data, setData] = useState({ upcoming: [], completed: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [notification, setNotification] = useState({ type: '', text: '' });
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/customer-summary');
      setData(res.data);
    } catch (err) {
      console.error("Failed to load customer summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    setCancelLoadingId(bookingId);
    setNotification({ type: '', text: '' });
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setNotification({ type: 'success', text: 'Reservation successfully cancelled.' });
      fetchBookings();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.response?.data?.detail || "Could not cancel booking according to policy."
      });
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handleViewDetails = async (bookingId) => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setSelectedBookingDetail(res.data);
    } catch (err) {
      alert("Failed to load booking details");
    }
  };

  const currentList = data[activeTab] || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          Customer Bookings Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Track upcoming visits, historical completed bookings, and cancelled reservations with detailed status.
        </p>
      </div>

      {notification.text && (
        <div style={{
          background: notification.type === 'success' ? 'var(--accent-light)' : 'var(--danger-light)',
          color: notification.type === 'success' ? 'var(--accent)' : 'var(--danger)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          border: '1px solid currentColor'
        }}>
          {notification.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeTab === 'upcoming' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'upcoming' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Upcoming Bookings ({data.upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeTab === 'completed' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'completed' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Historical / Completed ({data.completed.length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeTab === 'cancelled' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'cancelled' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Cancelled Bookings ({data.cancelled.length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your bookings...
        </div>
      ) : currentList.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No {activeTab} bookings found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentList.map((b) => (
            <div
              key={b.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                padding: '1.5rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.45rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {b.hotel_name}
                  </h3>
                  <span className={`badge badge-${b.booking_status}`}>
                    {b.booking_status}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.45rem' }}>
                  {b.room_type} (Room #{b.room_number})
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <span>Check-in: <strong style={{ color: 'var(--text-main)' }}>{b.check_in_date}</strong></span>
                  <span>Check-out: <strong style={{ color: 'var(--text-main)' }}>{b.check_out_date}</strong></span>
                  <span>Reference: <strong style={{ color: 'var(--text-muted)' }}>#{b.id}</strong></span>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ₹{b.total_amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Total Amount
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => handleViewDetails(b.id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Eye size={14} /> View Details
                  </button>

                  {activeTab === 'upcoming' && b.booking_status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="btn-danger"
                      disabled={cancelLoadingId === b.id}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      {cancelLoadingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBookingDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem'
          }}
        >
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Booking Details #{selectedBookingDetail.id}
              </h3>
              <button onClick={() => setSelectedBookingDetail(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'var(--bg-main)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Booking Status:</span>
                <span className={`badge badge-${selectedBookingDetail.booking_status}`}>
                  {selectedBookingDetail.booking_status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Check-in Date:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedBookingDetail.check_in_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Check-out Date:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedBookingDetail.check_out_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Number of Guests:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedBookingDetail.number_of_guests}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hotel ID:</span>
                <strong style={{ color: 'var(--text-main)' }}>Hotel #{selectedBookingDetail.hotel_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Room ID:</span>
                <strong style={{ color: 'var(--text-main)' }}>Room #{selectedBookingDetail.room_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.65rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Amount:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                  ₹{selectedBookingDetail.total_amount.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedBookingDetail(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
