import React, { useState } from 'react';
import api from '../services/api';
import { Sparkles, Terminal, Play, X, Check, AlertCircle } from 'lucide-react';

const AIAssistantModal = ({ isOpen, onClose }) => {
  const [selectedTool, setSelectedTool] = useState('search_rooms');
  const [toolArgs, setToolArgs] = useState(
    JSON.stringify(
      {
        hotel_id: 1,
        check_in_date: '2026-10-10',
        check_out_date: '2026-10-14',
        number_of_guests: 2
      },
      null,
      2
    )
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const toolTemplates = {
    search_rooms: {
      hotel_id: 1,
      check_in_date: '2026-10-10',
      check_out_date: '2026-10-14',
      number_of_guests: 2
    },
    check_availability: {
      room_id: 1,
      check_in_date: '2026-10-10',
      check_out_date: '2026-10-14'
    },
    create_booking: {
      hotel_id: 1,
      room_id: 1,
      check_in_date: '2026-11-01',
      check_out_date: '2026-11-04',
      number_of_guests: 2
    },
    get_booking: {
      booking_id: 1
    },
    cancel_booking: {
      booking_id: 1
    }
  };

  const handleToolChange = (name) => {
    setSelectedTool(name);
    setToolArgs(JSON.stringify(toolTemplates[name], null, 2));
    setResult(null);
    setError(null);
  };

  const handleExecuteTool = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const parsedArgs = JSON.parse(toolArgs);
      const res = await api.post('/ai/execute', {
        tool_name: selectedTool,
        arguments: parsedArgs
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#7c3aed', padding: '0.45rem', borderRadius: '8px', color: 'white' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                AI Agent Tool Interface Simulator
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Inspect how autonomous agents call backend services via typed schemas without bypassing business rules
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#64748b' }}><X size={22} /></button>
        </div>

        {/* Tool Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {Object.keys(toolTemplates).map((name) => (
            <button
              key={name}
              onClick={() => handleToolChange(name)}
              className={selectedTool === name ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
            >
              {name}()
            </button>
          ))}
        </div>

        {/* Tool JSON Args */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
            Tool Arguments (JSON)
          </label>
          <textarea
            value={toolArgs}
            onChange={(e) => setToolArgs(e.target.value)}
            rows={5}
            style={{ fontFamily: 'monospace', fontSize: '0.88rem', background: '#0f172a', color: '#38bdf8', padding: '0.85rem' }}
          />
        </div>

        <button
          onClick={handleExecuteTool}
          className="btn-primary"
          style={{ background: '#7c3aed', width: '100%', marginBottom: '1.25rem' }}
          disabled={loading}
        >
          <Play size={16} /> {loading ? 'Invoking Service Layer...' : `Execute ${selectedTool}()`}
        </button>

        {/* Output */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <div>
              <strong>Execution Error:</strong> {error}
            </div>
          </div>
        )}

        {result && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Check size={16} /> Service Execution Succeeded
            </div>
            <pre style={{
              background: '#0f172a',
              color: '#34d399',
              padding: '1rem',
              borderRadius: '8px',
              overflowX: 'auto',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              maxHeight: '220px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantModal;
