import React, { useState, useEffect } from 'react';
import { getBillNotifications } from '../components/notifications';

export default function Header() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const refreshNotifications = () => {
    const alerts = getBillNotifications();
    setNotifications(alerts);
  };

  useEffect(() => {
    refreshNotifications();
    window.addEventListener('billsUpdated', refreshNotifications);
    return () => window.removeEventListener('billsUpdated', refreshNotifications);
  }, []);

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
              <h4 style={{ margin: 0 }}>Bill Notifications</h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {notifications.length} alerts
              </span>
            </div>

            <div style={headerStyles.dropdownList}>
              {notifications.length === 0 ? (
                <p style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                  No pending bill notifications for today or tomorrow. 🎉
                </p>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} style={headerStyles.notificationItem}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: item.type === 'danger' ? '#ef4444' : '#d97706' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '0.25rem' }}>
                      {item.message}
                    </div>
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
    justifyContent: 'space-between',
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
    width: '300px',
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
  dropdownList: {
    maxHeight: '260px',
    overflowY: 'auto',
  },
  notificationItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f1f5f9',
  },
};