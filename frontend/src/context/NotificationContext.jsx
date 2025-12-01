import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [meetingNotifications, setMeetingNotifications] = useState({});

  const addMeetingNotification = useCallback((data) => {
    const { meetingId, connectionId, connectionName } = data;
    setMeetingNotifications((prev) => ({
      ...prev,
      [meetingId]: {
        connectionId,
        connectionName,
        meetingId,
        createdAt: new Date(),
      },
    }));
  }, []);

  const removeMeetingNotification = useCallback((meetingId) => {
    setMeetingNotifications((prev) => {
      const copy = { ...prev };
      delete copy[meetingId];
      return copy;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setMeetingNotifications({});
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        meetingNotifications,
        addMeetingNotification,
        removeMeetingNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
