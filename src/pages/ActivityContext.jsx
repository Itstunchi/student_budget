import React, { createContext, useContext, useState, useEffect } from 'react';

const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  // Starts completely empty (no mock/fake data)
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('app_activities_log');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem('app_activities_log', JSON.stringify(activities));
  }, [activities]);

  // Function to record real actions taken in the app
  const addActivity = (newAct) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: newAct.status || 'Completed',
      ...newAct
    };
    setActivities((prev) => [entry, ...prev]);
  };

  // Function to completely wipe/clear the activity history
  const clearHistory = () => {
    setActivities([]);
    localStorage.removeItem('app_activities_log');
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity, clearHistory }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => useContext(ActivityContext);