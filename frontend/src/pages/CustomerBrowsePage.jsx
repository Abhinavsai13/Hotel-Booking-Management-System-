import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, MapPin, Search, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const CustomerBrowsePage = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  
  // Search parameters
  const [checkIn, setCheckIn] = useState('2026-10-10');
  const [checkOut, setCheckOut] = useState('2026-10-14');
  const [guests, setGuests] = useState(2);

  // Search results
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking Modal state
  const [bookingRoom, setBookingRoom] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Initial fetch of organizations and hotels
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, hotelRes] = await Promise.all([
          api.get('/organizations'),
          api.get('/hotels')
        ]);
        setOrganizations(orgRes.data);
        setHotels(hotelRes.data);
        if (hotelRes.data.length > 0) {
          setSelectedHotel(hotelRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load hotels data', err);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/rooms/search', {
        params: {
          hotel_id: selectedHotel || undefined,
          organization_id: selectedOrg || undefined,
          check_in_date: checkIn,
          check_out_date: checkOut,
          number_of_guests: guests
        }
      });
      setRooms(res.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookingModal = (room) => {
    setBookingRoom(room);
    setBookingError('');
    setBookingSuccess(null);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      alert("Please log in first to confirm your reservation.");
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      const payload = {
        hotel_id: bookingRoom.hotel_id,
        room_id: bookingRoom.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: parseInt(guests)
      };
      const res = await api.post('/bookings', payload);
      setBookingSuccess(res.data);
      // Re-run search to refresh availability
      handleSearch();
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'Booking failed. Room may no longer be available.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Compute stay duration and price
  const calculateTotal = (pricePerNight) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const nights = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
    return { nights, total: nights * pricePerNight };
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        color: '#ffffff',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '650px', position: 'relative', zIndex: 2 }}>
          <span style={{
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1rem',
            border: '1px solid rgba(96, 165, 250, 0.3)'
          }}>
            <Sparkles size={14} /> AI-POWERED LUXURY RESERVATIONS
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.85rem' }}>
            Book Exceptional Stays with Instant Confirmation
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Browse curated rooms across premier hotels. Guaranteed zero double-booking with atomic reservation locking and flexible cancellation policies.
          </p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="card" style={{ padding: '1.75rem', marginTop: '-4.5rem', position: 'relative', zIndex: 10, boxShadow: 'var(--shadow-lg)' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
              Select Hotel
            </label>
            <select value={selectedHotel} onChange={(e) => setSelectedHotel(e.target.value)}>
              <option value="">All Hotels</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
              Check-in Date
            </label>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
              Check-out Date
            </label>
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
              Guests
            </label>
            <input type="number" min="1" max="10" value={guests} onChange={(e) => setGuests(e.target.value)} required />
          </div>

          <div>
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '42px' }} disabled={loading}>
              <Search size={18} /> {loading ? 'Searching...' : 'Search Rooms'}
            </button>
          </div>
        </form>
      </div>

      {/* Available Rooms Display */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {searched ? 'Available Rooms' : 'Featured Suites & Rooms'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {searched ? `Displaying available rooms for ${checkIn} to ${checkOut} (${guests} Guests)` : 'Search your desired dates to check real-time availability.'}
            </p>
          </div>
          {searched && (
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2563eb' }}>
              {rooms.length} rooms available
            </span>
          )}
        </div>

        {rooms.length === 0 && searched ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <AlertCircle size={44} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
              No Rooms Available for These Dates
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
              All matching rooms are currently booked or undergoing maintenance. Try adjusting your dates or guest count.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
            {rooms.map((room) => {
              const { nights, total } = calculateTotal(room.price_per_night);
              const hotel = hotels.find(h => h.id === room.hotel_id);

              return (
                <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    height: '140px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '1.25rem',
                    color: 'white',
                    position: 'relative'
                  }}>
                    <span className="badge badge-ACTIVE" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      Room {room.room_number}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {hotel?.name || 'Grand Heritage'}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                        {room.room_type}
                      </h3>
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem', minHeight: '40px' }}>
                      {room.description || 'Spacious, elegantly appointed room featuring premier amenities.'}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: '#334155', marginBottom: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={15} color="#2563eb" /> Up to {room.capacity} Guests
                      </span>
                    </div>

                    {room.amenities && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          Key Amenities
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {room.amenities.split(',').map((am, idx) => (
                            <span key={idx} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                              {am.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                          ₹{room.price_per_night.toLocaleString()}
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}> / night</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                          ₹{total.toLocaleString()} total ({nights} nights)
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenBookingModal(room)}
                        className="btn-primary"
                        style={{ fontSize: '0.88rem', padding: '0.55rem 1rem' }}
                      >
                        Reserve Room
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {bookingRoom && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Confirm Reservation
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Review your stay dates and pricing details before confirming
            </p>

            {bookingError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {bookingError}
              </div>
            )}

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle2 size={48} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Booking Confirmed!
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
                  Reservation Reference: <strong>#{bookingSuccess.id}</strong>
                </p>
                <button
                  onClick={() => setBookingRoom(null)}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ color: '#64748b' }}>Room:</span>
                    <strong style={{ color: '#0f172a' }}>{bookingRoom.room_type} (#{bookingRoom.room_number})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ color: '#64748b' }}>Check-in:</span>
                    <strong style={{ color: '#0f172a' }}>{checkIn}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ color: '#64748b' }}>Check-out:</span>
                    <strong style={{ color: '#0f172a' }}>{checkOut}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span style={{ color: '#64748b' }}>Guests:</span>
                    <strong style={{ color: '#0f172a' }}>{guests}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Amount:</span>
                    <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.1rem' }}>
                      ₹{calculateTotal(bookingRoom.price_per_night).total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.5rem', background: '#eff6ff', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                  ℹ️ <strong>Cancellation Policy:</strong> Free direct cancellation up to 24 hours prior to check-in date.
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setBookingRoom(null)} className="btn-secondary" disabled={bookingLoading}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmBooking} className="btn-primary" disabled={bookingLoading}>
                    {bookingLoading ? 'Securing Room...' : 'Confirm & Reserve'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBrowsePage;
