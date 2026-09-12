import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Plus, ShieldCheck, Hotel } from 'lucide-react';

const AdminPlatformDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const [orgRes, hotelRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/hotels')
      ]);
      setOrganizations(orgRes.data);
      setHotels(hotelRes.data);
    } catch (err) {
      console.error("Platform fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName) return;
    try {
      await api.post('/organizations', { name: newOrgName, status: 'ACTIVE' });
      setNewOrgName('');
      loadPlatformData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create organization");
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Platform SuperAdmin Console
        </span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
          Platform Ecosystem & Organizations
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Create and monitor multi-tenant hospitality organizations and global hotel nodes
        </p>
      </div>

      {/* Add Org Form */}
      <form onSubmit={handleCreateOrg} className="card" style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Building2 size={24} color="#7c3aed" />
        <input
          placeholder="New Organization Name (e.g. Oberoi Heritage Group)"
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          style={{ flex: 1 }}
          required
        />
        <button type="submit" className="btn-primary" style={{ background: '#7c3aed', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> Create Organization
        </button>
      </form>

      {/* Organizations List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {organizations.map((org) => {
          const orgHotels = hotels.filter((h) => h.organization_id === org.id);

          return (
            <div key={org.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {org.name}
                </h3>
                <span className={`badge badge-${org.status}`}>
                  {org.status}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                Organization ID: #{org.id} • Created {new Date(org.created_at).toLocaleDateString()}
              </p>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Hotels in Chain ({orgHotels.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {orgHotels.map((h) => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155' }}>
                      <Hotel size={14} color="#2563eb" /> {h.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPlatformDashboard;
