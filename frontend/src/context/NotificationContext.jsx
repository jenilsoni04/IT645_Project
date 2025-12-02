import React, { useState, useCallback } from "react";
import { NotificationContext } from "./NotificationContextCore";

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

