import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building, BedDouble, CalendarCheck, ShieldAlert, Check, X, RefreshCw, UserPlus } from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New Room modal / form state
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_type: 'Deluxe King',
    capacity: 2,
    price_per_night: 8500,
    availability_status: 'ACTIVE',
    amenities: 'Wi-Fi, AC, TV'
  });

  // Assign Receptionist state
  const [receptionistEmail, setReceptionistEmail] = useState('');
  const [assignMessage, setAssignMessage] = useState('');

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [statsRes, hotelsRes, bookingsRes] = await Promise.all([
        api.get('/dashboard/staff-stats'),
        api.get('/hotels'),
        api.get('/bookings', { params: { hotel_id: selectedHotel || undefined, status_filter: statusFilter || undefined } })
      ]);
      setStats(statsRes.data);
      setHotels(hotelsRes.data);
      setBookings(bookingsRes.data);

      if (hotelsRes.data.length > 0 && !selectedHotel) {
        setSelectedHotel(hotelsRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load staff data", err);
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
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update room status");
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/hotels/${selectedHotel}/rooms`, newRoom);
      setShowAddRoom(false);
      setNewRoom({ room_number: '', room_type: 'Deluxe King', capacity: 2, price_per_night: 8500, availability_status: 'ACTIVE', amenities: '' });
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create room");
    }
  };

  const handleStaffCancel = async (bookingId) => {
    if (!window.confirm("As authorized staff, override & cancel this booking?")) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      loadStaffData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to cancel booking");
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {user?.role === 'ORGANIZATION_ADMIN' ? 'Organization Admin Console' : 'Receptionist Operational Portal'}
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Front Desk & Property Management
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            style={{ width: '220px', fontWeight: 600 }}
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <button onClick={loadStaffData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Hotels Managed</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{stats.total_hotels}</div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active Rooms</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{stats.total_rooms}</div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Confirmed Reservations</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{stats.confirmed_bookings}</div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Revenue</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>₹{stats.total_revenue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Rooms Management Section */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              Room Inventory & Availability
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Manage physical room numbers, change status for maintenance, or add new units
            </p>
          </div>

          <button onClick={() => setShowAddRoom(!showAddRoom)} className="btn-primary">
            + Add Room
          </button>
        </div>

        {showAddRoom && (
          <form onSubmit={handleCreateRoom} className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Add New Room to Hotel</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <input
                placeholder="Room Number (e.g. 501)"
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                required
              />
              <input
                placeholder="Room Type"
                value={newRoom.room_type}
                onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Capacity"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                required
              />
              <input
                type="number"
                placeholder="Price per night (₹)"
                value={newRoom.price_per_night}
                onChange={(e) => setNewRoom({ ...newRoom, price_per_night: parseFloat(e.target.value) })}
                required
              />
              <input
                placeholder="Amenities"
                value={newRoom.amenities}
                onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
              />
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddRoom(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Room</button>
            </div>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {rooms.map((r) => (
            <div key={r.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Room {r.room_number}
                </span>
                <span className={`badge badge-${r.availability_status}`}>
                  {r.availability_status}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, marginBottom: '0.35rem' }}>
                {r.room_type}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                Capacity: {r.capacity} Guests • ₹{r.price_per_night.toLocaleString()} / night
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {r.availability_status !== 'ACTIVE' ? (
                  <button
                    onClick={() => handleUpdateRoomStatus(r.id, 'ACTIVE')}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', color: '#059669', flex: 1 }}
                  >
                    Set Active
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateRoomStatus(r.id, 'MAINTENANCE')}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', color: '#b45309', flex: 1 }}
                  >
                    Set Maintenance
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings & Front Desk Management */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
            Bookings Ledger
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Customer ID</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Room ID</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Check-in</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Check-out</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Total</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>#{b.id}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>Customer #{b.customer_id}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>Room #{b.room_id}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>{b.check_in_date}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>{b.check_out_date}</td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>₹{b.total_amount.toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className={`badge badge-${b.booking_status}`}>
                      {b.booking_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    {b.booking_status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStaffCancel(b.id)}
                        className="btn-danger"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
