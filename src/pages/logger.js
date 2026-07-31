// logger.js
export const logAppActivity = (activity) => {
  try {
    const existing = JSON.parse(localStorage.getItem('app_activities_log') || '[]');
    
    const newActivity = {
      id: Date.now(),
      title: activity.title || 'App Activity',
      category: activity.category || 'General',
      type: activity.type || 'Event',
      amount: activity.amount || '—',
      rawAmount: Number(activity.rawAmount) || 0, // Force to Number
      status: activity.status || 'Completed',
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updated = [newActivity, ...existing];
    localStorage.setItem('app_activities_log', JSON.stringify(updated));
    
    // Dispatch custom event for single-page dynamic re-rendering
    window.dispatchEvent(new Event('app_activity_logged'));
  } catch (error) {
    console.error("Failed to log app activity:", error);
  }
};