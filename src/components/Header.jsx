import React, { useState, useEffect } from 'react';
import { getNotifications, clearAllNotifications } from '../utils/notificationService';

export default function Header() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const refreshNotifications = () => {
    const alerts = getNotifications();
    setNotifications(alerts);
  };

  useEffect(() => {
    refreshNotifications();
    
    // Listen for storage changes and new notifications in real-time
    window.addEventListener('storage', refreshNotifications);
    window.addEventListener('new_notification', refreshNotifications);
    window.addEventListener('billsUpdated', refreshNotifications);
    
    return () => {
      window.removeEventListener('storage', refreshNotifications);
      window.removeEventListener('new_notification', refreshNotifications);
      window.removeEventListener('billsUpdated', refreshNotifications);
    };
  }, []);

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearAllNotifications();
    setNotifications([]);
  };

  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.titleBox}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Overview</h2>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Notification Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={headerStyles.bellBtn}
          title="Notifications"
        >
          🔔
          {notifications.length > 0 && (
            <span style={headerStyles.badge}>{notifications.length}</span>
          )}
        </button>

        {/* Notification Dropdown Drawer */}
        {isOpen && (
          <div style={headerStyles.dropdown}>
            <div style={headerStyles.dropdownHeader}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Notifications</h4>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  style={headerStyles.clearBtn}
                >
                  Clear All
                </button>
              )}
            </div>

            <div style={headerStyles.dropdownList}>
              {notifications.length === 0 ? (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                  No new notifications. 🎉
                </p>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} style={headerStyles.notificationItem}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '0.25rem' }}>
                      {item.message}
                    </div>
                    {item.date && (
                      <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {item.date} {item.timestamp ? `• ${item.timestamp}` : ''}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const headerStyles = {
  header: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
  },
  bellBtn: {
    position: 'relative',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '0.625rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '1.1rem',
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ef4444',
    color: '#ffffff',
    fontSize: '0.6875rem',
    fontWeight: '700',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '45px',
    width: '320px',
    background: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  dropdownList: {
    maxHeight: '280px',
    overflowY: 'auto',
  },
  notificationItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f1f5f9',
  },
};