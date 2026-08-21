// src/utils/notificationService.js

/**
 * Helper to fetch notifications for current active account.
 * Guarantees NO default/mock notifications are loaded.
 */
export const getNotifications = () => {
  try {
    const data = localStorage.getItem("user_notifications");
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    // Filter out any leftover mock/welcome notifications automatically
    return parsed.filter(n => 
      n && 
      !n.title?.toLowerCase().includes("welcome") && 
      n.id !== 1 && 
      n.id !== "1"
    );
  } catch (e) {
    return [];
  }
};

/**
 * Triggers a new notification for the current logged-in user.
 */
export const notify = (title, message, category = "system") => {
  try {
    const existing = getNotifications();
    
    const newNotification = {
      id: "notif_" + Date.now(),
      title,
      message,
      category,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      read: false,
    };

    const updated = [newNotification, ...existing];
    localStorage.setItem("user_notifications", JSON.stringify(updated));

    // Instant real-time UI updates across components
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("new_notification", { detail: newNotification }));
  } catch (e) {
    console.error("Error creating notification:", e);
  }
};

/**
 * Helper to mark a single notification as read
 */
export const markAsRead = (notificationId) => {
  const current = getNotifications();
  const updated = current.map((n) => n.id === notificationId ? { ...n, read: true } : n);
  localStorage.setItem("user_notifications", JSON.stringify(updated));
  window.dispatchEvent(new Event("storage"));
};

/**
 * Helper to clear all notifications safely (saves empty array so mock data never returns)
 */
export const clearAllNotifications = () => {
  localStorage.setItem("user_notifications", JSON.stringify([]));
  window.dispatchEvent(new Event("storage"));
};