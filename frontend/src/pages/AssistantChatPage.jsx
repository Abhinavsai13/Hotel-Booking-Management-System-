import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  HelpCircle
} from 'lucide-react';

const AssistantChatPage = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! Welcome to LuxeStay Concierge. Tell me what you're looking for (e.g. 'I need a room for 2 in Mumbai from Oct 10 to Oct 14 under ₹10,000' or 'Cancel booking #1') and I will help you find and reserve it.",
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulated responsive concierge response
    setTimeout(() => {
      let reply = "Thank you for sharing your requirements! Our concierge service has recorded your preferences. Once our live AI integration is linked to this endpoint, your requests will be parsed and executed directly through our verified service layer.";
      const lower = userMessage.text.toLowerCase();
      if (lower.includes('mumbai')) {
        reply = "I see you're interested in Mumbai! Grand Heritage Palace in Colaba has Deluxe King (₹8,500/night) and Premier Sea View rooms available for your dates. Would you like me to book one?";
      } else if (lower.includes('goa')) {
        reply = "Looking for a beach holiday in Goa? Grand Oceanfront Resort on Candolim Beach features luxury rooms and suites starting at ₹8,500/night.";
      } else if (lower.includes('cancel')) {
        reply = "To cancel a booking, you can directly visit your 'My Bookings' tab if your check-in is more than 24 hours away, or provide your booking reference ID here for staff assistance.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 600);
  };

  const handleQuickPrompt = (promptText) => {
    setInputText(promptText);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
          <MessageSquare size={18} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Concierge & Booking Assistant
          </span>
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          Describe What You Need
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Tell the chatbot what dates, destination, number of guests, or room preferences you have.
          This section is ready for autonomous agent function-calling integrations.
        </p>
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button
          onClick={() => handleQuickPrompt("Find me a 2-guest room in Mumbai from Oct 10 to Oct 14")}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
        >
          📍 Find 2-guest room in Mumbai
        </button>
        <button
          onClick={() => handleQuickPrompt("Check availability for Grand Oceanfront Resort in Goa")}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
        >
          🏖️ Check Goa Resort availability
        </button>
        <button
          onClick={() => handleQuickPrompt("What is the cancellation policy for bookings?")}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
        >
          ❓ Cancellation policy explanation
        </button>
      </div>

      {/* Chat Container Card */}
      <div
        className="card"
        style={{
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {msg.sender === 'assistant' && (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bot size={20} />
                </div>
              )}

              <div>
                <div
                  style={{
                    background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-hover)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)'
                  }}
                >
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem',
                    textAlign: msg.sender === 'user' ? 'right' : 'left'
                  }}
                >
                  {msg.time}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'var(--secondary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <User size={18} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Explain what room, hotel, or reservation assistance you need..."
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssistantChatPage;
