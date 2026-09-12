import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Users,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  BedDouble,
  ChevronRight,
  Info,
  Phone,
  Mail,
  ShieldAlert
} from 'lucide-react';

const CustomerBrowsePage = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [checkIn, setCheckIn] = useState('2026-10-10');
  const [checkOut, setCheckOut] = useState('2026-10-14');
  const [guests, setGuests] = useState(2);
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('');

  // Map of hotel_id -> rooms list
  const [hotelRoomsMap, setHotelRoomsMap] = useState({});
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Booking modal state
  const [activeBookingHotel, setActiveBookingHotel] = useState(null);
  const [availableRoomsForModal, setAvailableRoomsForModal] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Load initial hotels
  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const res = await api.get('/hotels');
        setHotels(res.data);
      } catch (err) {
        console.error('Failed to load hotels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  // Fetch available rooms for each hotel based on search criteria
  const loadAvailableRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get('/rooms/search', {
        params: {
          check_in_date: checkIn,
          check_out_date: checkOut,
          number_of_guests: guests,
          hotel_id: selectedHotelFilter || undefined
        }
      });
      // Group rooms by hotel_id
      const grouped = {};
      res.data.forEach((r) => {
        if (!grouped[r.hotel_id]) {
          grouped[r.hotel_id] = [];
        }
        grouped[r.hotel_id].push(r);
      });
      setHotelRoomsMap(grouped);
    } catch (err) {
      console.error('Error querying rooms', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (hotels.length > 0) {
      loadAvailableRooms();
    }
  }, [hotels, checkIn, checkOut, guests, selectedHotelFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAvailableRooms();
  };

  // Open the booking modal for a specific hotel
  const handleOpenBookingModal = (hotel, initialRoom = null) => {
    setActiveBookingHotel(hotel);
    const rooms = hotelRoomsMap[hotel.id] || [];
    setAvailableRoomsForModal(rooms);
    if (initialRoom) {
      setSelectedRoomId(String(initialRoom.id));
    } else if (rooms.length > 0) {
      setSelectedRoomId(String(rooms[0].id));
    } else {
      setSelectedRoomId('');
    }
    setBookingError('');
    setBookingSuccess(null);
  };

  const calculateDuration = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
  };

  const nights = calculateDuration();
  const currentSelectedRoom = availableRoomsForModal.find(
    (r) => String(r.id) === String(selectedRoomId)
  );
  const totalAmount = currentSelectedRoom ? currentSelectedRoom.price_per_night * nights : 0;

  const handleConfirmReservation = async () => {
    if (!user) {
      alert('Please sign in to complete your reservation.');
      return;
    }
    if (!currentSelectedRoom) {
      setBookingError('Please select a room category.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    try {
      const payload = {
        hotel_id: activeBookingHotel.id,
        room_id: currentSelectedRoom.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: parseInt(guests)
      };
      const res = await api.post('/bookings', payload);
      setBookingSuccess(res.data);
      // Refresh inventory
      loadAvailableRooms();
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'This room is no longer available for the selected dates.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredHotels = hotels.filter((h) => {
    if (selectedHotelFilter && String(h.id) !== String(selectedHotelFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Discover Stays & Suites
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
          Explore our hotels and choose your preferred room with immediate confirmation.
        </p>
      </div>

      {/* Clean Modern Search Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '3rem' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}
        >
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Destination Hotel
            </label>
            <select
              value={selectedHotelFilter}
              onChange={(e) => setSelectedHotelFilter(e.target.value)}
            >
              <option value="">All Destinations</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Check-in Date
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Check-out Date
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Guests
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', height: '42px' }}
              disabled={roomsLoading}
            >
              <Search size={16} />
              {roomsLoading ? 'Checking...' : 'Update Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Hotels Listing with Room Options */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading hotel destinations...
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>No hotels found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please select another destination or clear filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {filteredHotels.map((hotel) => {
            const availableRooms = hotelRoomsMap[hotel.id] || [];

            return (
              <div
                key={hotel.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}
              >
                {/* Hotel Header Section */}
                <div style={{
                  padding: '1.75rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ flex: '1 1 350px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                      <Building size={18} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Premier Destination
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                      {hotel.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                      <MapPin size={15} />
                      <span>{hotel.address}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>📞 {hotel.contact_number}</span>
                      <span>✉️ {hotel.email}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: availableRooms.length > 0 ? 'var(--accent)' : 'var(--danger)',
                        background: availableRooms.length > 0 ? 'var(--accent-light)' : 'var(--danger-light)',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '9999px',
                        display: 'inline-block'
                      }}>
                        {availableRooms.length > 0
                          ? `${availableRooms.length} room types available`
                          : 'Sold Out for selected dates'}
                      </span>
                    </div>
                    {availableRooms.length > 0 && (
                      <button
                        onClick={() => handleOpenBookingModal(hotel)}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
                      >
                        Book at this Hotel
                      </button>
                    )}
                  </div>
                </div>

                {/* Available Rooms Grid for this Hotel */}
                <div style={{ padding: '1.75rem', background: 'var(--bg-main)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                    Select from Available Rooms ({availableRooms.length})
                  </h3>

                  {availableRooms.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--border)'
                    }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No rooms match your specific guest count or dates at this property. Try changing your dates.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
                      {availableRooms.map((room) => (
                        <div
                          key={room.id}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'border-color 0.2s, box-shadow 0.2s'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                Room {room.room_number}
                              </span>
                              <span className="badge badge-ACTIVE">
                                Up to {room.capacity} Guests
                              </span>
                            </div>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                              {room.room_type}
                            </h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem', minHeight: '36px' }}>
                              {room.description || 'Comfortable, well-appointed guest room.'}
                            </p>
                            {room.amenities && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                                {room.amenities.split(',').slice(0, 3).map((a, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '0.72rem',
                                      background: 'var(--bg-hover)',
                                      color: 'var(--text-muted)',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {a.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                ₹{room.price_per_night.toLocaleString()}
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}> / night</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                                ₹{(room.price_per_night * nights).toLocaleString()} total ({nights} nights)
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenBookingModal(hotel, room)}
                              className="btn-primary"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Confirmation & Room Selector Modal */}
      {activeBookingHotel && (
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
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle2 size={52} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Reservation Confirmed
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Your reservation reference is <strong>#{bookingSuccess.id}</strong>. A confirmation has been stored in your account.
                </p>

                <div style={{
                  background: 'var(--bg-main)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Hotel:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{activeBookingHotel.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stay:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{checkIn} to {checkOut} ({nights} nights)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Guests:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{guests}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Charged:</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>₹{bookingSuccess.total_amount.toLocaleString()}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveBookingHotel(null)}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  Close & View Details
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {activeBookingHotel.name}
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    Complete Your Reservation
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                    Select your preferred room from this hotel and review your stay summary.
                  </p>
                </div>

                {bookingError && (
                  <div style={{
                    background: 'var(--danger-light)',
                    color: 'var(--danger)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {bookingError}
                  </div>
                )}

                {/* Dropdown to select room in this hotel */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                    Choose Room in this Hotel
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    style={{ fontSize: '0.92rem', fontWeight: 600 }}
                  >
                    {availableRoomsForModal.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_type} (Room #{room.room_number}) — ₹{room.price_per_night.toLocaleString()}/night — {room.capacity} Guests Max
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Room Details Preview */}
                {currentSelectedRoom && (
                  <div style={{
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.88rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Room Selected:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{currentSelectedRoom.room_type} (#{currentSelectedRoom.room_number})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Dates:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{checkIn} → {checkOut}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Guests:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{guests} Guests</strong>
                    </div>
                    <div style={{
                      borderTop: '1px solid var(--border)',
                      marginTop: '0.65rem',
                      paddingTop: '0.65rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline'
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Price:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cancellation Policy reminder */}
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-hover)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border)'
                }}>
                  ℹ️ <strong>Cancellation Policy:</strong> Customers can cancel directly up to 24 hours prior to check-in. Cancellations within 24 hours are managed by hotel staff.
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setActiveBookingHotel(null)}
                    className="btn-secondary"
                    disabled={bookingLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReservation}
                    className="btn-primary"
                    disabled={bookingLoading || !currentSelectedRoom}
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Reservation'}
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
