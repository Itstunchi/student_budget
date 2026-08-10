// src/components/notifications.js

/**
 * Returns empty array so no hardcoded or dynamic auto-generated 
 * bill notifications ever show up without user action.
 */
export const getBillNotifications = () => {
  return [];
};

export default {
  getBillNotifications,
};