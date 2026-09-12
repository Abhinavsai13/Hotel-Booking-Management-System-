import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const CustomerDashboard = () => {
  const [data, setData] = useState({ upcoming: [], completed: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [message, setMessage] = useState('');

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
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelLoadingId(bookingId);
    setMessage('');
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setMessage('Booking cancelled successfully.');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not cancel booking.");
    } finally {
      setCancelLoadingId(null);
    }
  };

  const currentList = data[activeTab] || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
          My Reservations
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Manage your upcoming stays, review past bookings, and check cancellation status
        </p>
      </div>

      {message && (
        <div style={{ background: '#ecfdf5', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeTab === 'upcoming' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'upcoming' ? '2px solid #2563eb' : 'none'
          }}
        >
          Upcoming ({data.upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeTab === 'completed' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'completed' ? '2px solid #2563eb' : 'none'
          }}
        >
          Completed ({data.completed.length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeTab === 'cancelled' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'cancelled' ? '2px solid #2563eb' : 'none'
          }}
        >
          Cancelled ({data.cancelled.length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading bookings...</div>
      ) : currentList.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>No {activeTab} bookings found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentList.map((b) => (
            <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    {b.hotel_name}
                  </h3>
                  <span className={`badge badge-${b.booking_status}`}>
                    {b.booking_status}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '0.4rem' }}>
                  {b.room_type} (Room #{b.room_number})
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
                  <span>📅 Check-in: <strong>{b.check_in_date}</strong></span>
                  <span>Check-out: <strong>{b.check_out_date}</strong></span>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  ₹{b.total_amount.toLocaleString()}
                </div>

                {activeTab === 'upcoming' && b.booking_status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="btn-danger"
                    disabled={cancelLoadingId === b.id}
                  >
                    {cancelLoadingId === b.id ? 'Cancelling...' : 'Cancel Reservation'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
