import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Building,
  BedDouble,
  CalendarCheck,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Plus,
  Hotel,
  AlertTriangle,
  Eye,
  Search
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  // New Room form state
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_type: 'Deluxe King',
    capacity: 2,
    price_per_night: 8500,
    availability_status: 'ACTIVE',
    amenities: 'Wi-Fi, AC, Smart TV'
  });

  const isAdmin = user?.role === 'ORGANIZATION_ADMIN' || user?.role === 'PRODUCT_ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [statsRes, hotelsRes] = await Promise.all([
        api.get('/dashboard/staff-stats'),
        api.get('/hotels')
      ]);
      setStats(statsRes.data);
      setHotels(hotelsRes.data);

      const targetHotel = selectedHotel || (hotelsRes.data.length > 0 ? hotelsRes.data[0].id : '');
      if (!selectedHotel && targetHotel) {
        setSelectedHotel(targetHotel);
      }

      const bookingsRes = await api.get('/bookings', {
        params: {
          hotel_id: targetHotel || undefined,
          status_filter: statusFilter || undefined
        }
      });
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error("Failed to load operations data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    if (!selectedHotel) return;
    try {
      const res = await api.get(`/hotels/${selectedHotel}/rooms`);
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [selectedHotel, statusFilter]);

  useEffect(() => {
    loadRooms();
  }, [selectedHotel]);

  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    try {
      await api.patch(`/rooms/${roomId}/status`, { availability_status: newStatus });
      loadRooms();
      loadStaffData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update room availability");
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/hotels/${selectedHotel}/rooms`, newRoom);
      setShowAddRoom(false);
      setNewRoom({
        room_number: '',
        room_type: 'Deluxe King',
        capacity: 2,
        price_per_night: 8500,
        availability_status: 'ACTIVE',
        amenities: 'Wi-Fi, AC, Smart TV'
      });
      loadRooms();
      loadStaffData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create room");
    }
  };

  const handleStaffCancel = async (bookingId) => {
    if (!window.confirm("As authorized staff, confirm cancellation of this reservation?")) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      loadStaffData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to cancel booking");
    }
  };

  const handleViewDetails = async (bookingId) => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setSelectedBookingDetail(res.data);
    } catch (err) {
      alert("Failed to fetch booking details");
    }
  };

  // Search and filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = String(b.id).includes(term);
      const matchCustomer = String(b.customer_id).includes(term);
      const matchRoom = String(b.room_id).includes(term);
      return matchId || matchCustomer || matchRoom;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        <div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {isAdmin ? 'Hotel Administration Console' : 'Receptionist Operations Desk'}
          </span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
            {isAdmin ? 'Staff Dashboard & Operations' : 'Front Desk Booking Ledger & Rooms'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Authorized staff can view relevant customer bookings, search and filter, view booking details, and manage cancellations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            style={{ width: '240px', fontWeight: 600 }}
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <button
            onClick={loadStaffData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '42px' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Operations Metrics */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hotels in Scope</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {stats.total_hotels}
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Rooms</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {stats.total_rooms}
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Confirmed Bookings</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {stats.confirmed_bookings}
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cancellations Handled</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {stats.cancelled_bookings}
            </div>
          </div>
        </div>
      )}

      {/* Bookings Search, Filter & Ledger */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Search & Filter Customer Bookings
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Filter by status (CONFIRMED, CANCELLED, COMPLETED) or search by booking/customer reference ID
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ width: '220px' }}>
              <input
                type="text"
                placeholder="Search Booking/Customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '170px' }}
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Ref ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Room</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Check-in</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Check-out</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Total</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No relevant bookings found for the current search/filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>#{b.id}</td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>Customer #{b.customer_id}</td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>Room #{b.room_id}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>{b.check_in_date}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>{b.check_out_date}</td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{b.total_amount.toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span className={`badge badge-${b.booking_status}`}>
                          {b.booking_status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => handleViewDetails(b.id)}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                            title="View Booking Details"
                          >
                            <Eye size={13} />
                          </button>
                          {b.booking_status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleStaffCancel(b.id)}
                              className="btn-danger"
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Room Inventory & Availability Management */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Room Inventory & Availability
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Manage physical rooms, add units, and change status for maintenance
            </p>
          </div>

          <button onClick={() => setShowAddRoom(!showAddRoom)} className="btn-primary">
            <Plus size={16} /> Add Room
          </button>
        </div>

        {showAddRoom && (
          <form
            onSubmit={handleCreateRoom}
            className="card"
            style={{ marginBottom: '1.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)' }}
          >
            <h4 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Add Room to Hotel
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Room Number
                </label>
                <input
                  placeholder="e.g. 501"
                  value={newRoom.room_number}
                  onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Room Type
                </label>
                <input
                  placeholder="e.g. Executive Suite"
                  value={newRoom.room_type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Capacity
                </label>
                <input
                  type="number"
                  placeholder="2"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Price per night (₹)
                </label>
                <input
                  type="number"
                  placeholder="8500"
                  value={newRoom.price_per_night}
                  onChange={(e) => setNewRoom({ ...newRoom, price_per_night: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Amenities
                </label>
                <input
                  placeholder="King bed, City view, Wi-Fi"
                  value={newRoom.amenities}
                  onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddRoom(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Room
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {rooms.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Room #{r.room_number}
                  </span>
                  <span className={`badge badge-${r.availability_status}`}>
                    {r.availability_status}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {r.room_type}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Capacity: {r.capacity} Guests • ₹{r.price_per_night.toLocaleString()}/night
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                {r.availability_status !== 'ACTIVE' ? (
                  <button
                    onClick={() => handleUpdateRoomStatus(r.id, 'ACTIVE')}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', color: 'var(--accent)', flex: 1, padding: '0.45rem' }}
                  >
                    Set Active
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateRoomStatus(r.id, 'MAINTENANCE')}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', color: 'var(--warning)', flex: 1, padding: '0.45rem' }}
                  >
                    Set Maintenance
                  </button>
                )}
                {r.availability_status !== 'INACTIVE' && (
                  <button
                    onClick={() => handleUpdateRoomStatus(r.id, 'INACTIVE')}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', color: 'var(--danger)', padding: '0.45rem' }}
                  >
                    Disable
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <span style={{ color: 'var(--text-muted)' }}>Customer ID:</span>
                <strong style={{ color: 'var(--text-main)' }}>Customer #{selectedBookingDetail.customer_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hotel ID:</span>
                <strong style={{ color: 'var(--text-main)' }}>Hotel #{selectedBookingDetail.hotel_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Room ID:</span>
                <strong style={{ color: 'var(--text-main)' }}>Room #{selectedBookingDetail.room_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Check-in:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedBookingDetail.check_in_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Check-out:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedBookingDetail.check_out_date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Guests:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedBookingDetail.number_of_guests}</strong>
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

export default StaffDashboard;
