import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Plus,
  ShieldCheck,
  Hotel,
  MapPin,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const AdminConsolePage = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form toggles
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [newHotel, setNewHotel] = useState({
    organization_id: '',
    name: '',
    address: '',
    contact_number: '',
    email: '',
    status: 'ACTIVE'
  });

  const [assignData, setAssignData] = useState({
    hotel_id: '',
    receptionist_id: ''
  });

  const [notification, setNotification] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgRes, hotelRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/hotels')
      ]);
      setOrganizations(orgRes.data);
      setHotels(hotelRes.data);

      if (orgRes.data.length > 0 && !newHotel.organization_id) {
        setNewHotel((prev) => ({ ...prev, organization_id: orgRes.data[0].id }));
      }
      if (hotelRes.data.length > 0 && !assignData.hotel_id) {
        setAssignData((prev) => ({ ...prev, hotel_id: hotelRes.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setNotification({ type: '', text: '' });
    try {
      await api.post('/organizations', { name: newOrgName, status: 'ACTIVE' });
      setNotification({ type: 'success', text: `Organization "${newOrgName}" created successfully.` });
      setNewOrgName('');
      setShowOrgForm(false);
      loadData();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.detail || "Failed to create organization." });
    }
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    setNotification({ type: '', text: '' });
    try {
      const payload = {
        organization_id: parseInt(newHotel.organization_id),
        name: newHotel.name,
        address: newHotel.address,
        contact_number: newHotel.contact_number,
        email: newHotel.email,
        status: newHotel.status
      };
      await api.post('/hotels', payload);
      setNotification({ type: 'success', text: `Hotel "${newHotel.name}" added to organization.` });
      setNewHotel({
        organization_id: organizations[0]?.id || '',
        name: '',
        address: '',
        contact_number: '',
        email: '',
        status: 'ACTIVE'
      });
      setShowHotelForm(false);
      loadData();
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.detail || "Failed to add hotel." });
    }
  };

  const handleAssignReceptionist = async (e) => {
    e.preventDefault();
    setNotification({ type: '', text: '' });
    try {
      await api.post(`/hotels/${assignData.hotel_id}/receptionists`, {
        receptionist_id: parseInt(assignData.receptionist_id)
      });
      setNotification({ type: 'success', text: `Receptionist #${assignData.receptionist_id} assigned to hotel.` });
      setShowAssignForm(false);
    } catch (err) {
      setNotification({ type: 'error', text: err.response?.data?.detail || "Failed to assign receptionist." });
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Exclusive Admin Management Portal
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
          Organizations & Hotel Properties Control
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage multi-organization hierarchy, create new hotel nodes with addresses and phone contacts, and assign receptionists.
        </p>
      </div>

      {notification.text && (
        <div style={{
          background: notification.type === 'success' ? 'var(--accent-light)' : 'var(--danger-light)',
          color: notification.type === 'success' ? 'var(--accent)' : 'var(--danger)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.75rem',
          fontSize: '0.88rem',
          border: '1px solid currentColor'
        }}>
          {notification.text}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          onClick={() => { setShowOrgForm(!showOrgForm); setShowHotelForm(false); setShowAssignForm(false); }}
          className="btn-primary"
        >
          <Plus size={16} /> Create Organization
        </button>
        <button
          onClick={() => { setShowHotelForm(!showHotelForm); setShowOrgForm(false); setShowAssignForm(false); }}
          className="btn-secondary"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
        >
          <Hotel size={16} /> Add Hotel to Organization
        </button>
        <button
          onClick={() => { setShowAssignForm(!showAssignForm); setShowOrgForm(false); setShowHotelForm(false); }}
          className="btn-secondary"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
        >
          <Users size={16} /> Assign Receptionist to Hotel
        </button>
      </div>

      {/* Create Organization Form */}
      {showOrgForm && (
        <form onSubmit={handleCreateOrg} className="card" style={{ marginBottom: '2.5rem', background: 'var(--bg-main)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            New Hospitality Organization
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Organizations serve as the top-level parent entity for multiple hotel properties and teams.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              placeholder="Organization Name (e.g. Oberoi Heritage Group)"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              style={{ flex: 1, minWidth: '260px' }}
              required
            />
            <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Create Organization
            </button>
            <button type="button" onClick={() => setShowOrgForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add Hotel to Organization Form (with Address, Phone, Email) */}
      {showHotelForm && (
        <form onSubmit={handleCreateHotel} className="card" style={{ marginBottom: '2.5rem', background: 'var(--bg-main)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Add Hotel Property to Organization
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Enter the hotel details including physical address and direct contact phone number.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Parent Organization
              </label>
              <select
                value={newHotel.organization_id}
                onChange={(e) => setNewHotel({ ...newHotel, organization_id: e.target.value })}
                required
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name} (Org #{org.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Hotel Property Name
              </label>
              <input
                placeholder="e.g. Grand Heritage Palace"
                value={newHotel.name}
                onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Contact Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 22 6665 3366"
                value={newHotel.contact_number}
                onChange={(e) => setNewHotel({ ...newHotel, contact_number: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Official Email
              </label>
              <input
                type="email"
                placeholder="e.g. reservations@hotel.com"
                value={newHotel.email}
                onChange={(e) => setNewHotel({ ...newHotel, email: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Full Physical Address
              </label>
              <input
                placeholder="e.g. Apollo Bunder, Colaba, Mumbai, Maharashtra 400001"
                value={newHotel.address}
                onChange={(e) => setNewHotel({ ...newHotel, address: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowHotelForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Hotel Property
            </button>
          </div>
        </form>
      )}

      {/* Assign Receptionist Form */}
      {showAssignForm && (
        <form onSubmit={handleAssignReceptionist} className="card" style={{ marginBottom: '2.5rem', background: 'var(--bg-main)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Assign Receptionist to Hotel
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Provide access for receptionists to view and operate rooms & cancellations for a specific hotel.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Hotel Property
              </label>
              <select
                value={assignData.hotel_id}
                onChange={(e) => setAssignData({ ...assignData, hotel_id: e.target.value })}
                required
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} (#{h.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Receptionist User ID
              </label>
              <input
                type="number"
                placeholder="e.g. 3 (Sarah Jenkins)"
                value={assignData.receptionist_id}
                onChange={(e) => setAssignData({ ...assignData, receptionist_id: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAssignForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Authorize Assignment
            </button>
          </div>
        </form>
      )}

      {/* Organizations & Hotels Hierarchy Grid */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
        Organizations & Properties Directory
      </h2>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading organizations...
        </div>
      ) : organizations.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No organizations found. Click "Create Organization" above to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {organizations.map((org) => {
            const orgHotels = hotels.filter((h) => h.organization_id === org.id);

            return (
              <div key={org.id} className="card" style={{ padding: '1.75rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Building2 size={22} color="var(--primary)" />
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {org.name}
                      </h3>
                      <span className={`badge badge-${org.status}`}>
                        {org.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Organization ID: #{org.id} • Registered {new Date(org.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {orgHotels.length} {orgHotels.length === 1 ? 'Hotel Property' : 'Hotel Properties'}
                  </span>
                </div>

                {/* Hotel Cards inside this Organization */}
                {orgHotels.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    No hotels registered under this organization yet. Click "Add Hotel to Organization" to register properties.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {orgHotels.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          background: 'var(--bg-main)',
                          padding: '1.25rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {h.name}
                            </h4>
                            <span className={`badge badge-${h.status}`}>
                              {h.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.65rem' }}>
                            <MapPin size={15} style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                            <span>{h.address}</span>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Phone size={13} /> {h.contact_number}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Mail size={13} /> {h.email}
                            </span>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Hotel ID: #{h.id} • Organization: #{h.organization_id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminConsolePage;
